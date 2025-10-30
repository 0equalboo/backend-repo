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