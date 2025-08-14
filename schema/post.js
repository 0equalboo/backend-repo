// schema/post.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 작성자 (User 모델과 연결)
    postType: { type: String, enum: ['lost', 'found'], required: true }, // 게시글 종류 (분실물/습-득물)
    title: { type: String, required: true }, // 제목
    content: { type: String }, // 본문글
    imageUrl: { type: String }, // 이미지 URL
    itemDate: { type: Date, required: true }, // 습득(분실)일
    location: { type: String, required: true }, // 습득(분실)장소 (예: 광개토관)
    itemCategory: { // 물품 분류
        main: { type: String, required: true }, // 대분류 (예: 전자기기)
        sub: { type: String }  // 소분류 (예: 이어폰)
    },
    status: { type: String, enum: ['보관중', '연락중', '완료'], default: '보관중' }, // 물품 상태
}, { timestamps: true }); // createdAt, updatedAt 자동 생성

export const PostModel = mongoose.model("Post", PostSchema);