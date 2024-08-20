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
import { GroupService } from './group.service';
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
import { CreateGroupRequest } from './dto/create-group.request.dto';
import { GroupResponse } from './dto/group.response';
import { UpdateGroupRequest } from './dto/update-group.request.dto';
import { checkObjectIdPipe } from '../shared/pipes/check-objectId.pipe';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { MainExceptionDto } from 'src/shared/exceptions/main.exception';
import { GroupsPagination } from './dto/groups-pagination.dto';
import { GroupFilterRequest } from './dto/group.filter.request.dto';
import { UserDocument } from 'src/user/user.schema';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}
  @ApiOperation({
    description: 'Get groups with pagination',
    summary: 'Get groups with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GroupResponse,
    isArray: true,
    description: 'Get groups with pagination',
  })
  @ApiBearerAuth()
  @Get('mine')
  async getMemberGroupsWithPagination(
    @CurrentUser() currentUser,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: GroupFilterRequest,
  ): Promise<GroupsPagination> {
    const planFilterDto = new GroupFilterRequest(filterDto).buildFilterRO();
    const options = {
      where: {
        ...planFilterDto,
        'members.member': currentUser._id,
      },
      order: { name: 'ASC' },
    };
    return await this.groupService.getGroupsWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Get groups with pagination',
    summary: 'Get groups with pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GroupResponse,
    isArray: true,
    description: 'Get groups with pagination',
  })
  @ApiBearerAuth()
  @Get()
  async getGroupsWithPagination(
    @CurrentUser() currentUser,
    @Req() request,
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: GroupFilterRequest,
  ): Promise<GroupsPagination> {
    const planFilterDto = new GroupFilterRequest(filterDto).buildFilterRO();
    const options = {
      where: { ...planFilterDto },
      order: { name: 'ASC' },
    };
    return await this.groupService.getGroupsWithPagination({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Get all groups With simple list Pagination',
    summary: 'Get all groups With simple list Pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginationSimpleList,
    isArray: true,
    description: 'Get all groups With simple list Pagination',
  })
  @ApiBearerAuth()
  @Get('simple-list')
  async getGroupsSimpleList(
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

    return await this.groupService.getGroupsSimpleList({
      request,
      paginationDto,
      options,
    });
  }

  @ApiOperation({
    description: 'Create new group',
    summary: 'Create new group',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GroupResponse,
    description: 'create new group',
  })
  @ApiBearerAuth()
  @Post('')
  async create(
    @CurrentUser() currentUser,
    @Body() dto: CreateGroupRequest,
  ): Promise<GroupResponse> {
    // Validate uniqueness for Name
    const checkUnique = await this.groupService.checkUniquenessForName({
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
      const checkMembersExist = await this.groupService.checkMembersExist({
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

    return this.groupService.create({ currentUser, dto });
  }

  @ApiOperation({
    description: 'Update Group data',
    summary: 'Update Group data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GroupResponse,
    description: 'Group updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: MainExceptionDto,
    description: 'unauthorized, bearer token not provided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Group not found',
  })
  @ApiBearerAuth()
  @Patch(':groupId')
  async update(
    @CurrentUser() currentUser,
    @Param('groupId', checkObjectIdPipe) id: string,
    @Body() dto: UpdateGroupRequest,
  ): Promise<GroupResponse> {
    const group = await this.groupService.getGroup({ id });
    if (!group) {
      const errors = ['Group not found.'];
      throw new HttpException(
        { message: 'Not Found', errors },
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate uniqueness for name in the same company
    if (dto.name) {
      const checkUnique = await this.groupService.checkUniquenessForName(
        {
          name: dto.name,
        },
        group.id,
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
      const checkMembersExist = await this.groupService.checkMembersExist({
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

    return await this.groupService.update({
      id,
      dto,
      currentUser,
    });
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: `Groups has been removed successfully`,
    type: GroupResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: MainExceptionDto,
    description: 'Selected Groups Not found.',
  })
  @ApiBearerAuth()
  @Delete(':groupId')
  async deleteGroup(
    @CurrentUser() currentUser: UserDocument,
    @Param('groupId', checkObjectIdPipe) id: string,
  ): Promise<GroupResponse> {
    const group = await this.groupService.getGroup({
      id,
    });
    if (!group) {
      const errors = ['Group not found.'];
      throw new HttpException(
        { message: 'Group not found.', errors },
        HttpStatus.NOT_FOUND,
      );
    }
    if (group.createdBy.id.toString() !== currentUser.id.toString()) {
      const message =
        'You are not authorized to delete this group, You must be the owner of this group.';
      throw new HttpException(
        { message, errors: [message] },
        HttpStatus.CONFLICT,
      );
    }
    await this.groupService.deleteOne({ _id: id });
    return group;
  }
}
