import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { TokenDto } from 'src/dtos';

@Injectable()
export class FirebaseService {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  async generateCustomToken(id: number): Promise<TokenDto> {
    const token = await this.firebase.auth.createCustomToken(id.toString());
    return { accessToken: token };
  }
}
