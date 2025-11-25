import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // 관련 게시글
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 참여자 2명 (작성자, 문의자)
  lastMessage: { type: String }, // 채팅방 목록에서 보여줄 마지막 메시지
  lastMessageTime: { type: Date, default: Date.now }, // 정렬용 시간
}, {timestapms: true});

export const ChatRoomModel = mongoose.model("ChatRoom", ChatRoomSchema);
