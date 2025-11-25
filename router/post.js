//router/post.js

import express from 'express';
import { PostModel } from '../schema/post.js';
import { authMiddleware } from '../middleware/auth.js';
import uploadS3 from '../middleware/upload.js'; // S3 업로드용 미들웨어

const PostRouter = express.Router();

/**
 * (신규) 새 게시글 작성 API (이미지 + 텍스트 동시 처리)
 * POST /api/v1/posts
 * - 프론트의 createPost()와 연동됩니다.
 */
PostRouter.post("/", authMiddleware, uploadS3.single('image'), async (req, res) => {
    try {
        // 1. uploadS3 미들웨어가 'image' 필드의 파일을 S3에 업로드
        const fileUrl = req.file ? req.file.location : null; // S3 URL 획득

        // 2. req.body로 텍스트 필드(title, content 등)를 받음
        const newPostData = {
            ...req.body, 
            image: fileUrl, // S3 URL을 'image' 필드에 저장 (스키마와 일치)
            author: req.user._id, // 인증된 사용자 ID
        };

        const post = await PostModel.create(newPostData);
        return res.status(201).json(post);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const posts = await PostModel.find({ author: req.user._id })
      .sort({ createdAt: -1 }); // 최신순
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "내 글 불러오기 실패" });
  }
});

/**
 * (수정) 전체 게시글 목록 조회 API (페이지네이션/필터링 적용)
 * GET /api/v1/posts
 * - 프론트의 getPosts()와 연동됩니다.
 */
PostRouter.get("/", async (req, res) => {
    try {
        // 1. (수정) 'search' 쿼리 파라미터 추가
        const { type, status, page = 1, limit = 10, search } = req.query;

        // 2. 검색 조건(filter) 객체 생성
        const filter = {};
        if (type) filter.type = type; // 'lost' 또는 'found'
        if (status) filter.itemStatus = status; // '보관중', '완료' 등

        // 3. (신규) 'search' 쿼리가 있으면, 검색 조건($or) 추가
        if (search) {
            filter.$or = [
                // 'i' 옵션은 대소문자 무시 (case-insensitive)
                { title: { $regex: search, $options: 'i' } },
                { acquisitionLocation: { $regex: search, $options: 'i' } },
                { itemCategory: { $regex: search, $options: 'i' } }
                // (필요시 content도 추가)
                // { content: { $regex: search, $options: 'i' } } 
            ];
        }

        // 4. (신규) 페이지네이션을 위해 총 문서 개수 먼저 계산
        const totalCount = await PostModel.countDocuments(filter);

        // 5. (기존) 필터와 페이지네이션을 적용하여 게시글 조회
        const posts = await PostModel.find(filter)
            .populate("author", "nickname") // 작성자 닉네임
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        // 6. (수정) 프론트엔드에 총 개수와 게시글 목록을 함께 반환
        return res.json({
            posts: posts,
            totalCount: totalCount
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * (신규) 특정 게시글 상세 조회 API
 * GET /api/v1/posts/:id
 * - 프론트의 getPostById()와 연동됩니다.
 */
PostRouter.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        // 몽고DB ID로 상세 조회. 작성자 닉네임 포함
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
 * (수정) 게시글 수정 API (PUT -> PATCH)
 * PATCH /api/v1/posts/:id
 * - 프론트의 updatePostStatus() 등 부분 수정에 사용됩니다.
 */
PostRouter.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).send("게시글을 찾을 수 없습니다.");
        }
        
        // 본인 소유 게시글인지 확인
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("수정 권한이 없습니다.");
        }

        // req.body로 받은 새 정보로 업데이트 (부분 수정)
        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            req.body, // { "status": "완료" } 등 수정할 내용
            { new: true } // 업데이트된 문서를 반환
        );

        return res.status(200).json(updatedPost);

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 게시글 삭제 API
 * DELETE /api/v1/posts/:id
 */
PostRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).send("게시글을 찾을 수 없습니다.");
        }

        // 본인 소유 게시글인지 확인
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("삭제 권한이 없습니다.");
        }

        // 게시글 삭제 실행
        await PostModel.findByIdAndDelete(postId);

        return res.status(200).send({ message: "게시글이 성공적으로 삭제되었습니다." });

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

export default PostRouter;