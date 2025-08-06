import mongoose from "mongoose";
import 'dotenv/config'; // .env 파일의 내용을 process.env로 가져옵니다.

mongoose.connect(process.env.MONGO_URL);

const db = mongoose.connection;

const handleOpen = () => console.log("✅ DB에 성공적으로 연결되었습니다.");
const handleError = (error) => console.log("❌ DB 연결에 실패했습니다:", error);

db.on("error", handleError);
db.once("open", handleOpen);