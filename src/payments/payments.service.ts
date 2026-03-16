import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoansService } from '../loans/loans.service';
import type { CollectPaymentDto } from './dto/collect-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly loansService: LoansService,
  ) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async findAll(filter: string) {
    const today = this.todayStr();

    let query = this.sb
      .from('payments')
      .select('*, loan:loans(id, status, term_days, customer:customers(full_name, profile_photo_url))');

    if (filter === 'today') {
      query = query.eq('due_date', today);
    } else if (filter === 'overdue') {
      query = query.lt('due_date', today).eq('status', 'pending');
    } else if (filter === 'upcoming') {
      query = query.gt('due_date', today).eq('status', 'pending');
    }

    const { data } = await query.order('due_date', { ascending: true });
    return data ?? [];
  }

  async collect(dto: CollectPaymentDto) {
    return this.loansService.collectPayment(
      dto.loanId,
      dto.paymentId,
      dto.mode,
      dto.daysCount,
      dto.signatureDataUrl,
    );
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
