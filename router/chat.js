// router/chat.js
import express from 'express';
import { ChatRoomModel } from '../schema/chat.js';
import { MessageModel } from '../schema/message.js';
import { authMiddleware } from '../middleware/auth.js'; 

const router = express.Router(); // 변수명을 router로 통일

/**
 * 1. 채팅방 생성 (또는 기존 방 조회)
 * - 게시글 상세 페이지에서 '쪽지하기' 누를 때 호출
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId, targetUserId } = req.body; 
    const myId = req.user._id;

    // 이미 존재하는 방인지 확인
    let chatRoom = await ChatRoomModel.findOne({
      post: postId,
      participants: { $all: [myId, targetUserId] }
    });

    // 없으면 새로 생성
    if (!chatRoom) {
      chatRoom = await ChatRoomModel.create({
        post: postId,
        participants: [myId, targetUserId],
        lastMessage: "대화가 시작되었습니다.",
        lastMessageTime: new Date(), // 시간 초기화 추가
      });
    }

    return res.status(200).json(chatRoom);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

/**
 * 2. 내 채팅방 목록 조회 (GET /api/v1/chats/rooms)
 * - 프론트엔드 MyPage.tsx에서 호출하는 경로에 맞춤
 */
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    // (1) 내가 참여자(participants)로 포함된 방을 찾음
    const rooms = await ChatRoomModel.find({ 
      participants: req.user._id 
    })
    .populate('participants', 'nickname email profileImage') // 참여자 정보 가져오기
    .populate('post', 'title') // 게시글 제목 가져오기 (필요시)
    .sort({ lastMessageTime: -1 });

    // (2) 프론트엔드 입맛에 맞게 데이터 가공 (상대방 이름 찾기)
    const formattedRooms = rooms.map(room => {
      // 참여자 목록 중 '나'가 아닌 사람이 파트너
      const partner = room.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );

      return {
        _id: room._id,
        partnerName: partner ? partner.nickname : "알 수 없는 사용자",
        lastMessage: room.lastMessage,
        lastMessageTime: room.lastMessageTime,
        postTitle: room.post ? room.post.title : null // 게시글 제목 추가
      };
    });

    res.status(200).json(formattedRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "채팅방 목록 로드 실패" });
  }
});

/**
 * 3. 특정 채팅방 메시지 내역 조회 (GET /api/v1/chats/messages/:roomId)
 */
router.get("/messages/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await MessageModel.find({ room: roomId })
      .populate('sender', 'nickname') 
      .sort({ createdAt: 1 }); // 과거 -> 최신 순

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "메시지 로드 실패" });
  }
});

export default router;