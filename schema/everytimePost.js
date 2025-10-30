import mongoose from 'mongoose';

// 크롤링한 에브리타임 게시물을 저장할 스키마
const EverytimePostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  link: {
    type: String,
    required: true,
    unique: true, // link를 고유 식별자로 사용하여 중복 저장을 방지
  },
  time: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const EverytimePostModel = mongoose.model('EverytimePost', EverytimePostSchema);
