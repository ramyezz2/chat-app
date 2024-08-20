import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';
import { GroupResponse } from '../dto/group.response';
import { buildMemberSimpleListResponse } from 'src/user/utils';
import { GroupDocument } from '../group.schema';
import { UserDocument } from 'src/user/user.schema';

export const buildGroupResponse = ({
  group,
}: {
  group: GroupDocument;
}): GroupResponse => {
  return {
    id: group.id,
    name: group.name || '',
    type: group.type,
    description: group.description || '',
    members: group.members.map((item) => {
      return buildMemberSimpleListResponse({
        member: item.member as unknown as UserDocument,
      });
    }),
    createdBy: buildMemberSimpleListResponse({
      member: group.createdBy as unknown as UserDocument,
    }),
  };
};

export const buildGroupSimpleListResponse = ({
  group,
}: {
  group: GroupDocument;
}): SimpleListResponse => {
  return !group
    ? null
    : {
        id: group.id,
        name: group.name,
      };
};
