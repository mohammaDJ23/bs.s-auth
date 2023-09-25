import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';
import { UpdatedUserPartialObj } from 'src/types';

@Injectable()
export class UserService {
  constructor(
    @Inject(process.env.AUTH_RABBITMQ_SERVICE)
    private readonly clientProxy: ClientProxy,
  ) {}

  findById(id: number): Promise<User> {
    return this.clientProxy
      .send<User, number>('find_user_by_id', id)
      .toPromise();
  }

  findByEmail(email: string): Promise<User> {
    return this.clientProxy
      .send<User, string>('find_user_by_email', email)
      .toPromise();
  }

  update(updatedUser: UpdatedUserPartialObj): Promise<User> {
    return this.clientProxy
      .send<User, UpdatedUserPartialObj>('update_user', updatedUser)
      .toPromise();
  }
}
