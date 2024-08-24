import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import environment from 'src/config/environment';
import { UserDocument } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class wsAuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(socket: Socket, next: (err?: any) => void) {
    const token = socket.handshake.headers.authorization;

    if (!token) {
      throw new ForbiddenException('Socket:No token provided');
    }

    try {
      let decoded;
      try {
        decoded = verify(token, environment.secret);
      } catch (error) {
        throw new ForbiddenException('Socket:Token is invalid or has expired');
      }

      if (!decoded?.id) {
        throw new ForbiddenException('Socket:User is not found.');
      }

      if (decoded.type != 'TOKEN') {
        throw new ForbiddenException('Socket:Invalid jwt user type.');
      }

      const user = await this.userService.findByIdForGuard({ id: decoded.id });
      if (!user) {
        throw new ForbiddenException('Socket:User is not found.');
      }

      socket.handshake.auth.user = user;

      next();
    } catch (err) {
      throw new ForbiddenException('Socket:Invalid socket token');
    }
  }
}
