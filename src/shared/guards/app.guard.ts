import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import environment from 'src/config/environment';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AppGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    
    const isAuthSkipped = this.reflector.get<boolean>(
      'isAuthSkipped',
      context.getHandler(),
    );

    if (isAuthSkipped) return true;

    const token = this.getAccessToken(context);
    if (!token) throw new UnauthorizedException('Not authorized.');

    let decoded;
    try {
      decoded = verify(token, environment.secret);
    } catch (error) {
      throw new UnauthorizedException('Token is invalid or has expired');
    }

    if (!decoded?.id) {
      throw new UnauthorizedException('User is not found.');
    }

    if (decoded.type != 'TOKEN') {
      throw new UnauthorizedException('Invalid jwt user type.');
    }

    const user = await this.userService.findByIdForGuard({ id: decoded.id });
    if (!user) {
      throw new UnauthorizedException('User is not found.');
    }
    // append user entity to current request
    request.user = user;

    return true;
  }

  private getAccessToken(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    const authHeader: string = req.headers.authorization;
    return authHeader?.split(' ')?.[1];
  }
}
