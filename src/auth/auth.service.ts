import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
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
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Generates a JWT token for the user
   * @private
   * @param user - The user for whom to generate the token
   * @returns Promise<string> - The JWT token
   */
  private async signToken(user: User): Promise<string> {
    return await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Step 1 of user registration - creates a user with basic information
   * @param dto - Basic signup information (username, email, password)
   * @returns Promise containing userId and success message
   * @throws ConflictException if email or username already exists
   */

  async stepOneSignup(
    dto: StepOneSignupDto,
  ): Promise<{ userId: string; message: string }> {
    // Check if email or username already exists
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      stepOneComplete: true,
      stepTwoComplete: false,
    });

    return {
      userId: user.id,
      message:
        'Step 1 completed. Please complete step 2 to finish registration.',
    };
  }

  /**
   * Step 2 of user registration - completes user profile with additional information
   * @param userId - The ID of the user from step 1
   * @param dto - Additional profile information (fullName, phoneNumber, etc.)
   * @returns Promise containing access token and complete user profile
   * @throws NotFoundException if user not found
   * @throws BadRequestException if step 1 not completed or step 2 already completed
   */
  async stepTwoSignup(
    userId: string,
    dto: StepTwoSignupDto,
  ): Promise<{ 
    access_token: string; 
    user: Partial<User>; 
    verificationOtpId: string;
    message: string;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stepOneComplete) {
      throw new BadRequestException('Step 1 must be completed first');
    }

    if (user.stepTwoComplete) {
      throw new BadRequestException('Registration already completed');
    }

    const updatedUser = await this.usersService.completeStepTwo(userId, {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      college: dto.college,
      address: dto.address,
    });

    // Send email verification
    const { otpId } = await this.otpService.generateEmailVerificationOtp(user.email);

    const access_token = await this.signToken(updatedUser);
    const userProfile = await this.usersService.getUserProfile(userId);

    return { 
      access_token, 
      user: userProfile as Partial<User>,
      verificationOtpId: otpId,
      message: 'Registration completed! Please check your email to verify your account before signing in.',
    };
  }

  /**
   * Authenticates a user with username or email and password
   * @param dto - Sign in credentials (identifier can be username or email, plus password)
   * @returns Promise containing access token and user profile
   * @throws UnauthorizedException if credentials invalid, registration incomplete, or account deactivated
   */

  async signin(
    dto: SigninDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isSignupComplete) {
      throw new UnauthorizedException(
        'Please complete your registration before signing in',
      );
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before signing in. Check your email for a verification link.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = await this.signToken(user);
    const userProfile = await this.usersService.getUserProfile(user.id);

    return { access_token, user: userProfile as Partial<User> };
  }


  /**
   * Verifies if a JWT token is valid and returns user information
   * @param token - The JWT token to verify
   * @returns Promise containing validation result and user info if valid
   */

  async verifyToken(
    token: string,
  ): Promise<{ valid: boolean; user?: Partial<User> }> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive) {
        return { valid: false };
      }

      const userProfile = await this.usersService.getUserProfile(user.id);
      return { valid: true, user: userProfile as Partial<User> };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Extracts user information from a valid JWT token
   * @param token - The JWT token to decode
   * @returns Promise containing user profile or null if token invalid
   */
  async getUserFromToken(token: string): Promise<Partial<User> | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return await this.usersService.getUserProfile(payload.sub);
    } catch {
      return null;
    }
  }

  /**
   * Sends email verification OTP to user's email
   * @param dto - Contains email address
   * @returns Promise containing OTP ID and message
   */
  async requestEmailVerification(
    dto: RequestEmailVerificationDto,
  ): Promise<{ otpId: string; message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    return await this.otpService.generateEmailVerificationOtp(dto.email);
  }

  /**
   * Verifies email using OTP code
   * @param dto - Contains OTP ID and verification code
   * @returns Promise containing success message
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const { email } = await this.otpService.verifyOtp(
      dto.otpId,
      dto.code,
      'EMAIL_VERIFICATION',
    );

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Mark user as verified
    await this.usersService.updateUser(user.id, {
      isVerified: true,
      emailVerifiedAt: new Date(),
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resends email verification OTP
   * @param dto - Contains OTP ID to resend
   * @returns Promise containing success message
   */
  async resendEmailVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return await this.otpService.resendOtp(dto.otpId);
  }

  /**
   * Initiates password reset process by generating OTP code
   * @param dto - Contains email address for password reset
   * @returns Promise containing temporary code and success message
   * @note In production, OTP should be sent via email service
   */

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ otpId: string; message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists or not - return dummy response
      return {
        otpId: 'dummy_otp_id',
        message: 'If the email exists, a reset code has been sent.',
      };
    }

    return await this.otpService.generatePasswordResetOtp(dto.email);
  }

  /**
   * Resets user password using OTP verification
   * @param dto - Contains OTP ID and new password
   * @returns Promise containing success message
   * @throws BadRequestException if OTP invalid or expired
   * @throws NotFoundException if user not found
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { email } = await this.otpService.verifyOtp(
      dto.otpId,
      dto.code,
      'PASSWORD_RESET',
    );

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Password reset successfully' };
  }

  /**
   * Debug endpoint - Returns active OTP codes (TEMPORARY - remove in production)
   * @returns Promise containing list of active OTP codes
   * @deprecated This method should be removed in production
   */
  async getActiveOtps() {
    return this.otpService.getActiveOtps();
  }
}
