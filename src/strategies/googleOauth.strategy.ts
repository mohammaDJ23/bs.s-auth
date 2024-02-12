import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOauthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      callbackURL: process.env.OAUTH_REDIRECT_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log(
      'inside the googleOauth strategy',
      accessToken,
      refreshToken,
      profile,
    );

    const [email] = profile.emails;

    if (!email)
      throw new BadRequestException(
        'Could not found the user by the google service.',
      );

    if (!email.verified)
      throw new BadRequestException(
        'Your email is not verified by the google service.',
      );

    const oauth2Client = new OAuth2Client();
    const oauthTokenInfo = await oauth2Client.getTokenInfo(accessToken);

    console.log(
      'inside the googleOauth strategy after the token info',
      oauthTokenInfo,
    );

    return {
      id: profile.id,
      email: email.value,
      accessToken,
      expiration: oauthTokenInfo.expiry_date,
    };
  }
}
