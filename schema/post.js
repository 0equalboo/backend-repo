import mongoose from "mongoose";

// 프론트엔드 LostDetail 인터페이스에 맞게 수정한 PostSchema
const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 작성자 (User 모델과 연결)
    
    // 'postType' -> 'type' (프론트엔드 호환)
    type: { type: String, enum: ['lost', 'found'], required: true }, // 게시글 종류 (분실물/습득물)
    
    title: { type: String, required: true }, // 제목
    content: { type: String }, // 본문글
    
    // 'imageUrl' -> 'image' (프론트엔드 호환)
    image: { type: String }, // 이미지 URL
    
    // 'itemDate' -> 'acquisitionDate' (프론트엔드 호환)
    // 프론트엔드가 '25.08.15' 형식의 문자열을 사용하므로 Date 대신 String으로 변경
    acquisitionDate: { type: String, required: true }, // 습득(분실)일
    
    // 'location' -> 'acquisitionLocation' (프론트엔드 호환)
    acquisitionLocation: { type: String, required: true }, // 습득(분실)장소 (예: 광개토관)
    
    // 'itemCategory'를 객체에서 String으로 변경 (프론트엔드 호환)
    itemCategory: { 
        type: String, 
        required: true 
    }, // 물품 분류 (예: "전자기기")
    
    // 'status' -> 'itemStatus' (프론트엔드 호환)
    itemStatus: { type: String, enum: ['보관중', '연락중', '완료'], default: '보관중' }, // 물품 상태
    
    // faissId는 나중에 구현할 것이므로 주석 처리
    // faissId: {
    //   type: Number,
    //   index: true,
    // },
    // -1은 "벡터 없음"을 의미하도록 초기화
    faissId: { type: Number, default: -1 },

}, { timestamps: true }); // createdAt, updatedAt 자동 생성

export const PostModel = mongoose.model("Post", PostSchema);