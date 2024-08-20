import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipAuth } from 'src/shared/decorators/skip-auth.decorator';
import { MainExceptionDto } from 'src/shared/exceptions/main.exception';
import {
  CreateUserRequest,
  LoginUserRequest,
  RefreshTokenRequest,
  UpdateUserRequest,
  UserResponse,
} from './dto';
import { UserService } from './user.service';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { UserDocument } from './user.schema';
import { MemberResponse } from './dto/member.response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponse,
    description: 'login user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'Error login user',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    type: MainExceptionDto,
    description:
      'Email not verified yet, Please check your email to complete verification process.',
  })
  @SkipAuth()
  @Post('login')
  async login(
    @Body() LoginUserRequest: LoginUserRequest,
  ): Promise<UserResponse> {
    LoginUserRequest.email = LoginUserRequest.email.trim().toLowerCase();

    const userData = await this.userService.login({
      dto: LoginUserRequest,
    });

    const error = {
      message: 'User not found.',
      errors: ['email or password incorrect'],
    };
    if (!userData) throw new HttpException(error, HttpStatus.UNAUTHORIZED);

    return userData;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: MemberResponse,
    description: 'get user data',
  })
  @ApiBearerAuth()
  @Get('me')
  async findMe(@CurrentUser('id') id: string): Promise<MemberResponse> {
    return this.userService.findMemberById({ id });
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponse,
    description: 'signup new user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: MainExceptionDto,
    description: 'Error signup user',
  })
  @SkipAuth()
  @Post('signup')
  async signup(@Body() userData: CreateUserRequest) {
    const user = await this.userService.checkExistByEmail({
      email: userData.email.trim().toLowerCase(),
    });

    if (user) {
      const errors = ['Email is already exist.'];
      throw new HttpException(
        { message: 'Email is already exist.', errors },
        HttpStatus.BAD_REQUEST,
      );
    }

    const createdUser = await this.userService.create({
      dto: { ...userData, email: userData.email.trim().toLowerCase() },
    });

    return createdUser;
  }

  @ApiResponse({ status: HttpStatus.OK, description: 'refresh-token user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponse,
    description: 'login user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: MainExceptionDto,
    description: 'Error refresh-token',
  })
  @SkipAuth()
  @Post('refresh-token')
  async findByRefreshToken(
    @Body() { refreshToken }: RefreshTokenRequest,
  ): Promise<UserResponse> {
    try {
      const user = await this.userService.findByRefreshToken({
        token: refreshToken,
      });
      if (!user) {
        const errors = ['Invalid token.'];
        throw new HttpException(
          { message: 'invalid token', errors },
          HttpStatus.BAD_REQUEST,
        );
      }
      return user;
    } catch (error) {
      const errors = ['Invalid token.'];
      throw new HttpException(
        { message: 'invalid token', errors },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({
    description: 'user update date',
    summary: 'user update date',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MemberResponse,
    description: 'user updated',
  })
  @ApiBearerAuth()
  @Patch('users')
  async update(@CurrentUser() currentUser, @Body() dto: UpdateUserRequest) {
    const userId = currentUser.id;

    // check phone is unique
    if (dto.phone) {
      const phoneExist = await this.userService.checkPhoneExist({
        phone: dto.phone,
        id: userId,
      });
      if (phoneExist) {
        const errors = ['Phone number must be unique.'];
        throw new HttpException(
          { message: 'Phone number must be unique.', errors },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return await this.userService.update({
      userId,
      dto,
    });
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponse,
    description: 'login user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'Error login user',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    type: MainExceptionDto,
    description:
      'Email not verified yet, Please check your email to complete verification process.',
  })
  @ApiBearerAuth()
  @Post('logout')
  async logout(@CurrentUser() currentUser: UserDocument): Promise<void> {
    const userData = await this.userService.logout({
      currentUser,
    });

    return;
  }
}
