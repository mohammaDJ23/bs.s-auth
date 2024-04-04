import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtStrategy,
  CustomNamingStrategy,
  GoogleOauthStrategy,
} from '../strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetPassword } from '../entities';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { ScheduleModule } from '@nestjs/schedule';
import {
  ResetPasswordCronJobsController,
  ResetPasswordController,
  AuthController,
  GoogleController,
  FirebaseController,
} from '../controllers';
import {
  UserService,
  ResetPasswordService,
  AuthService,
  FirebaseService,
} from '../services';
import {
  ForgotPasswordTransaction,
  ResetPasswordTransaction,
} from 'src/transactions';
import { FirebaseModule } from 'nestjs-firebase';
import {
  AllExceptionFilter,
  HttpExceptionFilter,
  ObjectExceptionFilter,
  QueryExceptionFilter,
  RpcExceptionFilter,
} from 'src/filters';

@Module({
  imports: [
    FirebaseModule.forRoot({
      googleApplicationCredential: join(
        __dirname,
        '../',
        'firebase.config.json',
      ),
    }),
    ClientsModule.register([
      {
        name: process.env.AUTH_RABBITMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.USER_RABBITMQ_QUEUE,
          queueOptions: {
            durable: true,
          },
          noAck: false,
        },
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: +process.env.DATABASE_PORT,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        namingStrategy: new CustomNamingStrategy(),
        entities: [ResetPassword],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([ResetPassword]),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    MailerModule.forRoot({
      transport: {
        service: process.env.MAILER_SERVICE,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASSWORD,
        },
      },
      defaults: {},
      template: {
        dir: join(__dirname, '../', '../', 'views/pages'),
        adapter: new EjsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ResetPasswordCronJobsController,
    ResetPasswordController,
    AuthController,
    GoogleController,
    FirebaseController,
  ],
  providers: [
    UserService,
    ResetPasswordService,
    AuthService,
    FirebaseService,
    JwtStrategy,
    GoogleOauthStrategy,
    ForgotPasswordTransaction,
    ResetPasswordTransaction,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_FILTER, useClass: ObjectExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: RpcExceptionFilter },
    { provide: APP_FILTER, useClass: QueryExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
