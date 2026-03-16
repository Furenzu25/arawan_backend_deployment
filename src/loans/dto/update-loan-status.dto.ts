import { IsIn } from 'class-validator';
import type { LoanStatus } from '../../common/types';

const ALLOWED_STATUSES: LoanStatus[] = ['defaulted', 'written_off'];

export class UpdateLoanStatusDto {
  @IsIn(ALLOWED_STATUSES)
  status!: 'defaulted' | 'written_off';
}
