// router/post.js

// 1. 필요한 모듈들을 파일 최상단에서 한번에 불러옵니다.
import express from 'express';
import { PostModel } from '../schema/post.js';
import { authMiddleware } from '../middleware/auth.js';
import uploadS3 from '../middleware/upload.js'; // S3 업로드용 미들웨어만 가져옵니다.

const PostRouter = express.Router();

/**
 * 이미지 업로드 API
 * - S3에 이미지를 업로드하고, 생성된 파일 URL을 반환합니다.
 */
PostRouter.post('/upload', authMiddleware, uploadS3.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('파일이 업로드되지 않았습니다.');
    }
    // multer-s3는 req.file.location 에 S3 파일의 URL을 담아줍니다.
    const fileUrl = req.file.location;
    
    res.status(201).json({ 
      message: "S3에 파일 업로드 성공!",
      fileUrl: fileUrl 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('파일 업로드 중 서버 오류가 발생했습니다.');
  }
});

/**
 * 새 게시글 작성 API
 * - 클라이언트로부터 텍스트 데이터와 이미지 URL을 받아 DB에 저장합니다.
 */
PostRouter.post("/", authMiddleware, async (req, res) => {
    try {
        const newPostData = {
            ...req.body, // title, content, fileUrl 등이 포함됨
            author: req.user._id, // authMiddleware에서 넣어준 사용자 ID
        };
        const post = await PostModel.create(newPostData);
        return res.status(201).json(post);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

PostRouter.put("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id; // 1. URL에서 수정할 게시글 ID 획득
        const userId = req.user._id;     // 2. 인증 토큰에서 사용자 ID 획득

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).send("게시글을 찾을 수 없습니다.");
        }

        // 3. 본인 소유 게시글인지 확인
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("수정 권한이 없습니다.");
        }

        // 4. (중요) req.body로 받은 새 정보로 업데이트
        // { new: true } 옵션은 업데이트된 문서를 반환하라는 의미
        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            req.body, // { "title": "...", "content": "..." } 등 수정할 내용
            { new: true }
        );

        return res.status(200).json(updatedPost);

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

PostRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).send("게시글을 찾을 수 없습니다.");
        }

        // 1. 본인 소유 게시글인지 확인
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).send("삭제 권한이 없습니다.");
        }

        // 2. 게시글 삭제 실행
        await PostModel.findByIdAndDelete(postId);

        return res.status(200).send({ message: "게시글이 성공적으로 삭제되었습니다." });

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

/**
 * 전체 게시글 목록 조회 API
 */
PostRouter.get("/", async (req, res) => {
    try {
        const posts = await PostModel.find({}).populate("author", "nickname");
        return res.json(posts);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

export default PostRouter;