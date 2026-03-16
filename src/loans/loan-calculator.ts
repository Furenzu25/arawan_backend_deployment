import { LOAN } from '../config/constants';

export function calculateLoan(principalAmount: number) {
  const interestAmount = principalAmount * LOAN.INTEREST_RATE;
  const totalPayable = principalAmount + interestAmount;
  const dailyPayment = Math.round((totalPayable / LOAN.TERM_DAYS) * 100) / 100;

  const today = new Date();
  const releaseDate = today.toISOString().split('T')[0];
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + LOAN.TERM_DAYS);

  return {
    principal_amount: principalAmount,
    interest_rate: LOAN.INTEREST_RATE * 100,
    interest_amount: interestAmount,
    total_payable: totalPayable,
    daily_payment: dailyPayment,
    term_days: LOAN.TERM_DAYS,
    release_date: releaseDate,
    due_date: dueDate.toISOString().split('T')[0],
  };
}

export function generatePaymentSchedule(
  loanId: string,
  dailyPayment: number,
  releaseDate: string,
) {
  const payments = [];
  const startDate = new Date(releaseDate);

  for (let day = 1; day <= LOAN.TERM_DAYS; day++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + day);

    payments.push({
      loan_id: loanId,
      day_number: day,
      amount_due: dailyPayment,
      amount_paid: 0,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending' as const,
    });
  }

  return payments;
}

export function calculateRemainingBalance(
  totalPayable: number,
  totalPaid: number,
): number {
  return Math.max(totalPayable - totalPaid, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}
