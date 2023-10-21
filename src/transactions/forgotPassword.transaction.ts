import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { BaseTransaction } from './base.transaction';
import { MessageDto } from 'src/dtos';
import { ResetPassword, User } from 'src/entities';

@Injectable()
export class ForgotPasswordTransaction extends BaseTransaction<
  User,
  MessageDto
> {
  constructor(
    dataSource: DataSource,
    private readonly mailerService: MailerService,
  ) {
    super(dataSource);
  }

  protected async execute(
    currentUser: User,
    manager: EntityManager,
  ): Promise<MessageDto> {
    const randomString = randomBytes(32).toString('hex');
    const token = await hash(randomString, 10);
    const expiration = new Date(
      new Date().getTime() + +process.env.RESET_PASSWORD_EXPIRATION,
    );

    await manager
      .createQueryBuilder(ResetPassword, 'reset_password')
      .insert()
      .into(ResetPassword)
      .values({ token, expiration, userId: currentUser.id })
      .execute();

    const mailerOptions = {
      from: process.env.MAILER_USER,
      to: currentUser.email,
      subject: 'Reset password link',
      template: './resetPassword',
      context: {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        link: `${process.env.CLIENT_CONTAINER_URL}/auth/reset-password?token=${token}`,
      },
    };

    await this.mailerService.sendMail(mailerOptions);

    return {
      message:
        'Further information has been sent to your email, please check there.',
    };
  }
}
