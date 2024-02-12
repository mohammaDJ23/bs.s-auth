import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';
import {
  FindUserByEmailObj,
  FindUserByIdObj,
  PartialUser,
  UpdatedUserPartialObj,
} from 'src/types';

@Injectable()
export class UserService {
  constructor(
    @Inject(process.env.AUTH_RABBITMQ_SERVICE)
    private readonly clientProxy: ClientProxy,
  ) {}

  findById(id: number): Promise<User> {
    return this.clientProxy
      .send<User, FindUserByIdObj>('find_user_by_id', { payload: { id } })
      .toPromise();
  }

  findByEmail(email: string): Promise<User> {
    return this.clientProxy
      .send<User, FindUserByEmailObj>('find_user_by_email', {
        payload: { email },
      })
      .toPromise();
  }

  update(payload: PartialUser): Promise<User> {
    return this.clientProxy
      .send<User, UpdatedUserPartialObj>('update_user', {
        payload,
      })
      .toPromise();
  }
}
