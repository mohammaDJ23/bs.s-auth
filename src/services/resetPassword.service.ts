import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { UserService } from './user.service';
import { MessageDto, ForgotPasswordDto, ResetPasswordDto } from 'src/dtos';
import { User, ResetPassword } from 'src/entities';
import { ForgotPasswordTransaction } from 'src/transactions';

@Injectable()
export class ResetPasswordService {
  constructor(
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRepository: Repository<ResetPassword>,
    private readonly userService: UserService,
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => ForgotPasswordTransaction))
    private readonly forgotPasswordTransaction: ForgotPasswordTransaction,
  ) {}

  private findByToken(token: string): Promise<ResetPassword> {
    return this.resetPasswordRepository
      .createQueryBuilder('reset_password')
      .where('reset_password.token = :token', { token })
      .getOne();
  }

  async forgotPassword(
    body: ForgotPasswordDto,
    currentUser: User,
  ): Promise<MessageDto> {
    return this.forgotPasswordTransaction.run(currentUser);
  }

  async resetPassword(body: ResetPasswordDto): Promise<MessageDto> {
    const actualPassword = body.password.toString().toLowerCase();
    const confirmedPassword = body.confirmedPassword.toString().toLowerCase();
    if (actualPassword !== confirmedPassword)
      throw new BadRequestException('The passwords are not equal.');

    const resetPassword = await this.findByToken(body.token);
    if (!resetPassword) throw new NotFoundException('Provided invalid token.');

    const isTokenExpired = new Date() > new Date(resetPassword.expiration);
    if (isTokenExpired)
      throw new BadRequestException('The token used has been expired.');

    const hashedPassword = await hash(body.password, 10);
    const user = await this.userService.updatePartial({
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
    await this.mailerService.sendMail(mailerOptions);

    return { message: 'Your password has been changed.' };
  }

  async removeTokens() {
    try {
      await this.resetPasswordRepository
        .createQueryBuilder('reset_password')
        .delete()
        .where('reset_password.expiration < :now', { now: new Date() })
        .execute();
    } catch (error) {}
  }
}
