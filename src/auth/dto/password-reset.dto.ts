import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  otpId: string; // OTP ID from forgot password request

  @IsString()
  code: string; // 6-digit verification code

  @IsString()
  newPassword: string;
}

export class SigninDto {
  @IsString()
  identifier: string; // Can be username or email

  @IsString()
  password: string;
}
