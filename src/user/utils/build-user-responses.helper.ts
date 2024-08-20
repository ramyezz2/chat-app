import { UserResponse } from '../dto';
import { UserDocument } from '../user.schema';
import environment from 'src/config/environment';
import * as jwt from 'jsonwebtoken';
import { MemberResponse } from '../dto/member.response.dto';
import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';

export const buildUserForGuardRO = ({
  document,
}: {
  document: UserDocument;
}): MemberResponse => {
  return {
    id: document.id,
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    phone: document.phone,
  };
};

export const buildMemberSimpleListResponse = ({
  member,
}: {
  member: UserDocument;
}): SimpleListResponse => {
  return !member
    ? null
    : {
        id: member.id,
        name: (
          (member.firstName || '') +
          ' ' +
          (member.lastName || '')
        ).trim(),
      };
};

export const buildUserResponse = ({
  document,
}: {
  document: UserDocument;
}): UserResponse => {
  return {
    id: document.id,
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    accessToken: generateToken(
      document,
      environment?.tokenExpiresIn || '6h',
      'TOKEN',
    ),
    refreshToken: generateToken(
      document,
      environment?.refreshTokenExpiresIn || '30d',
      'REFRESH',
    ),
    phone: document.phone,
  };
};

const generateToken = (user, expiresIn, type?) => {
  return jwt.sign(
    {
      id: user._id,
      name: `${user.firstName} ${user?.lastName || ''}`.trim(),
      email: user.email,
      type,
    },
    environment.secret,
    { expiresIn },
  );
};

export const buildMemberResponse = ({
  member,
}: {
  member: UserDocument;
}): MemberResponse => {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone || '',
    gender: member.gender || '',
  };
};
