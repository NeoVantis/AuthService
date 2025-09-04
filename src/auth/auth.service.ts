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
import { TempOtpService } from './temp-otp.service';
import { StepOneSignupDto } from './dto/step-one-signup.dto';
import { StepTwoSignupDto } from './dto/step-two-signup.dto';
import { SigninDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tempOtpService: TempOtpService,
  ) {}

  private async signToken(user: User): Promise<string> {
    return await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  async stepOneSignup(dto: StepOneSignupDto): Promise<{ userId: string; message: string }> {
    // Check if email or username already exists
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
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
      message: 'Step 1 completed. Please complete step 2 to finish registration.',
    };
  }

  async stepTwoSignup(
    userId: string,
    dto: StepTwoSignupDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
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

    const access_token = await this.signToken(updatedUser);
    const userProfile = await this.usersService.getUserProfile(userId);

    return { access_token, user: userProfile as Partial<User> };
  }

  async signin(dto: SigninDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isSignupComplete) {
      throw new UnauthorizedException(
        'Please complete your registration before signing in',
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

  async verifyToken(token: string): Promise<{ valid: boolean; user?: Partial<User> }> {
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

  async getUserFromToken(token: string): Promise<Partial<User> | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return await this.usersService.getUserProfile(payload.sub);
    } catch {
      return null;
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ tempCode: string; message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists or not
      return {
        tempCode: 'dummy_code',
        message: 'If the email exists, a reset code has been sent.',
      };
    }

    const { uniqueId, code } = this.tempOtpService.generateOtp(dto.email);

    // In real implementation, this would be sent via email
    console.log(`🔐 Password reset code for ${dto.email}: ${code} (Use tempCode: ${uniqueId})`);

    return {
      tempCode: uniqueId, // In real app, this wouldn't be returned
      message: 'Reset code sent to your email.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // For temporary solution, extract email from tempCode
    const tempRecord = this.tempOtpService['otpStore'].get(dto.tempCode);
    if (!tempRecord) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const user = await this.usersService.findByEmail(tempRecord.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidOtp = this.tempOtpService.verifyOtp(dto.tempCode, tempRecord.code);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Password reset successfully' };
  }

  // Debug endpoint - temporary solution
  async getActiveOtps() {
    return this.tempOtpService.getActiveOtps();
  }
}