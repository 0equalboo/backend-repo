import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true }, // 학번 (로그인 ID)
    password: { type: String, required: true }, // 비밀번호 (나중에 해싱 필요)
    nickname: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
}, { timestamps: true }); // timestamps: true 옵션으로 createdAt, updatedAt 자동 생성

export const UserModel = mongoose.model("User", UserSchema);

