import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { RedisSocketService } from 'src/chat/redis-socket.service';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { MainExceptionDto } from 'src/shared/exceptions/main.exception';
import { UserDocument } from 'src/user/user.schema';
import { PaginationDto } from '../shared/helpers/pagination';
import { checkObjectIdPipe } from '../shared/pipes/check-objectId.pipe';
import {
  ContactsListPagination,
  CreateDirectMessageRequest,
  CreateRoomMessageRequest,
  MessageFilterRequest,
  MessageResponse,
  MessagesPagination,
  UpdateMessageRequest,
} from './dto';
import { MessageService } from './message.service';
import { MessageTypeEnum } from 'src/shared/enums';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly redisSocketService: RedisSocketService,
  ) {}

  @ApiOperation({
    description: 'Get direct messages with pagination',
    summary: 'Get direct messages with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
    isArray: true,
    description: 'Get direct messages with pagination',
  })
  @ApiBearerAuth()
  @Get('direct/:memberId')
  async getMemberMessagesWithPagination(
    @CurrentUser() currentUser: UserDocument,
    @Param('memberId', checkObjectIdPipe) memberId: string,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: MessageFilterRequest,
  ): Promise<MessagesPagination> {
    //check if member exist
    const memberExist = await this.messageService.checkMemberExist({
      memberId,
    });
    if (!memberExist) {
      const message = 'Member not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }
    const messageFilterDto = new MessageFilterRequest(
      filterDto,
    ).buildFilterRO();
    const options = {
      where: {
        ...messageFilterDto,
        type: MessageTypeEnum.DIRECT,
        $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
      },
      order: { createdAt: 'DESC' },
    };
    return await this.messageService.getMessagesWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Get room messages with pagination',
    summary: 'Get room messages with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
    isArray: true,
    description: 'Get room messages with pagination',
  })
  @ApiBearerAuth()
  @Get('rooms/:roomId')
  async getMessagesWithPagination(
    @CurrentUser() currentUser: UserDocument,
    @Param('roomId', checkObjectIdPipe) roomId: string,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: MessageFilterRequest,
  ): Promise<MessagesPagination> {
    //check if room exist
    const roomExist = await this.messageService.checkRoomExist({
      roomId,
    });
    if (!roomExist) {
      const message = 'Room not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if current user is member of the room
    const roomMember = await this.messageService.isMemberInTheRoom({
      roomId,
      currentUser,
    });
    if (!roomMember) {
      const message = 'You are not a member of this room.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    const messageFilterDto = new MessageFilterRequest(
      filterDto,
    ).buildFilterRO();
    const options = {
      where: {
        ...messageFilterDto,
        type: MessageTypeEnum.ROOM,
        room: new Types.ObjectId(roomId),
      },
      order: { createdAt: 'DESC' },
    };
    return await this.messageService.getMessagesWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Create new direct message',
    summary: 'Create new direct message',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MessageResponse,
    description: 'create new direct message',
  })
  @ApiBearerAuth()
  @Post('direct')
  async createDirectMessage(
    @CurrentUser() currentUser: UserDocument,
    @Body() dto: CreateDirectMessageRequest,
  ): Promise<MessageResponse> {
    //check if receiver exist
    const receiverExist = await this.messageService.checkMemberExist({
      memberId: dto.receiverId,
    });
    if (!receiverExist) {
      const message = 'Receiver not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    const message = await this.messageService.createDirectMessage({
      currentUser,
      dto,
    });

    // Publish the message to Redis for the specific member
    this.redisSocketService.publishMessageToMember({
      receiverId: dto.receiverId,
      message,
    });

    return message;
  }

  @ApiOperation({
    description: 'Create new room message',
    summary: 'Create new room message',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MessageResponse,
    description: 'create new room message',
  })
  @ApiBearerAuth()
  @Post('room')
  async createRoomMessage(
    @CurrentUser() currentUser: UserDocument,
    @Body() dto: CreateRoomMessageRequest,
  ): Promise<MessageResponse> {
    //check if room exist
    const roomExist = await this.messageService.checkRoomExist({
      roomId: dto.roomId,
    });
    if (!roomExist) {
      const message = 'Room not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    const message = await this.messageService.createRoomMessage({
      currentUser,
      dto,
    });

    // Publish the message to Redis for the specific room
    this.redisSocketService.publishMessageToRoom({
      roomId: dto.roomId,
      message,
    });
    return message;
  }

  @ApiOperation({
    description: 'Update Message data',
    summary: 'Update Message data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
    description: 'Message updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'unauthorized, bearer token not provided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Message not found',
  })
  @ApiBearerAuth()
  @Patch(':messageId')
  async update(
    @CurrentUser() currentUser: UserDocument,
    @Param('messageId', checkObjectIdPipe) id: string,
    @Body() dto: UpdateMessageRequest,
  ): Promise<MessageResponse> {
    const message = await this.messageService.getMessage({ id });
    if (!message) {
      const errors = ['Message not found.'];
      throw new HttpException(
        { message: 'Message not found.', errors },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (message.sender.id.toString() !== currentUser.id.toString()) {
      const message =
        'You are not authorized to update this message, You must be the message creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    return await this.messageService.update({
      id,
      dto,
    });
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: `Messages has been removed successfully`,
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Selected Messages Not found.',
  })
  @ApiBearerAuth()
  @Delete(':messageId')
  async deleteMessage(
    @CurrentUser() currentUser: UserDocument,
    @Param('messageId', checkObjectIdPipe) id: string,
  ): Promise<MessageResponse> {
    const message = await this.messageService.getMessage({
      id,
    });
    if (!message) {
      const errors = ['Message not found.'];
      throw new HttpException(
        { message: 'Message not found.', errors },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (message.sender.id.toString() !== currentUser.id.toString()) {
      const message =
        'You are not authorized to delete this message, You must be the message creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    await this.messageService.deleteOne({ _id: id });

    return message;
  }

  @ApiOperation({
    description: 'Get contact list with pagination',
    summary: 'Get contact list with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ContactsListPagination,
    description: 'Contact list',
  })
  @ApiBearerAuth()
  @Get('contacts-list')
  async getContactsListWithPagination(
    @CurrentUser() currentUser: UserDocument,
    @Req() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<ContactsListPagination> {
    return this.messageService.getContactsListWithPagination({
      request,
      currentUser,
      paginationDto,
    });
  }
}
