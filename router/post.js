// router/post.js

import express from 'express';
import { PostModel } from '../schema/post.js';
import { authMiddleware } from '../middleware/auth.js';
import uploadS3 from '../middleware/upload.js'; 

const PostRouter = express.Router();

/**
 * 1. 새 게시글 작성 API
 * POST /api/v1/posts
 */
PostRouter.post("/", authMiddleware, uploadS3.single('image'), async (req, res) => {
    try {
        const fileUrl = req.file ? req.file.location : null; 
        const newPostData = {
            ...req.body, 
            image: fileUrl, 
            author: req.user._id, 
        };
        const post = await PostModel.create(newPostData);
        return res.status(201).json(post);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 2. [순서 중요] 내 글 조회 API
 * GET /api/v1/posts/my
 * - 반드시 /:id 보다 위에 있어야 합니다.
 * - 변수명을 PostRouter로 통일했습니다.
 */
PostRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const posts = await PostModel.find({ author: req.user._id })
      .sort({ createdAt: -1 }); 
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "내 글 불러오기 실패" });
  }
});

/**
 * 3. 전체 게시글 목록 조회 API (검색/페이징)
 * GET /api/v1/posts
 */
PostRouter.get("/", async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10, search } = req.query;
        const filter = {};
        
        if (type) filter.type = type; 
        if (status) filter.itemStatus = status; 

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { acquisitionLocation: { $regex: search, $options: 'i' } },
                { itemCategory: { $regex: search, $options: 'i' } }
            ];
        }

        const totalCount = await PostModel.countDocuments(filter);

        const posts = await PostModel.find(filter)
            .populate("author", "nickname") 
            .sort({ createdAt: -1 }) 
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        return res.json({
            posts: posts,
            totalCount: totalCount
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 4. 특정 게시글 상세 조회 API
 * GET /api/v1/posts/:id
 * - '/my' 요청이 여기까지 내려오면 안 됩니다.
 */
PostRouter.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await PostModel.findById(postId).populate("author", "nickname"); 
        
        if (!post) {
            return res.status(404).send("게시글을 찾을 수 없습니다.");
        }
        return res.json(post);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 5. 게시글 수정 API
 */
PostRouter.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await PostModel.findById(postId);
        if (!post) return res.status(404).send("게시글 없음");
        
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("권한 없음");
        }

        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            req.body, 
            { new: true } 
        );

        return res.status(200).json(updatedPost);

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 6. 게시글 삭제 API
 */
PostRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await PostModel.findById(postId);
        if (!post) return res.status(404).send("게시글 없음");

        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("권한 없음");
        }

        await PostModel.findByIdAndDelete(postId);

        return res.status(200).send({ message: "삭제 완료" });

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

export default PostRouter;