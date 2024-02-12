import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { swagger } from './libs';
import { NestExpressApplication } from '@nestjs/platform-express';

require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.AUTH_RABBITMQ_QUEUE,
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  app.set('view engine', 'ejs');

  app.enableCors({ origin: '*' });
  swagger(app);
  await app.startAllMicroservices();
  await app.listen(process.env.PORT);
}
bootstrap();
