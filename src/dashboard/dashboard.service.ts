import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async getDashboard() {
    const today = this.formatDate(new Date());

    const [customersRes, activeLoansRes, overdueLoansRes, revenueRes] =
      await Promise.all([
        this.sb.from('customers').select('id', { count: 'exact', head: true }),
        this.sb.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        this.sb.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
        this.sb.from('payments').select('amount_paid').eq('status', 'paid'),
      ]);

    const totalRevenue =
      revenueRes.data?.reduce((sum, p) => sum + Number(p.amount_paid), 0) ?? 0;

    const stats = {
      totalCustomers: customersRes.count ?? 0,
      activeLoans: activeLoansRes.count ?? 0,
      totalRevenue,
      overdueLoans: overdueLoansRes.count ?? 0,
      customersTrend: 0,
      activeLoansTrend: 0,
      revenueTrend: 0,
      overdueTrend: 0,
    };

    const revenueData = await this.getMonthlyRevenue();

    const { data: duePayments } = await this.sb
      .from('payments')
      .select('*, loan:loans(*, customer:customers(id, full_name, profile_photo_url))')
      .lte('due_date', today)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(20);

    const { data: collected } = await this.sb
      .from('payments')
      .select('*, loan:loans(*, customer:customers(full_name, profile_photo_url))')
      .eq('status', 'paid')
      .gte('paid_date', today + 'T00:00:00')
      .lte('paid_date', today + 'T23:59:59')
      .order('paid_date', { ascending: false });

    const totalCollected =
      collected?.reduce((s, p) => s + Number(p.amount_paid), 0) ?? 0;

    return {
      stats,
      revenueData,
      paymentsDue: duePayments ?? [],
      todaysCollections: collected ?? [],
      totalCollected,
    };
  }

  private async getMonthlyRevenue() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const monthStart = this.formatDate(monthDate);
      const monthEndStr = this.formatDate(monthEnd);

      const { data: monthPayments } = await this.sb
        .from('payments')
        .select('amount_paid')
        .eq('status', 'paid')
        .gte('paid_date', monthStart)
        .lte('paid_date', monthEndStr + 'T23:59:59');

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push({
        month: monthNames[monthDate.getMonth()],
        revenue: monthPayments?.reduce((s, p) => s + Number(p.amount_paid), 0) ?? 0,
      });
    }

    return months;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
