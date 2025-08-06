import express from 'express';
import UserRouter  from "./router/user.js";
import mongoose from "mongoose";

const server = express();
const port = 4000

import cors from 'cors';
import bodyParser from 'body-parser';


server.use(bodyParser.urlencoded({ extended: false }));
server.use(cors());
server.use(bodyParser.json());
server.use("/auth", AuthRouter);


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