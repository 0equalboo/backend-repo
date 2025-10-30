import 'dotenv/config';
import express from 'express';

import AuthRouter from "./router/auth.js";
import UserRouter from "./router/user.js";
import PostRouter from "./router/post.js";

import "./db.js";
import myLogger from './middleware/logger.js';
import morgan from 'morgan';
import cors from 'cors';
// import cron from 'node-cron'; // 1. node-cron 불러오기
// import { runCrawler } from './crawler/everytime.js'; // 2. 크롤러 함수 불러오기

const server = express();
const port = 4000;

server.use(express.urlencoded({ extended: false }));
server.use(cors());
server.use(express.json());
server.use(myLogger);
server.use(morgan('dev'));

server.use("/api/v1/auth", AuthRouter);
server.use("/api/v1/users", UserRouter);
server.use("/api/v1/posts", PostRouter); 

// ... (기존 API 라우트들) ...

server.get("/health", (req,res)=> {
  res.status(200).json({status:"OK "});
})

server.get("/", (req, res) => {
  res.send("Hello World!");
});
server.post("/text", (req, res) => {  //데이터 받는 곳
  // req
  const text1 = req.body.inText;
  console.log(text1);

  // res
  const sendText = {
  	text : "전송 성공!!!",
  };
  res.send(sendText);
});
server.listen(port, '0.0.0.0', () => { // 0.0.0.0으로 변경된 것 확인
  console.log(`Server listing on port ${port}`);

  // 3. 서버가 성공적으로 시작된 후, 스케줄러를 설정합니다.
  // console.log('크롤러 스케줄러를 설정합니다. (매 30분마다 실행)');
  
  // '*/30 * * * *' : 매 30분마다 0초에 실행
  // 테스트를 위해 1분마다 실행하려면: '*/1 * * * *'
  // cron.schedule('*/30 * * * *', async () => {
  //   console.log(`[${new Date().toISOString()}] 스케줄에 따라 Everytime 크롤링을 시작합니다...`);
  //   try {
  //     await runCrawler();
  //     console.log(`[${new Date().toISOString()}] Everytime 크롤링 작업이 성공적으로 완료되었습니다.`);
  //   } catch (error) {
  //     console.error(`[${new Date().toISOString()}] 크롤링 작업 중 오류 발생:`, error);
  //   }
  // });

  // 4. (선택 사항) 서버가 시작될 때 1회 즉시 실행
  // (async () => {
  //   console.log('서버 시작: 1회성 크롤링을 즉시 실행합니다.');
  //   await runCrawler();
  //   console.log('초기 크롤링 완료.');
  // })();
});
