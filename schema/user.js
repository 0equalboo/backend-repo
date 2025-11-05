import mongoose from "mongoose";
import bcrypt from "bcrypt"; // 1. bcrypt 임포트

const UserSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

// 2. (추가) pre-save 훅
// save (create 포함) 함수가 실행되기 전에 이 함수를 먼저 실행
UserSchema.pre('save', async function(next) {
    // 'password' 필드가 수정되었을 때만 암호화 실행
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // 3. 비밀번호 암호화 (Salt 10회)
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

export const UserModel = mongoose.model("User", UserSchema);