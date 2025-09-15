import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification/notification.service';

interface OtpRecord {
  id: string;
  email: string;
  code: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

@Injectable()
export class OtpService {
  private otpStore = new Map<string, OtpRecord>();

  constructor(private notificationService: NotificationService) {}

  async generateEmailVerificationOtp(
    email: string,
  ): Promise<{ otpId: string; message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const otpRecord: OtpRecord = {
      id: otpId,
      email,
      code,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      attempts: 0,
      isUsed: false,
      createdAt: new Date(),
    };

    this.otpStore.set(otpId, otpRecord);

    // Clean up expired codes
    this.cleanupExpired();

    try {
      // Send verification email using notification service
      await this.notificationService.sendTemplateEmail({
        recipientEmail: email,
        templateName: 'email-verification',
        templateData: {
          recipientName: email.split('@')[0], // Use email prefix as name if no full name available
          verificationCode: code,
          expirationTime: '15 minutes',
        },
        priority: 'high',
      });

      return {
        otpId,
        message: 'Verification code sent to your email',
      };
    } catch (error) {
      // If email fails, remove the OTP record
      this.otpStore.delete(otpId);
      console.error('Failed to send verification email:', error);
      throw new BadRequestException(
        'Failed to send verification email. Please try again.',
      );
    }
  }

  async generatePasswordResetOtp(
    email: string,
  ): Promise<{ otpId: string; message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpRecord: OtpRecord = {
      id: otpId,
      email,
      code,
      type: 'PASSWORD_RESET',
      expiresAt,
      attempts: 0,
      isUsed: false,
      createdAt: new Date(),
    };

    this.otpStore.set(otpId, otpRecord);

    // Clean up expired codes
    this.cleanupExpired();

    try {
      // Send password reset email using notification service
      await this.notificationService.sendTemplateEmail({
        recipientEmail: email,
        templateName: 'password-reset',
        templateData: {
          recipientName: email.split('@')[0], // Use email prefix as name if no full name available
          resetCode: code,
          expirationTime: '10 minutes',
        },
        priority: 'high',
      });

      return {
        otpId,
        message: 'Password reset code sent to your email',
      };
    } catch (error) {
      // If email fails, remove the OTP record
      this.otpStore.delete(otpId);
      console.error('Failed to send password reset email:', error);
      throw new BadRequestException(
        'Failed to send password reset email. Please try again.',
      );
    }
  }

  async verifyOtp(
    otpId: string,
    code: string,
    type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ): Promise<{ email: string; isValid: boolean }> {
    const record = this.otpStore.get(otpId);

    if (!record) {
      throw new NotFoundException('OTP not found or expired');
    }

    if (record.type !== type) {
      throw new BadRequestException('Invalid OTP type');
    }

    if (record.isUsed) {
      throw new BadRequestException('OTP has already been used');
    }

    if (record.expiresAt < new Date()) {
      this.otpStore.delete(otpId);
      throw new BadRequestException('OTP has expired');
    }

    if (record.attempts >= 3) {
      this.otpStore.delete(otpId);
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    // Increment attempts
    record.attempts += 1;

    if (record.code !== code) {
      // Update the record with incremented attempts
      this.otpStore.set(otpId, record);
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark as used
    record.isUsed = true;
    this.otpStore.set(otpId, record);

    return {
      email: record.email,
      isValid: true,
    };
  }

  async resendOtp(otpId: string): Promise<{ message: string }> {
    const record = this.otpStore.get(otpId);

    if (!record) {
      throw new NotFoundException('OTP not found');
    }

    if (record.isUsed) {
      throw new BadRequestException('OTP has already been used');
    }

    // Check if too recent (prevent spam)
    const timeSinceCreated = Date.now() - record.createdAt.getTime();
    if (timeSinceCreated < 60000) {
      // 1 minute
      throw new BadRequestException('Please wait before requesting a new code');
    }

    // Generate new code but keep same ID
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    record.code = newCode;
    record.attempts = 0;
    record.expiresAt = new Date(
      Date.now() + (record.type === 'EMAIL_VERIFICATION' ? 15 : 10) * 60 * 1000,
    );
    record.createdAt = new Date();

    this.otpStore.set(otpId, record);

    try {
      const templateName =
        record.type === 'EMAIL_VERIFICATION'
          ? 'email-verification'
          : 'password-reset';
      const templateData =
        record.type === 'EMAIL_VERIFICATION'
          ? {
              recipientName: record.email.split('@')[0],
              verificationCode: newCode,
              expirationTime: '15 minutes',
            }
          : {
              recipientName: record.email.split('@')[0],
              resetCode: newCode,
              expirationTime: '10 minutes',
            };

      await this.notificationService.sendTemplateEmail({
        recipientEmail: record.email,
        templateName,
        templateData,
        priority: 'high',
      });

      return {
        message: 'New verification code sent to your email',
      };
    } catch (error) {
      console.error('Failed to resend verification code:', error);
      throw new BadRequestException(
        'Failed to send verification code. Please try again.',
      );
    }
  }

  private cleanupExpired(): void {
    const now = new Date();
    for (const [id, record] of this.otpStore.entries()) {
      if (record.expiresAt < now) {
        this.otpStore.delete(id);
      }
    }
  }

  // Debug method - remove in production
  getActiveOtps(): Array<{
    id: string;
    email: string;
    code: string;
    type: string;
    expiresAt: Date;
    attempts: number;
    isUsed: boolean;
  }> {
    const result: Array<{
      id: string;
      email: string;
      code: string;
      type: string;
      expiresAt: Date;
      attempts: number;
      isUsed: boolean;
    }> = [];

    for (const [id, record] of this.otpStore.entries()) {
      if (record.expiresAt > new Date() && !record.isUsed) {
        result.push({
          id,
          email: record.email,
          code: record.code,
          type: record.type,
          expiresAt: record.expiresAt,
          attempts: record.attempts,
          isUsed: record.isUsed,
        });
      }
    }

    return result;
  }
}
