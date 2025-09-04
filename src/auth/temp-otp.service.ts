import { Injectable } from '@nestjs/common';

interface TempOtpRecord {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class TempOtpService {
  private otpStore = new Map<string, TempOtpRecord>();

  generateOtp(email: string): { uniqueId: string; code: string } {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const uniqueId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.otpStore.set(uniqueId, {
      email,
      code,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired codes
    this.cleanupExpired();

    // In real implementation, this would call external OTP service
    console.log(`📱 [TEMP OTP] Sending OTP ${code} to ${email} (ID: ${uniqueId})`);
    
    return { uniqueId, code };
  }

  verifyOtp(uniqueId: string, providedCode: string): boolean {
    const record = this.otpStore.get(uniqueId);

    if (!record) {
      return false; // Invalid or expired uniqueId
    }

    if (new Date() > record.expiresAt) {
      this.otpStore.delete(uniqueId);
      return false; // Expired
    }

    record.attempts++;

    if (record.attempts > 3) {
      this.otpStore.delete(uniqueId);
      return false; // Too many attempts
    }

    if (record.code === providedCode) {
      this.otpStore.delete(uniqueId); // Successful verification
      return true;
    }

    return false; // Wrong code
  }

  private cleanupExpired(): void {
    const now = new Date();
    for (const [id, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(id);
      }
    }
  }

  // Debug endpoint to view active OTPs - remove in production
  getActiveOtps(): Array<{ id: string; email: string; code: string; expiresAt: Date }> {
    const result: Array<{ id: string; email: string; code: string; expiresAt: Date }> = [];
    
    for (const [id, record] of this.otpStore.entries()) {
      if (record.expiresAt > new Date()) {
        result.push({
          id,
          email: record.email,
          code: record.code,
          expiresAt: record.expiresAt,
        });
      }
    }
    
    return result;
  }
}
