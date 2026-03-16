import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  calculateLoan,
  calculateRemainingBalance,
  formatCurrency,
  generatePaymentSchedule,
} from './loan-calculator';
import { dataUrlToBlob } from '../common/utils/data-url.util';
import {
  slugify,
  getAgreementSignaturePath,
  getPaymentSignaturePath,
} from '../common/utils/storage.util';
import type { Loan, Payment } from '../common/types';
import type { CreateLoanDto } from './dto/create-loan.dto';
import type { AgreementSignatureDto } from './dto/agreement-signature.dto';

@Injectable()
export class LoansService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async findAll(): Promise<Loan[]> {
    const { data } = await this.sb
      .from('loans')
      .select('*, customer:customers(full_name, profile_photo_url)')
      .order('created_at', { ascending: false });

    return this.ensureOverdueForList((data ?? []) as Loan[]);
  }

  async findOne(id: string) {
    const [{ data: loanData }, { data: paymentsData }] = await Promise.all([
      this.sb.from('loans').select('*, customer:customers(*)').eq('id', id).single(),
      this.sb.from('payments').select('*').eq('loan_id', id).order('day_number', { ascending: true }),
    ]);

    let loan = loanData as Loan | null;
    if (loan) {
      const updated = await this.ensureOverdueStatus(loan);
      if (updated) loan = updated;
    }

    return { loan, payments: paymentsData ?? [] };
  }

  async create(dto: CreateLoanDto) {
    const hasActive = await this.hasActiveLoan(dto.customerId);
    if (hasActive) {
      throw new ConflictException('This customer already has an active loan');
    }

    const loanData = calculateLoan(dto.principalAmount);
    const { data: loanRaw, error } = await this.sb
      .from('loans')
      .insert({
        customer_id: dto.customerId,
        ...loanData,
        total_paid: 0,
        agreement_signature_url: null,
        status: 'active',
      })
      .select()
      .single();

    if (error || !loanRaw) {
      throw new InternalServerErrorException('Failed to create loan');
    }

    const loan = loanRaw as Loan;
    let agreementSignatureUrl: string | null = null;

    if (dto.agreementSignatureDataUrl) {
      const slug = slugify(dto.customerName ?? 'unknown');
      const path = getAgreementSignaturePath(slug, loan.id, new Date());
      agreementSignatureUrl = await this.uploadToStorage(path, dataUrlToBlob(dto.agreementSignatureDataUrl));
      if (agreementSignatureUrl) {
        await this.sb.from('loans').update({ agreement_signature_url: agreementSignatureUrl }).eq('id', loan.id);
      }
    }

    const schedule = generatePaymentSchedule(loan.id, loanData.daily_payment, loanData.release_date);
    const { error: schedError } = await this.sb.from('payments').insert(schedule);

    return {
      loan,
      scheduleError: schedError ? 'schedule_insert_failed' : undefined,
      agreementSignatureUrl,
    };
  }

  async updateStatus(id: string, status: string) {
    const { error } = await this.sb.from('loans').update({ status }).eq('id', id);
    if (error) throw new InternalServerErrorException('Failed to update status');
    return { success: true };
  }

  async uploadAgreementSignature(id: string, dto: AgreementSignatureDto) {
    const slug = slugify(dto.customerName ?? 'unknown');
    const path = getAgreementSignaturePath(slug, id, new Date());
    const file = dataUrlToBlob(dto.signatureDataUrl);

    const { error: uploadErr } = await this.sb.storage.from('arawan').upload(path, file);
    if (uploadErr) throw new InternalServerErrorException('Failed to upload signature');

    const url = this.sb.storage.from('arawan').getPublicUrl(path).data.publicUrl;
    const { error } = await this.sb.from('loans').update({ agreement_signature_url: url }).eq('id', id);
    if (error) throw new InternalServerErrorException('Failed to save signature');

    return { url };
  }

  async collectPayment(
    loanId: string,
    paymentId: string,
    mode: 'single' | 'multiple' | 'payoff',
    daysCount?: number,
    signatureDataUrl?: string | null,
  ) {
    const { loan, payments: allPayments } = await this.findOne(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    const currentPayment = allPayments.find((p: Payment) => p.id === paymentId);
    if (!currentPayment) throw new NotFoundException('Payment not found');

    const remaining = calculateRemainingBalance(Number(loan.total_payable), Number(loan.total_paid));
    const unpaidPayments = allPayments.filter((p: Payment) => p.status !== 'paid');
    const maxDays = unpaidPayments.length;

    let signatureUrl: string | null = null;
    if (signatureDataUrl) {
      const slug = slugify(loan.customer?.full_name ?? 'unknown');
      const path = getPaymentSignaturePath(slug, loan.id, currentPayment.day_number, new Date());
      signatureUrl = await this.uploadToStorage(path, dataUrlToBlob(signatureDataUrl));
    }

    const now = new Date().toISOString();
    let totalPaying = 0;

    if (mode === 'payoff') {
      for (let i = 0; i < unpaidPayments.length; i++) {
        const payment = unpaidPayments[i];
        const isLast = i === unpaidPayments.length - 1;
        const amount = isLast
          ? remaining - unpaidPayments.slice(0, -1).reduce((s, pp) => s + Number(pp.amount_due), 0)
          : Number(payment.amount_due);

        await this.sb.from('payments')
          .update({ status: 'paid', amount_paid: amount, paid_date: now, signature_url: i === 0 ? signatureUrl : null })
          .eq('id', payment.id);
        totalPaying += amount;
      }
    } else {
      const count = mode === 'single' ? 1 : Math.min(Number(daysCount ?? 1), maxDays);
      const paymentsToPay = unpaidPayments.slice(0, count);

      for (let i = 0; i < paymentsToPay.length; i++) {
        const amount = Number(paymentsToPay[i].amount_due);
        await this.sb.from('payments')
          .update({ status: 'paid', amount_paid: amount, paid_date: now, signature_url: i === 0 ? signatureUrl : null })
          .eq('id', paymentsToPay[i].id);
        totalPaying += amount;
      }
    }

    const newTotalPaid = Number(loan.total_paid) + totalPaying;
    const loanCompleted = newTotalPaid >= Number(loan.total_payable);

    await this.sb.from('loans')
      .update({ total_paid: newTotalPaid, status: loanCompleted ? 'completed' : loan.status })
      .eq('id', loan.id);

    const customerName = loan.customer?.full_name ?? 'Customer';
    await this.createNotification(loan.id, 'Payment Received', `${formatCurrency(totalPaying)} collected from ${customerName}`, 'payment_received');
    if (loanCompleted) {
      await this.createNotification(loan.id, 'Loan Completed', `${customerName}'s loan has been fully paid`, 'loan_completed');
    }

    return { totalPaying, newTotalPaid, loanCompleted };
  }

  private async hasActiveLoan(customerId: string): Promise<boolean> {
    const { data } = await this.sb
      .from('loans')
      .select('id')
      .eq('customer_id', customerId)
      .in('status', ['active', 'overdue'])
      .limit(1);
    return !!(data && data.length > 0);
  }

  private async uploadToStorage(path: string, file: Blob): Promise<string | null> {
    const { error } = await this.sb.storage.from('arawan').upload(path, file);
    if (error) return null;
    return this.sb.storage.from('arawan').getPublicUrl(path).data.publicUrl;
  }

  private async createNotification(
    referenceId: string,
    title: string,
    message: string,
    type: 'payment_received' | 'loan_completed',
  ) {
    await this.sb.from('notifications').insert({ type, title, message, reference_id: referenceId });
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private shouldBeOverdue(loan: Loan): boolean {
    if (loan.status !== 'active') return false;
    const due = loan.due_date?.slice(0, 10) ?? '';
    if (due >= this.todayStr()) return false;
    return Number(loan.total_paid) < Number(loan.total_payable);
  }

  private async ensureOverdueStatus(loan: Loan): Promise<Loan | null> {
    if (!this.shouldBeOverdue(loan)) return null;
    const { data, error } = await this.sb
      .from('loans')
      .update({ status: 'overdue' })
      .eq('id', loan.id)
      .select()
      .single();
    if (error) return null;
    return data as Loan;
  }

  private async ensureOverdueForList(loans: Loan[]): Promise<Loan[]> {
    const todayStr = this.todayStr();
    const result: Loan[] = [];

    for (const loan of loans) {
      if (loan.status !== 'active') {
        result.push(loan);
        continue;
      }

      const due = loan.due_date?.slice(0, 10) ?? '';
      if (due >= todayStr || Number(loan.total_paid) >= Number(loan.total_payable)) {
        result.push(loan);
        continue;
      }

      await this.sb.from('loans').update({ status: 'overdue' }).eq('id', loan.id);
      result.push({ ...loan, status: 'overdue' as const });
    }

    return result;
  }
}
