import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';
import { RoomResponse } from '../dto/room.response';
import { buildMemberSimpleListResponse } from 'src/user/utils';
import { RoomDocument } from '../room.schema';
import { UserDocument } from 'src/user/user.schema';

export const buildRoomResponse = ({
  room,
}: {
  room: RoomDocument;
}): RoomResponse => {
  return {
    id: room.id,
    name: room.name || '',
    type: room.type,
    description: room.description || '',
    members: room.members.map((item) => {
      return buildMemberSimpleListResponse({
        member: item.member as unknown as UserDocument,
      });
    }),
    createdBy: buildMemberSimpleListResponse({
      member: room.createdBy as unknown as UserDocument,
    }),
  };
};

export const buildRoomSimpleListResponse = ({
  room,
}: {
  room: RoomDocument;
}): SimpleListResponse => {
  return !room
    ? null
    : {
        id: room.id,
        name: room.name,
      };
};
