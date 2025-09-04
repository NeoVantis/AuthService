import { IsEmail, IsString, Length } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailDto {
  @IsString()
  otpId: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  code: string;
}

export class ResendVerificationDto {
  @IsString()
  otpId: string;
}
