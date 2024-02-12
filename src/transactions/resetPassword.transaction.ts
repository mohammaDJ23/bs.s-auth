import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { hash } from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { BaseTransaction } from './base.transaction';
import { MessageDto, ResetPasswordDto } from 'src/dtos';
import { ResetPasswordService, UserService } from 'src/services';

@Injectable()
export class ResetPasswordTransaction extends BaseTransaction {
  constructor(
    dataSource: DataSource,
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => ResetPasswordService))
    private readonly resetPasswordService: ResetPasswordService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    super(dataSource);
  }

  protected async execute(
    manager: EntityManager,
    payload: ResetPasswordDto,
  ): Promise<MessageDto> {
    const password = payload.password.toString().toLowerCase().trim();
    const confirmedPassword = payload.confirmedPassword
      .toString()
      .toLowerCase()
      .trim();
    if (password !== confirmedPassword)
      throw new BadRequestException('The passwords are not equal.');

    const resetPassword = await this.resetPasswordService.findByToken(
      payload.token,
    );
    if (!resetPassword) throw new NotFoundException('Provided invalid token.');

    const isTokenExpired = new Date() > new Date(resetPassword.expiration);
    if (isTokenExpired)
      throw new BadRequestException('The token used has been expired.');

    const hashedPassword = await hash(payload.password, 10);
    const user = await this.userService.update({
      id: resetPassword.userId,
      password: hashedPassword,
    });

    const mailerOptions = {
      from: process.env.MAILER_USER,
      to: user.email,
      subject: 'Changed password',
      template: './changedPassword',
      context: {
        firstName: user.firstName,
        link: `${process.env.CLIENT_CONTAINER_URL}/auth/login`,
      },
    };
    try {
      await this.mailerService.sendMail(mailerOptions);
    } catch (error) {
      throw new BadRequestException(
        'Your password has been changed but google could not send you an email.',
      );
    }

    return { message: 'Your password has been changed.' };
  }
}
