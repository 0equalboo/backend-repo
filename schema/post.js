import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 작성자 ID
    postType: { type: String, enum: ['lost', 'found'], required: true }, // 'lost' 또는 'found'
    title: { type: String, required: true },
    content: { type: String },
    imageUrl: { type: String }, // S3에 업로드된 이미지 URL
    itemDate: { type: Date, required: true }, // 분실/습득 날짜
    location: { type: String, required: true }, // 건물명 (예: 광개토관, 대양홀)
    locationDetail: { type: String }, // 상세 장소 (예: 101호)
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' }, // 보관중/찾는중, 전달완료
}, { timestamps: true });

export const PostModel = mongoose.model("Post", PostSchema);