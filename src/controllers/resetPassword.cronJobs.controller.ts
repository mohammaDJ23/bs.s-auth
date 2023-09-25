import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResetPasswordService } from '../services';

@Controller()
export class ResetPasswordCronJobsController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Cron(CronExpression.EVERY_5_HOURS)
  removeTokens(): void {
    this.resetPasswordService.removeTokens();
  }
}
