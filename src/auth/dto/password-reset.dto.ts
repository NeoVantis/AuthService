import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  tempCode: string; // Temporary solution instead of OTP service

  @IsString()
  newPassword: string;
}

export class SigninDto {
  @IsString()
  identifier: string; // Can be username or email

  @IsString()
  password: string;
}
