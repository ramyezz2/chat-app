import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageTypeEnum } from 'src/shared/enums';

class MessageEditHistoryDocument {
  @Prop({ type: String, required: true })
  content: string;
  @Prop({ type: Date, required: true })
  createdAt: Date;
}

@Schema({
  timestamps: true,
  collection: 'message',
})
export class MessageDocument extends Document {
  @Prop({ required: true, enum: MessageTypeEnum })
  type: MessageTypeEnum;

  @Prop({ type: Types.ObjectId, ref: 'RoomDocument' })
  room: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument' })
  receiver: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop([{ content: String, createdAt: Date }])
  editHistory: MessageEditHistoryDocument[];

  createdAt;
  updatedAt;
}

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);

MessageSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    // delete ret.updatedAt;
    // delete ret.createdAt;
    delete ret._id;
    delete ret.__v;
  },
});
