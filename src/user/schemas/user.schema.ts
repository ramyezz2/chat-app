import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { Document } from 'mongoose';
import { GenderEnum } from 'src/shared/enums';

@Schema({
  timestamps: true,
  collection: 'user',
})
export class UserDocument extends Document {
  @Prop({ type: String, trim: true })
  firstName: string;

  @Prop({ type: String, trim: true })
  lastName: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
    index: true,
    unique: true,
    sparse: true,
  })
  userName: string;

  @Prop({ enum: GenderEnum, default: GenderEnum.MALE })
  gender: GenderEnum;

  @Prop({
    type: String,
    lowercase: true,
    trim: true,
    index: true,
    sparse: true,
  })
  email: string;

  @Prop()
  @Exclude()
  hash: string;

  @Prop({ type: String, trim: true, index: true, unique: true, sparse: true })
  phone?: string;

  createdAt;
  buildUserRO?;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ email: 1, phone: 1 });

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret.updatedAt;
    // delete ret.createdAt;
    delete ret._id;
    delete ret.__v;
    delete ret.hash;
  },
});
