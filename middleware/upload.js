// middleware/upload-s3.js

import { S3Client } from '@aws-sdk/client-s3'; // v3 import
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// .env 파일에서 AWS 키와 버킷 정보 가져오기
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } = process.env;

// 1. AWS S3 클라이언트를 v3 방식으로 생성합니다.
const s3 = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  },
  region: AWS_REGION
});

// 2. multer-s3 설정
const s3Storage = multerS3({
  s3: s3, // v3 S3 클라이언트를 전달
  bucket: AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    // S3에 저장될 파일 이름 설정
    const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
    cb(null, fileName);
  }
});

const uploadS3 = multer({ 
    storage: s3Storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

export default uploadS3;