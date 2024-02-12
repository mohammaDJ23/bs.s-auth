import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageDto, ForgotPasswordDto, ResetPasswordDto } from 'src/dtos';
import { ResetPassword } from 'src/entities';
import {
  ForgotPasswordTransaction,
  ResetPasswordTransaction,
} from 'src/transactions';

@Injectable()
export class ResetPasswordService {
  constructor(
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRepository: Repository<ResetPassword>,
    @Inject(forwardRef(() => ForgotPasswordTransaction))
    private readonly forgotPasswordTransaction: ForgotPasswordTransaction,
    @Inject(forwardRef(() => ResetPasswordTransaction))
    private readonly resetPasswordTransaction: ResetPasswordTransaction,
  ) {}

  findByToken(token: string): Promise<ResetPassword> {
    return this.resetPasswordRepository
      .createQueryBuilder('reset_password')
      .where('reset_password.token = :token', { token })
      .getOne();
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<MessageDto> {
    return this.forgotPasswordTransaction.run(payload);
  }

  async resetPassword(payload: ResetPasswordDto): Promise<MessageDto> {
    return this.resetPasswordTransaction.run(payload);
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
