import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GroupRoleEnum, GroupTypeEnum } from 'src/shared/enums';

class GroupMemberDocument {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  member: Types.ObjectId;
  @Prop({ type: String, enum: GroupRoleEnum })
  role: GroupRoleEnum;
}

@Schema({
  timestamps: true,
  collection: 'group',
})
export class GroupDocument extends Document {
  @Prop()
  name: string;

  @Prop({ required: true, enum: GroupTypeEnum })
  type: GroupTypeEnum;

  @Prop()
  description: string;

  @Prop({
    type: [
      {
        member: { type: Types.ObjectId, ref: 'UserDocument' },
        role: { type: String, enum: GroupRoleEnum },
        _id: false,
      },
    ],
  })
  members: GroupMemberDocument[];

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  updatedBy?: Types.ObjectId;
}

export const GroupSchema = SchemaFactory.createForClass(GroupDocument);

GroupSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret.updatedAt;
    delete ret.createdAt;
    delete ret._id;
    delete ret.__v;
  },
});
