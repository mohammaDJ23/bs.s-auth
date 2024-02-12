import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { User } from 'src/entities';
import { OauthUser, UserSignInfoObj } from 'src/types';
import { LoginDto, TokenDto } from '../dtos';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  signInfo(user: User): UserSignInfoObj {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      parentId: user.parent.id,
      expiration: +process.env.JWT_EXPIRATION,
    };
  }

  getJwtToken(user: User): TokenDto {
    const signInfo = this.signInfo(user);
    const accessToken = this.jwtService.sign(signInfo);
    return { accessToken };
  }

  async login(payload: LoginDto): Promise<TokenDto> {
    const user = await this.userService.findByEmail(payload.email);

    if (!user) {
      throw new NotFoundException('Could not found the user');
    }

    const isPasswordsEqual = await compare(payload.password, user.password);

    if (!isPasswordsEqual)
      throw new NotFoundException(`Could not found the user.`);

    return this.getJwtToken(user);
  }

  async loginWithOauth(response: Response, user: OauthUser): Promise<void> {
    const findedUser = await this.userService.findByEmail(user.email);

    if (!findedUser) {
      response.render('pages/failOauth', {
        loginUrl: `${process.env.CLIENT_CONTAINER_URL}/auth/login`,
      });
    } else {
      const jwtToken = this.getJwtToken(findedUser);
      response.redirect(
        HttpStatus.MOVED_PERMANENTLY,
        `${
          process.env.CLIENT_CONTAINER_URL
        }/auth/success-oauth?accessToken=${encodeURIComponent(
          jwtToken.accessToken,
        )}&oauthAccessToken=${encodeURIComponent(
          user.accessToken,
        )}&oauthAccessTokenInfo=${encodeURIComponent(JSON.stringify(user))}`,
      );
    }
  }
}
