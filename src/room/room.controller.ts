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
import { RoomService } from './room.service';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationSimpleList } from '../shared/types/simple-list-pagination.dto';
import {
  PaginationDto,
  SimpleListPaginationDto,
} from '../shared/helpers/pagination';
import { checkObjectIdPipe } from '../shared/pipes/check-objectId.pipe';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { MainExceptionDto } from 'src/shared/exceptions/main.exception';
import { UserDocument } from 'src/user/user.schema';
import {
  RoomResponse,
  RoomFilterRequest,
  RoomsPagination,
  CreateRoomRequest,
  UpdateRoomRequest,
} from './dto';
import { RoomTypeEnum } from 'src/shared/enums';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}
  @ApiOperation({
    description: 'Get rooms with pagination',
    summary: 'Get rooms with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RoomResponse,
    isArray: true,
    description: 'Get rooms with pagination',
  })
  @ApiBearerAuth()
  @Get('mine')
  async getMemberRoomsWithPagination(
    @CurrentUser() currentUser,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: RoomFilterRequest,
  ): Promise<RoomsPagination> {
    const planFilterDto = new RoomFilterRequest(filterDto).buildFilterRO();
    const options = {
      where: {
        ...planFilterDto,
        'members.member': currentUser._id,
      },
      order: { name: 'ASC' },
    };
    return await this.roomService.getRoomsWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Get rooms with pagination',
    summary: 'Get rooms with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RoomResponse,
    isArray: true,
    description: 'Get rooms with pagination',
  })
  @ApiBearerAuth()
  @Get()
  async getRoomsWithPagination(
    @CurrentUser() currentUser,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: RoomFilterRequest,
  ): Promise<RoomsPagination> {
    const planFilterDto = new RoomFilterRequest(filterDto).buildFilterRO();
    const options = {
      where: { ...planFilterDto },
      order: { name: 'ASC' },
    };
    return await this.roomService.getRoomsWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Get all rooms With simple list Pagination',
    summary: 'Get all rooms With simple list Pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginationSimpleList,
    isArray: true,
    description: 'Get all rooms With simple list Pagination',
  })
  @ApiBearerAuth()
  @Get('simple-list')
  async getRoomsSimpleList(
    @Req() request,
    @CurrentUser() currentUser,
    @Query() paginationDto: SimpleListPaginationDto,
  ): Promise<PaginationSimpleList> {
    const options = { where: {}, order: { name: 'ASC' } };
    if (paginationDto.search) {
      options.where = {
        name: new RegExp(paginationDto.search, 'i'),
      };
    }

    return await this.roomService.getRoomsSimpleList({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Create new room',
    summary: 'Create new room',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RoomResponse,
    description: 'create new room',
  })
  @ApiBearerAuth()
  @Post('')
  async create(
    @CurrentUser() currentUser,
    @Body() dto: CreateRoomRequest,
  ): Promise<RoomResponse> {
    // Validate uniqueness for Name
    const checkUnique = await this.roomService.checkUniquenessForName({
      name: dto.name,
    });

    if (checkUnique) {
      const errors = ['Name must be unique.'];
      throw new HttpException(
        { message: 'Name must be unique.', errors },
        HttpStatus.CONFLICT,
      );
    }

    // Check members exist
    if (dto.members?.length > 0) {
      const checkMembersExist = await this.roomService.checkMembersExist({
        membersIds: dto.members,
      });

      if (!checkMembersExist) {
        const message =
          'Selected members are not found or mismatch array length.';
        throw new HttpException(
          { message, errors: [message] },
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.roomService.create({ currentUser, dto });
  }

  @ApiOperation({
    description: 'Update Room data',
    summary: 'Update Room data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RoomResponse,
    description: 'Room updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'unauthorized, bearer token not provided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Room not found',
  })
  @ApiBearerAuth()
  @Patch(':roomId')
  async update(
    @CurrentUser() currentUser,
    @Param('roomId', checkObjectIdPipe) id: string,
    @Body() dto: UpdateRoomRequest,
  ): Promise<RoomResponse> {
    const room = await this.roomService.getRoom({ id });
    if (!room) {
      const errors = ['Room not found.'];
      throw new HttpException(
        { message: 'Not Found', errors },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (room.createdBy.id.toString() !== currentUser.id.toString()) {
      const message =
        'You are not authorized to update this room, You must be the room creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    // Validate uniqueness for name in the same company
    if (dto.name) {
      const checkUnique = await this.roomService.checkUniquenessForName(
        {
          name: dto.name,
        },
        room.id,
      );

      if (checkUnique) {
        const errors = ['Name must be unique.'];

        throw new HttpException(
          { message: 'Name must be unique.', errors },
          HttpStatus.CONFLICT,
        );
      }
    }

    // Check members exist
    if (dto.members?.length > 0) {
      const checkMembersExist = await this.roomService.checkMembersExist({
        membersIds: dto.members,
      });

      if (!checkMembersExist) {
        const message =
          'Selected members are not found or mismatch array length.';
        throw new HttpException(
          { message, errors: [message] },
          HttpStatus.CONFLICT,
        );
      }
    }

    return await this.roomService.update({
      id,
      dto,
      currentUser,
    });
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: `Rooms has been removed successfully`,
    type: RoomResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Selected Rooms Not found.',
  })
  @ApiBearerAuth()
  @Delete(':roomId')
  async deleteRoom(
    @CurrentUser() currentUser: UserDocument,
    @Param('roomId', checkObjectIdPipe) id: string,
  ): Promise<RoomResponse> {
    const room = await this.roomService.getRoom({
      id,
    });
    if (!room) {
      const errors = ['Room not found.'];
      throw new HttpException(
        { message: 'Room not found.', errors },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (room.createdBy.id.toString() !== currentUser.id.toString()) {
      const message =
        'You are not authorized to delete this room, You must be the room creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    await this.roomService.deleteOne({ _id: id });

    return room;
  }

  @ApiOperation({
    description: 'Join public room',
    summary: 'Join public room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'You joined the room successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'unauthorized, bearer token not provided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Room not found',
  })
  @ApiBearerAuth()
  @Post(':roomId/join-public-room')
  async joinRoom(
    @CurrentUser() currentUser,
    @Param('roomId', checkObjectIdPipe) roomId: string,
  ): Promise<void> {
    const room = await this.roomService.getRoom({ id: roomId });
    if (!room) {
      const message = 'Room not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    if (room.type === RoomTypeEnum.PRIVATE) {
      const message =
        'You are not authorized to join this room, The room is not public.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (room.createdBy.id.toString() === currentUser.id.toString()) {
      const message =
        'You are not authorized to join this room, You are the room creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    //check if member already exist in the DB
    const memberInTheRoom = await this.roomService.isMemberInTheRoom({
      currentUser,
      roomId,
    });
    if (memberInTheRoom) {
      const message = 'You are already joined the room.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.roomService.joinRoom({
      roomId,
      currentUser,
    });
  }

  @ApiOperation({
    description: 'Leave Room data',
    summary: 'Leave Room data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'You Leaved the room successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'unauthorized, bearer token not provided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Room not found',
  })
  @ApiBearerAuth()
  @Post(':roomId/leave')
  async leaveRoom(
    @CurrentUser() currentUser,
    @Param('roomId', checkObjectIdPipe) roomId: string,
  ): Promise<void> {
    const room = await this.roomService.getRoom({ id: roomId });
    if (!room) {
      const message = 'Room not found.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if the member is the creator
    if (room.createdBy.id.toString() === currentUser.id.toString()) {
      const message =
        'You are not authorized to leave this room, You are the room creator.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }

    //check if member already exist in the DB
    const memberInTheRoom = await this.roomService.isMemberInTheRoom({
      currentUser,
      roomId,
    });
    if (!memberInTheRoom) {
      const message = 'You are not a member in this room.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.roomService.leaveRoom({
      roomId,
      currentUser,
    });
  }
}
