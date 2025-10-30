import express from 'express';
// import UserRouter  from "./router/user.js";
import mongoose from "mongoose";
import AuthRouter from "./router/auth.js";
import UserRouter from "./router/user.js";
import PostRouter from "./router/post.js"; // PostRouter 추가
import 'dotenv/config'; // .env 내용을 읽기 위해 import
import "./db.js";      // DB 연결 코드를 실행하기 위해 import
import myLogger from './middleware/logger.js';
import morgan from 'morgan';
const server = express();
const port = 4000

import cors from 'cors';
// import bodyParser from 'body-parser';


server.use(express.urlencoded({ extended: false }));
server.use(cors());
server.use(express.json());
server.use(myLogger);
server.use(morgan('dev'));

server.use("/api/v1/auth", AuthRouter);
server.use("/api/v1/users", UserRouter);
server.use("/api/v1/posts", PostRouter); // PostRouter 연결 추가
// server.use("/user", UserRouter);

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

server.listen(port, () => {
  console.log(`Example server listening at http://localhost:${port}`);
});