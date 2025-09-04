import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class StepTwoSignupDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
