import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LOAN } from '../config/constants';

@Injectable()
export class ReportsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async getReport(type: string, selectedDate: string) {
    if (type === 'aging') return this.handleAging();
    if (type === 'daily') return this.handleDaily(selectedDate);
    return this.handleMonthly(selectedDate);
  }

  private getAgingBucket(days: number): string {
    if (days <= 30) return '1-30 days';
    if (days <= LOAN.TERM_DAYS) return `31-${LOAN.TERM_DAYS} days`;
    if (days <= 90) return '61-90 days';
    return '90+ days';
  }

  private async handleAging() {
    const today = new Date();
    const { data: loans } = await this.sb
      .from('loans')
      .select('id, due_date, total_payable, total_paid, status, customer:customers(full_name)')
      .in('status', ['overdue', 'defaulted'])
      .order('due_date', { ascending: true });

    const rows = [];
    for (const raw of (loans ?? []) as Record<string, unknown>[]) {
      const due = new Date(raw.due_date as string);
      if (due >= today) continue;
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amountOwed = Number(raw.total_payable) - Number(raw.total_paid);
      if (amountOwed <= 0) continue;

      const customerField = raw.customer;
      const name = Array.isArray(customerField)
        ? (customerField[0] as Record<string, unknown>)?.full_name as string
        : (customerField as Record<string, unknown>)?.full_name as string;

      rows.push({
        loanId: raw.id,
        bucketLabel: this.getAgingBucket(daysOverdue),
        customerName: name ?? 'Unknown',
        dueDate: raw.due_date,
        daysOverdue,
        amountOwed,
        status: raw.status,
      });
    }

    rows.sort((a, b) => a.daysOverdue - b.daysOverdue);
    return { type: 'aging', agingData: rows, dailyData: [], monthlyData: [] };
  }

  private async handleDaily(selectedDate: string) {
    const { data } = await this.sb
      .from('payments')
      .select('id, amount_paid, paid_date, day_number, signature_url, created_at, loan:loans(id, customer:customers(full_name))')
      .eq('status', 'paid')
      .gte('paid_date', selectedDate + 'T00:00:00')
      .lte('paid_date', selectedDate + 'T23:59:59')
      .order('paid_date', { ascending: false });

    return { type: 'daily', dailyData: data ?? [], monthlyData: [], agingData: [] };
  }

  private async handleMonthly(selectedDate: string) {
    const monthStart = new Date(selectedDate);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const startStr = this.formatDate(monthStart);
    const endStr = this.formatDate(monthEnd);

    const { data } = await this.sb
      .from('payments')
      .select('amount_paid, loan:loans(customer:customers(full_name))')
      .eq('status', 'paid')
      .gte('paid_date', startStr + 'T00:00:00')
      .lte('paid_date', endStr + 'T23:59:59');

    const grouped: Record<string, { customer: string; total_amount: number; payment_count: number }> = {};
    for (const p of (data ?? []) as unknown as { amount_paid: number; loan: { customer: { full_name: string } } }[]) {
      const name = p.loan?.customer?.full_name ?? 'Unknown';
      if (!grouped[name]) grouped[name] = { customer: name, total_amount: 0, payment_count: 0 };
      grouped[name].total_amount += Number(p.amount_paid);
      grouped[name].payment_count += 1;
    }

    return { type: 'monthly', monthlyData: Object.values(grouped), dailyData: [], agingData: [] };
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
