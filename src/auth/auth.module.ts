import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TempOtpService } from './temp-otp.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'dev_secret',
        signOptions: { expiresIn: '1h' },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TempOtpService],
  exports: [AuthService, TempOtpService],
})
export class AuthModule {}
