import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { BaseTransaction } from './base.transaction';
import { ForgotPasswordDto, MessageDto } from 'src/dtos';
import { ResetPassword } from 'src/entities';
import { UserService } from 'src/services';

@Injectable()
export class ForgotPasswordTransaction extends BaseTransaction {
  constructor(
    dataSource: DataSource,
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    super(dataSource);
  }

  protected async execute(
    manager: EntityManager,
    payload: ForgotPasswordDto,
  ): Promise<MessageDto> {
    const user = await this.userService.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Could not found the user.');
    }
    const randomString = randomBytes(32).toString('hex');
    const token = await hash(randomString, 10);
    const expiration = new Date(
      new Date().getTime() + +process.env.RESET_PASSWORD_EXPIRATION,
    );

    await manager
      .createQueryBuilder(ResetPassword, 'reset_password')
      .insert()
      .into(ResetPassword)
      .values({ token, expiration, userId: user.id })
      .execute();

    const mailerOptions = {
      from: process.env.MAILER_USER,
      to: user.email,
      subject: 'Reset password link',
      template: './resetPassword',
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
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
