import express from 'express';
// import { UserModel} from "../schema/user.js"; // <-- 이 줄 주석 처리
import jwt from "jsonwebtoken";

const AuthRouter = express.Router(); // express.Router()로 수정

AuthRouter.post("/login", async (req, res) => {
    // const data = req.body;
    // const user = await UserModel.findOne({ id : data.id }); // <-- 이 줄 주석 처리
    // if (!user) {
    //    return res.send("사용자를 찾을 수 없습니다.");
    // }
    // if (user.password != data.password) {
    //    return res.send("비밀번호가 틀립니다.");
    // }

    // 지금은 로그인 로직을 임시로 막아두고, 토큰 발급만 테스트
    const token = jwt.sign( { type: "JWT", id: "testuser" }, "1234qwer", { expiresIn: "30m", issuer: "Arom" });

    return res.send(token);
});

export default AuthRouter; // AutoRouter -> AuthRouter 오타 수정