import express from 'express';
import { UserModel } from '../schema/user.js';
// 미들웨어 이름 통일 (authMiddleware로 사용)
import { authMiddleware } from '../middleware/auth.js'; 
import bcrypt from "bcrypt"; 

// 1. 변수명을 router로 통일 (UserRouter -> router)
const router = express.Router();

// 회원가입 API (POST /api/v1/users/signup)
router.post("/signup", async (req, res) => {
    try {
        const newUser = await UserModel.create(req.body);
        return res.status(201).json(newUser);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

// 내 정보 확인 API (GET /api/v1/users/me)
// 2. 미들웨어 변수명 통일 (authMiddleware 사용)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

// 회원정보 수정 (PUT /api/v1/users/me)
// 3. UserRouter.put 대신 router.put 사용 + isAuth 대신 authMiddleware 사용
router.put("/me", authMiddleware, async (req, res) => {
  const { nickname, password } = req.body;

  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "유저 없음" });

    // 닉네임 변경 요청 시
    if (nickname) user.nickname = nickname;

    // 비밀번호 변경 요청 시
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save(); 

    res.status(200).json({ 
        message: "정보가 수정되었습니다.", 
        user: { 
            _id: user._id, 
            nickname: user.nickname, 
            email: user.email 
        } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "정보 수정 실패" });
  }
});

// 4. router 내보내기
export default router;