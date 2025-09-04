import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Preflight: ensure Notification Service is healthy before starting
  const logger = new Logger('Bootstrap');
  try {
    const notificationService = app.get(NotificationService);
    const healthy = await notificationService.checkHealth();
    if (!healthy) {
      logger.error(
        `Notification Service is unavailable at ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4321'}. ` +
          'Start the Notification Service first, then retry. Aborting startup.',
      );
      await app.close();
      // Exit with non-zero to signal failure
      process.exit(1);
      return;
    }
  } catch {
    logger.error(
      'Notification Service dependency not resolved or health check failed. ' +
        'Ensure NotificationModule is configured and the service is running.',
    );
    await app.close();
    process.exit(1);
    return;
  }

  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
