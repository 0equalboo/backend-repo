// router/user.js
import express from 'express';
import { UserModel } from '../schema/user.js';
import { authMiddleware } from '../middleware/auth.js';
const UserRouter = express.Router();

// 회원가입 API
UserRouter.post("/signup", async (req, res) => {
    try {
        const newUser = await UserModel.create(req.body);
        return res.status(201).json(newUser);
    } catch (error) {
        // 이미 존재하는 ID 또는 닉네임일 경우 에러 발생
        return res.status(500).send(error.message);
    }
});

UserRouter.put("/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id; // 1. authMiddleware가 찾아준 내 ID
        const updateInfo = req.body; // 2. 수정할 정보 (예: { "nickname": "..." })

        // 3. 비밀번호나 학번 같은 민감한 정보는 수정 못하게 막기 (선택 사항)
        if (updateInfo.password || updateInfo.studentId) {
            return res.status(400).send("비밀번호나 학번은 변경할 수 없습니다.");
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            updateInfo,
            { new: true }
        ).select('-password'); // 4. 비밀번호를 제외하고 반환

        return res.status(200).json(updatedUser);

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

export default UserRouter;