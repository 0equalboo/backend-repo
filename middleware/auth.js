// middleware/auth.js
import jwt from 'jsonwebtoken';
import { UserModel } from '../schema/user.js';

export const authMiddleware = async (req, res, next) => {
    // 1. 요청 헤더에서 Authorization 값을 찾습니다.
    const authHeader = req.headers.authorization;

    // 2. 헤더가 없거나, 'Bearer '로 시작하지 않으면 오류를 반환합니다.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send("인증 토큰이 없거나 잘못되었습니다.");
    }

    // 'Bearer ' 부분을 잘라내고 실제 토큰 값만 추출합니다.
    const token = authHeader.split(' ')[1];

    try {
        // 3. jwt.verify로 토큰을 검증합니다.
        // 이 비밀키는 로그인 시 토큰을 발급할 때 사용한 키와 동일해야 합니다.
        const decoded = jwt.verify(token, "1234qwer");

        // 4. 토큰에서 추출한 정보로 DB에서 실제 사용자를 찾습니다.
        const user = await UserModel.findOne({ studentId: decoded.id });
        if (!user) {
            return res.status(404).send("사용자를 찾을 수 없습니다.");
        }

        // 5. req 객체에 user 정보를 추가하여, 다음 로직에서 사용할 수 있도록 합니다.
        req.user = user;

        // 6. 모든 검증을 통과했으므로, next()를 호출해 다음 단계로 넘어갑니다.
        next();
    } catch (error) {
        // 토큰이 만료되었거나, 비밀키가 일치하지 않는 등 검증에 실패한 경우
        return res.status(401).send("유효하지 않은 토큰입니다.");
    }
};