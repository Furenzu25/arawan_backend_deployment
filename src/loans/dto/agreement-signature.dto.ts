import { IsString, MaxLength, Matches, IsOptional } from 'class-validator';
import { FILE_LIMITS } from '../../config/constants';

export class AgreementSignatureDto {
  @IsString()
  @MaxLength(FILE_LIMITS.MAX_DATA_URL_LENGTH)
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,/, {
    message: 'Must be a base64 image data URL',
  })
  signatureDataUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string | null;
}
