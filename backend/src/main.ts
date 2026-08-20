import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto TCP válido.');
  await app.listen(port);
}

void bootstrap();
