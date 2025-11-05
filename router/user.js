//router/user.js

import express from 'express';
import { UserModel } from '../schema/user.js';
import { authMiddleware } from '../middleware/auth.js';

const UserRouter = express.Router();

// 회원가입 API (POST /api/v1/users/signup)
UserRouter.post("/signup", async (req, res) => {
    try {
        const newUser = await UserModel.create(req.body);
        return res.status(201).json(newUser);
    } catch (error) {
        // 이미 존재하는 ID 또는 닉네임일 경우 에러 발생
        return res.status(500).send(error.message);
    }
});

// 내 정보 확인 API (GET /api/v1/users/me)
UserRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    // authMiddleware가 req.user에 넣어준 사용자 정보를 반환 (비밀번호 제외)
    const user = await UserModel.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

export default UserRouter;