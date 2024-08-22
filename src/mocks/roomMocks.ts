import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { RoomDocument } from '../room/room.schema';
import {
  CreateRoomRequest,
  RoomResponse,
  UpdateRoomRequest,
} from 'src/room/dto';
import { RoomTypeEnum } from 'src/shared/enums';

const fakeId = new Types.ObjectId();
export const mockedCreateRoomRequest: CreateRoomRequest = {
  name: faker.person.firstName(),
  type: RoomTypeEnum.PUBLIC,
  description: faker.lorem.sentence(),
  members: [],
};

export const mockedUpdateRoomRequest: UpdateRoomRequest = {
  name: faker.person.firstName(),
  description: faker.lorem.sentence(),
};

export const mockedRoomResponse: RoomResponse = {
  id: faker.database.mongodbObjectId(),
  name: mockedCreateRoomRequest.name,
  type: mockedCreateRoomRequest.type,
  description: mockedCreateRoomRequest.description,
  createdBy: { id: faker.database.mongodbObjectId(), name: faker.person.fullName() },
  members: [
    {
      id: faker.database.mongodbObjectId(),
      name: faker.person.firstName(),
    },
  ],
};

export const mockedRoomDocumentResponse: RoomDocument | any = {
  id: mockedRoomResponse.id,
  name: mockedCreateRoomRequest.name,
};
