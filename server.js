// server.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http'; // 1. http 모듈 추가
import { Server } from 'socket.io';  // 2. socket.io 추가

import AuthRouter from "./router/auth.js";
import UserRouter from "./router/user.js";
import PostRouter from "./router/post.js";
import ChatRouter from "./router/chat.js"; // 3. ChatRouter 추가

import "./db.js";
import morgan from 'morgan';
import cors from 'cors';

// 스키마 import (경로가 정확한지 확인하세요)
import { MessageModel } from './schema/message.js';
import { ChatRoomModel } from './schema/chat.js';

// **중요: 변수명을 통일해야 합니다. 위에서는 const server = express() 라고 했습니다.**
const server = express(); 
const port = 4000;

// 4. HTTP 서버 생성 및 Socket.io 연결
// **수정 1: createServer(app) -> createServer(server)**
// (app이라는 변수는 선언된 적이 없습니다. 위에서 만든 server 변수를 넣어야 합니다.)
const httpServer = createServer(server);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // 프론트엔드 주소 허용
    methods: ["GET", "POST"]
  }
});

// 미들웨어 설정
server.use(express.urlencoded({ extended: false }));

// **수정 2: CORS 설정 정리**
// (중복된 CORS 설정을 하나로 합치고 가장 위에서 적용하는 것이 좋습니다.)
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'], // 허용할 도메인 목록
};
server.use(cors(corsOptions)); 

server.use(express.json());
server.use(morgan('dev'));

// 라우터 등록
server.use("/api/v1/auth", AuthRouter);
server.use("/api/v1/users", UserRouter);
server.use("/api/v1/posts", PostRouter);
// **수정 3: app.use -> server.use**
server.use("/api/v1/chats", ChatRouter); 

// 6. 소켓 통신 로직 (실시간 채팅)
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // (1) 방 입장
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User with ID: ${socket.id} joined room: ${roomId}`);
  });

  // (2) 메시지 전송
  socket.on("send_message", async (data) => {
    // data = { roomId, senderId, content }
    console.log("메시지 받음:", data);

    try {
        // 1. DB에 메시지 저장
        const newMessage = await MessageModel.create({
          room: data.roomId,
          sender: data.senderId,
          content: data.content
        });
    
        // 2. 채팅방 정보 업데이트 (마지막 메시지, 시간)
        await ChatRoomModel.findByIdAndUpdate(data.roomId, {
          lastMessage: data.content,
          lastMessageTime: new Date()
        });
    
        // 3. 실시간 전송 (sender 정보 populate 포함)
        const populatedMessage = await newMessage.populate('sender', 'nickname');
        io.to(data.roomId).emit("receive_message", populatedMessage);

    } catch (error) {
        console.error("메시지 저장 중 오류:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// 기본 라우트
server.get("/health", (req,res)=> {
  res.status(200).json({status:"OK "});
})

server.get("/", (req, res) => {
  res.send("Hello World!");
});

server.post("/text", (req, res) => {
  const text1 = req.body.inText;
  console.log(text1);
  const sendText = { text : "전송 성공!!!", };
  res.send(sendText);
});

// **수정 4: 서버 실행 코드 중복 제거**
// (기존 코드의 맨 아래에 있던 server.listen은 삭제해야 합니다. httpServer.listen만 남겨두세요.)
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server listing on port ${port}`);
  
  // 크롤러 등 스케줄러 로직이 필요하다면 여기에 작성
});