import {
  Body,
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, TokenDto, ErrorDto } from 'src/dtos';
import { AuthService } from 'src/services';
import { TokenSerializerInterceptor } from 'src/interceptors';

@Controller('/api/v1/auth')
@ApiTags('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TokenSerializerInterceptor)
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, type: TokenDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  login(@Body() body: LoginDto): Promise<TokenDto> {
    return this.authService.login(body);
  }
}
