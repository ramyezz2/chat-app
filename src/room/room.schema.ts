import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RoomRoleEnum, RoomTypeEnum } from 'src/shared/enums';

class RoomMemberDocument {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  member: Types.ObjectId;
  @Prop({ type: String, enum: RoomRoleEnum })
  role: RoomRoleEnum;
}

@Schema({
  timestamps: true,
  collection: 'room',
})
export class RoomDocument extends Document {
  @Prop()
  name: string;

  @Prop({ required: true, enum: RoomTypeEnum })
  type: RoomTypeEnum;

  @Prop()
  description: string;

  @Prop({
    type: [
      {
        member: { type: Types.ObjectId, ref: 'UserDocument' },
        role: { type: String, enum: RoomRoleEnum },
        _id: false,
      },
    ],
  })
  members: RoomMemberDocument[];

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  updatedBy?: Types.ObjectId;
}

export const RoomSchema = SchemaFactory.createForClass(RoomDocument);

RoomSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret.updatedAt;
    delete ret.createdAt;
    delete ret._id;
    delete ret.__v;
  },
});
