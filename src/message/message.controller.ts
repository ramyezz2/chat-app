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
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { MainExceptionDto } from 'src/shared/exceptions/main.exception';
import { UserDocument } from 'src/user/user.schema';
import { PaginationDto } from '../shared/helpers/pagination';
import { checkObjectIdPipe } from '../shared/pipes/check-objectId.pipe';
import {
  CreateDirectMessageRequest,
  CreateRoomMessageRequest,
  MessageFilterRequest,
  MessageResponse,
  MessagesPagination,
  UpdateMessageRequest,
} from './dto';
import { MessageService } from './message.service';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
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
  @Get('direct/:receiverId')
  async getMemberMessagesWithPagination(
    @CurrentUser() currentUser,
    @Param('receiverId', checkObjectIdPipe) receiverId: string,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: MessageFilterRequest,
  ): Promise<MessagesPagination> {
    const messageFilterDto = new MessageFilterRequest(
      filterDto,
    ).buildFilterRO();
    const options = {
      where: {
        ...messageFilterDto,
        sender: currentUser._id,
        receiver: new Types.ObjectId(receiverId),
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
    @CurrentUser() currentUser,
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
        sender: currentUser._id,
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
    @CurrentUser() currentUser,
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

    return this.messageService.createDirectMessage({ currentUser, dto });
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
    @CurrentUser() currentUser,
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

    return this.messageService.createRoomMessage({ currentUser, dto });
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
    @CurrentUser() currentUser,
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
}
