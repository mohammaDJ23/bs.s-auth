import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, TokenDto } from 'src/dtos';
import { User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { TokenSerializerInterceptor } from 'src/interceptors';
import { FirebaseService } from 'src/services';

@Controller('/api/v1/auth/firebase')
@ApiTags('/api/v1/auth/firebase')
@UseGuards(JwtGuard)
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Get('generate-custom-token')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TokenSerializerInterceptor)
  @ApiResponse({ status: HttpStatus.OK, type: TokenDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  generateCustomToken(@CurrentUser() user: User): Promise<TokenDto> {
    return this.firebaseService.generateCustomToken(user.id);
  }
}
