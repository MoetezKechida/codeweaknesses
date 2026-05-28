import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Enable Socket.IO adapter for WebSocket gateways
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on port ${process.env.PORT ?? 3000}`);
  console.log(`WebSocket leaderboard gateway at ws://localhost:${process.env.PORT ?? 3000}/leaderboard`);
}
bootstrap();
