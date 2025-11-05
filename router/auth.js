import express from 'express';
import { UserModel } from "../schema/user.js";
import jwt from "jsonwebtoken";

const AuthRouter = express.Router();

AuthRouter.post("/login", async (req, res) => {
    const { studentId, password } = req.body;

    // 1. (수정) 비밀번호를 제외하고 사용자 정보 조회
    const user = await UserModel.findOne({ studentId }).select('-password');

    if (!user) {
        return res.status(404).send("사용자를 찾을 수 없습니다.");
    }

    // (참고: 실제로는 user.password와 password를 bcrypt로 비교해야 함)
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) { ... }
    
    // (임시) 텍스트 비밀번호 비교 (이전 코드 기준)
    const dbUser = await UserModel.findOne({ studentId }); // 비밀번호 포함하여 다시 조회
    if (dbUser.password !== password) {
        return res.status(400).send("비밀번호가 틀립니다.");
    }

    const token = jwt.sign(
        { id: user.studentId, _id: user._id }, // studentId와 MongoDB _id를 모두 포함
        "1234qwer", // (보안 경고: 이 키는 .env로 옮겨야 합니다)
        { expiresIn: "1h", issuer: "SeManChu" }
    );

    // 2. (수정) 프론트의 AuthResponse 타입에 맞게 객체로 반환
    return res.status(200).json({
        user: user,
        accessToken: token
    });
});

export default AuthRouter;