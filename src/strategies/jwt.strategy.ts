import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EncryptedUserObj } from '../types';
import { UserService } from 'src/services';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: EncryptedUserObj) {
    console.log('from jwt strategy', payload);

    const user = await this.userService.findById(payload.id);

    console.log('from jwt strategy after finding the user', user);

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
