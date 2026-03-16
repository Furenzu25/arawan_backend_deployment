import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  full_name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  contact_number!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  province!: string;
}
