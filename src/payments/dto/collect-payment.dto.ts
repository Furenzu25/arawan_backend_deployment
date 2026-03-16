import { IsUUID, IsIn, IsOptional, IsInt, Min, Max, IsString, MaxLength, Matches } from 'class-validator';
import { FILE_LIMITS } from '../../config/constants';

export class CollectPaymentDto {
  @IsUUID()
  loanId!: string;

  @IsUUID()
  paymentId!: string;

  @IsIn(['single', 'multiple', 'payoff'])
  mode!: 'single' | 'multiple' | 'payoff';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  daysCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(FILE_LIMITS.MAX_DATA_URL_LENGTH)
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,/, {
    message: 'Must be a base64 image data URL',
  })
  signatureDataUrl?: string | null;
}
