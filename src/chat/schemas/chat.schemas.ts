import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { RoomDocument } from "src/room/room.schema";
import { UserDocument } from "src/user/user.schema";

export type ChatDocument = HydratedDocument<Chat>;

@Schema({
    timestamps: true,
    versionKey: false,
})
export class Chat {

    @Prop({ required: true })
    content: string;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: UserDocument.name, autopopulate: true })
    sender_id: UserDocument;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: RoomDocument.name })
    room_id: RoomDocument;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
