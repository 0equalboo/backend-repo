// schema/message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true }, // 채팅방 ID
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 보낸 사람
  content: { type: String, required: true }, // 내용
  isRead: { type: Boolean, default: false }, // 읽음 여부 (선택 사항)
}, { timestamps: true });

export const MessageModel = mongoose.model("Message", MessageSchema);