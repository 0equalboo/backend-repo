// middleware/upload-s3.js (S3 업로드용 설정 파일)
import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import path from 'path';

// .env 파일에서 AWS 키와 버킷 정보 가져오기
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } = process.env;

// AWS S3 클라이언트 설정
const s3 = new aws.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

// Multer-S3 스토리지 엔진 설정
const s3Storage = multerS3({
  s3: s3,
  bucket: AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE, // 콘텐츠 타입 자동 감지
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