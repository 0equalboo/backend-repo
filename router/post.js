// router/post.js
import express from 'express';
import { PostModel } from '../schema/post.js';
// import { authMiddleware } from '../middleware/auth.js'; // 로그인 확인 미들웨어 (나중에 구현 필요)

const PostRouter = express.Router();

/**
 * 새 게시글 작성 API
 * (authMiddleware를 추가하여 로그인한 사용자만 작성 가능하도록 해야 함)
 */
PostRouter.post("/", async (req, res) => {
    try {
        const newPostData = {
            ...req.body,
            // author: req.user.id, // 실제로는 authMiddleware에서 받아온 사용자 ID를 사용
            author: "66ba3a7268d2de3d517c5a89" // 임시 하드코딩된 사용자 ID (테스트용)
        };
        const post = await PostModel.create(newPostData);
        return res.status(201).json(post);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 전체 게시글 목록 조회 API
 */
PostRouter.get("/", async (req, res) => {
    try {
        const posts = await PostModel.find({}).populate("author", "nickname"); // author의 닉네임 정보 포함
        return res.json(posts);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

export default PostRouter;