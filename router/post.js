// router/post.js

import express from 'express';
import { PostModel } from '../schema/post.js';
import { authMiddleware } from '../middleware/auth.js';
import uploadS3 from '../middleware/upload.js'; 
import axios from 'axios';
import FormData from 'form-data'; // [추가] 파일 전송용
import multer from 'multer';

const uploadMemory = multer({ storage: multer.memoryStorage() });
const AI_SERVER_URL = "https://unpenetrated-laurine-unmeasurably.ngrok-free.dev"; //수정
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

        if (fileUrl) {
            try {
                // Python 서버의 /add-vector 엔드포인트 호출
                const aiResponse = await axios.post(`${AI_SERVER_URL}/add-vector`, {
                    s3_url: fileUrl
                });

                // 3. AI 서버가 준 faissId를 받아서 DB 업데이트
                const faissId = aiResponse.data.faissId;
                
                post.faissId = faissId;
                await post.save(); // 업데이트 된 faissId 저장

                console.log(`[AI 연동 성공] Post ID: ${post._id}, Faiss ID: ${faissId}`);

            } catch (aiError) {
                console.error("AI 서버 벡터 등록 실패 (게시글은 저장됨):", aiError.message);
                // 게시글 저장은 성공했으므로 굳이 에러를 던지지는 않고 로그만 남김
            }
        }

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

/**
 * [신규] 이미지 검색 API (AI 유사도 분석 시뮬레이션)
 * POST /api/v1/posts/search/image
 */
PostRouter.post("/search/image", uploadMemory.single('image'), async (req, res) => {
    try {
        // 1. 프론트에서 받은 파일 확인
        if (!req.file) {
            return res.status(400).send("이미지가 없습니다.");
        }

        // 2. Python AI 서버로 보낼 폼 데이터 생성
        const formData = new FormData();
        // req.file.buffer는 메모리에 있는 이미지 바이너리 데이터
        formData.append('file', req.file.buffer, req.file.originalname);

        // 3. Python 서버에 검색 요청
        const aiResponse = await axios.post(`${AI_SERVER_URL}/search-image`, formData, {
            headers: {
                ...formData.getHeaders() // 중요: 멀티파트 헤더 설정
            }
        });

        // Python 결과 예시: { "faissIds": [10, 5, 2], "distances": [0.88, 0.75, 0.71] }
        const { faissIds, distances } = aiResponse.data;

        if (!faissIds || faissIds.length === 0) {
            return res.status(200).json([]); // 결과 없음
        }

        // 4. faissId들을 이용해 MongoDB에서 게시글 정보 조회
        // $in 연산자를 사용해 ID 목록에 해당하는 글을 모두 가져옴
        const posts = await PostModel.find({
            faissId: { $in: faissIds }
        }).populate("author", "nickname");

        // 5. [중요] MongoDB 결과는 faissIds 순서와 다를 수 있음.
        // AI가 알려준 '유사도 순서(faissIds)'대로 정렬하고, 유사도 점수도 붙여줌.
        const sortedPosts = faissIds.map((id, index) => {
            const post = posts.find(p => p.faissId === id);
            if (post) {
                // Mongoose 문서를 일반 객체로 변환 후 similarity 추가
                return {
                    ...post.toObject(),
                    similarity: Math.round(distances[index] * 100) // 0.88 -> 88%
                };
            }
            return null;
        }).filter(p => p !== null); // 혹시 DB에 없는 ID가 있다면 제거

        return res.status(200).json(sortedPosts);

    } catch (error) {
        console.error("이미지 검색 실패:", error.message);
        return res.status(500).send("이미지 검색 중 오류가 발생했습니다.");
    }
});

// router/post.js

/**
 * [신규] 텍스트로 이미지 검색 API (AI)
 * POST /api/v1/posts/search/text
 * Body: { "query": "검정색 신발" }
 */
PostRouter.post("/search/text", async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) return res.status(400).send("검색어가 없습니다.");

        // 1. Python AI 서버에 텍스트 전송
        const aiResponse = await axios.post(`${AI_SERVER_URL}/search-text`, {
            query: query
        });

        const { faissIds, distances } = aiResponse.data;

        if (!faissIds || faissIds.length === 0) {
            return res.status(200).json([]);
        }

        // 2. DB 조회 (기존 이미지 검색 로직과 동일)
        const posts = await PostModel.find({
            faissId: { $in: faissIds }
        }).populate("author", "nickname");

        // 3. 순서 정렬 및 유사도 매핑
        const sortedPosts = faissIds.map((id, index) => {
            const post = posts.find(p => p.faissId === id);
            if (post) {
                return {
                    ...post.toObject(),
                    similarity: Math.round(distances[index] * 100)
                };
            }
            return null;
        }).filter(p => p !== null);

        return res.status(200).json(sortedPosts);

    } catch (error) {
        console.error("AI 텍스트 검색 실패:", error.message);
        return res.status(500).send("AI 검색 중 오류 발생");
    }
});

export default PostRouter;