import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    recipient: string;
    subject: string;
    priority: string;
    createdAt: string;
  };
}

export interface SendTemplateEmailRequest {
  recipientEmail: string;
  templateName: string;
  templateData: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

@Injectable()
export class NotificationService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://localhost:4321';
  }

  async sendTemplateEmail(
    request: SendTemplateEmailRequest,
  ): Promise<SendEmailResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/send-template-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpException(
          errorData.message || 'Failed to send email',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Notification service error:', error);
      throw new HttpException(
        'Email service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    htmlBody?: string;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<SendEmailResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpException(
          errorData.message || 'Failed to send email',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Notification service error:', error);
      throw new HttpException(
        'Email service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/v1/health/simple`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Notification service health check failed:', error);
      return false;
    }
  }
}
