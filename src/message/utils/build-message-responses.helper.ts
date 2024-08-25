import { RoomDocument } from 'src/room/room.schema';
import { buildRoomSimpleListResponse } from 'src/room/utils';
import { UserDocument } from 'src/user/user.schema';
import { buildMemberSimpleListResponse } from 'src/user/utils';
import { MessageResponse } from '../dto/message.response';
import { MessageDocument } from '../message.schema';
import { ContactListResponse } from '../dto';

export const buildMessageResponse = ({
  message,
}: {
  message: MessageDocument;
}): MessageResponse => {
  return {
    id: message.id,
    content: message.content || '',
    type: message.type,
    sender: buildMemberSimpleListResponse({
      member: message.sender as unknown as UserDocument,
    }),
    receiver: buildMemberSimpleListResponse({
      member: message.receiver as unknown as UserDocument,
    }),
    room: buildRoomSimpleListResponse({
      room: message.room as unknown as RoomDocument,
    }),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    editHistory: message.editHistory.map((item) => {
      return {
        content: item.content,
        createdAt: item.createdAt,
      };
    }),
  };
};

export const buildContactListResponse = ({
  contact,
  currentUserId,
}: {
  currentUserId: string;
  contact: MessageDocument;
}): ContactListResponse => {
  const member =
    contact.receiver._id.toString() == currentUserId
      ? (contact.sender as unknown as UserDocument)
      : (contact.receiver as unknown as UserDocument);

  return {
    // id: contact.id,
    content: contact.content || '',
    type: contact.type,
    member: buildMemberSimpleListResponse({
      member,
    }),
    room: buildRoomSimpleListResponse({
      room: contact.room as unknown as RoomDocument,
    }),
    createdAt: contact.createdAt,
  };
};
