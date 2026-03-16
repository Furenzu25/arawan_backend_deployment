import { IsUUID, IsNumber, Min, Max, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { LOAN, FILE_LIMITS } from '../../config/constants';

export class CreateLoanDto {
  @IsUUID()
  customerId!: string;

  @IsNumber()
  @Min(LOAN.MIN_PRINCIPAL)
  @Max(LOAN.MAX_PRINCIPAL)
  principalAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(FILE_LIMITS.MAX_DATA_URL_LENGTH)
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,/, {
    message: 'Must be a base64 image data URL',
  })
  agreementSignatureDataUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string;
}
