import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Headers,
  Version,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { StepOneSignupDto } from './dto/step-one-signup.dto';
import { StepTwoSignupDto } from './dto/step-two-signup.dto';
import {
  SigninDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import {
  RequestEmailVerificationDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/email-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/step1')
  @Version('1')
  stepOneSignup(@Body() dto: StepOneSignupDto) {
    return this.authService.stepOneSignup(dto);
  }

  @Post('signup/step2/:userId')
  @Version('1')
  stepTwoSignup(
    @Param('userId') userId: string,
    @Body() dto: StepTwoSignupDto,
  ) {
    return this.authService.stepTwoSignup(userId, dto);
  }

  @Post('signin')
  @Version('1')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @Post('verify-token')
  @Version('1')
  verifyToken(@Body() body: { token: string }) {
    return this.authService.verifyToken(body.token);
  }

  @Get('me')
  @Version('1')
  async getProfile(@Headers('authorization') authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token required');
    }

    const token = authorization.substring(7);
    const user = await this.authService.getUserFromToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return { user };
  }

  @Post('request-email-verification')
  @Version('1')
  requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Post('verify-email')
  @Version('1')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-email-verification')
  @Version('1')
  resendEmailVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendEmailVerification(dto);
  }

  @Post('forgot-password')
  @Version('1')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Version('1')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Development endpoint to see active OTPs
  @Get('dev/active-otps')
  @Version('1')
  getActiveOtps() {
    return this.authService.getActiveOtps();
  }
}
