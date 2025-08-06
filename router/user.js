// router/user.js
import express from 'express';
import { UserModel } from '../schema/user.js';

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

export default UserRouter;