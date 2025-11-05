//router/auth.js
import express from 'express';
import { UserModel } from "../schema/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // 1. bcrypt 임포트

const AuthRouter = express.Router();

AuthRouter.post("/login", async (req, res) => {
    const { studentId, password } = req.body;

    // 2. (수정) 비밀번호를 포함하여 사용자 정보 조회
    const user = await UserModel.findOne({ studentId }).select('+password');

    if (!user) {
        return res.status(404).send("사용자를 찾을 수 없습니다.");
    }

    // 3. (수정) 일반 텍스트 비교 대신 bcrypt.compare 사용
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).send("비밀번호가 틀립니다.");
    }

    // 4. (수정) 비밀번호가 일치하면, 응답용 객체에서 비밀번호 제거
    // (user.password는 delete로 지워지지 않으므로, .toObject() 사용)
    const userObject = user.toObject();
    delete userObject.password;

    const token = jwt.sign(
        { id: user.studentId, _id: user._id },
        "1234qwer", // (보안 경고: .env로 옮기세요)
        { expiresIn: "1h", issuer: "SeManChu" }
    );

    // 5. 프론트의 AuthResponse 타입에 맞게 객체로 반환
    return res.status(200).json({
        user: userObject, // 비밀번호가 제거된 사용자 객체
        accessToken: token
    });
});

export default AuthRouter;