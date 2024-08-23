import { faker } from '@faker-js/faker';
import {
  CreateDirectMessageRequest,
  CreateRoomMessageRequest,
  MessageResponse,
  UpdateMessageRequest,
} from 'src/message/dto';
import { MessageDocument } from '../message/message.schema';
import { MessageTypeEnum } from 'src/shared/enums';

export const mockedCreateDirectMessageRequest: CreateDirectMessageRequest = {
  content: faker.lorem.sentence(),
  receiverId: faker.database.mongodbObjectId(),
};

export const mockedCreateRoomMessageRequest: CreateRoomMessageRequest = {
  content: faker.lorem.sentence(),
  roomId: faker.database.mongodbObjectId(),
};

export const mockedUpdateMessageRequest: UpdateMessageRequest = {
  content: faker.lorem.sentence(),
};

export const mockedDirectMessageResponse: MessageResponse = {
  id: faker.database.mongodbObjectId(),
  content: mockedCreateDirectMessageRequest.content,
  type: MessageTypeEnum.DIRECT,
  sender: {
    id: faker.database.mongodbObjectId(),
    name: faker.person.fullName(),
  },
  receiver: {
    id: faker.database.mongodbObjectId(),
    name: faker.person.fullName(),
  },
  room: null,
  editHistory: [
    {
      content: faker.lorem.sentence(),
      createdAt: faker.date.recent(),
    },
  ],
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
};

export const mockedRoomMessageResponse: MessageResponse = {
  id: faker.database.mongodbObjectId(),
  content: mockedCreateDirectMessageRequest.content,
  type: MessageTypeEnum.ROOM,
  sender: {
    id: faker.database.mongodbObjectId(),
    name: faker.person.fullName(),
  },
  receiver: null,
  room: {
    id: faker.database.mongodbObjectId(),
    name: faker.lorem.word(),
  },
  editHistory: [
    {
      content: faker.lorem.sentence(),
      createdAt: faker.date.recent(),
    },
  ],
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
};

export const mockedMessageDocumentResponse: MessageDocument | any = {
  id: mockedDirectMessageResponse.id,
  content: mockedCreateDirectMessageRequest.content,
  type: MessageTypeEnum.DIRECT,
  sender: {
    id: faker.database.mongodbObjectId(),
    name: faker.person.fullName(),
  },
  receiver: {
    id: faker.database.mongodbObjectId(),
    name: faker.person.fullName(),
  },
  editHistory: [
    {
      content: faker.lorem.sentence(),
      createdAt: faker.date.recent(),
    },
  ],
};
