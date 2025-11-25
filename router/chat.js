// router/chat.js
import express from 'express';
import { ChatRoomModel } from '../schema/chat.js';
import { MessageModel } from '../schema/message.js';
import { authMiddleware } from '../middleware/auth.js';

const ChatRouter = express.Router();

/**
 * 1. 채팅방 생성 (또는 기존 방 조회)
 * - 게시글 상세 페이지에서 '쪽지하기' 누를 때 호출
 */
ChatRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId, targetUserId } = req.body; // 게시글 ID, 상대방 ID
    const myId = req.user._id;

    // 이미 존재하는 방인지 확인 (나와 상대방이 참여하고, 해당 게시글에 대한 방)
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
      });
    }

    return res.status(200).json(chatRoom);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

/**
 * 2. 내 채팅방 목록 조회
 * - 마이페이지 등에서 호출
 */
ChatRouter.get('/my', authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id;
    // 내가 참여한 모든 방 조회 (최신순 정렬, 게시글 정보와 상대방 정보 포함)
    const chatRooms = await ChatRoomModel.find({ participants: myId })
      .sort({ lastMessageTime: -1 })
      .populate('post', 'title image type status') // 게시글 정보 가져오기
      .populate('participants', 'nickname studentId'); // 참여자 정보 가져오기

    return res.status(200).json(chatRooms);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

/**
 * 3. 특정 채팅방의 메시지 내역 조회
 * - 채팅방 들어갈 때 호출
 */
ChatRouter.get('/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await MessageModel.find({ room: roomId })
      .sort({ createdAt: 1 }) // 과거 -> 최신 순 정렬
      .populate('sender', 'nickname');
      
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

ChatRouter.get("/rooms", isAuth, async (req, res) => {
  try {
    // (1) 내가 참여자(participants)로 포함된 방을 찾음
    // (2) participants 정보를 populate해서 닉네임 등을 가져옴
    // (3) 마지막 메시지 시간 역순(최신순)으로 정렬
    const rooms = await ChatRoomModel.find({ 
      participants: req.user._id 
    })
    .populate('participants', 'nickname email profileImage') // 필요한 필드만 가져오기
    .sort({ lastMessageTime: -1 });

    // (4) 프론트엔드 입맛에 맞게 데이터 가공 (상대방 이름 찾기)
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
        // 필요하다면 게시글 정보도 포함
        // postId: room.post,
        // postTitle: ...
      };
    });

    res.status(200).json(formattedRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "채팅방 목록 로드 실패" });
  }
});

// 2. 특정 채팅방 메시지 내역 가져오기 (GET /api/v1/chats/messages/:roomId)
ChatRouter.get("/messages/:roomId", isAuth, async (req, res) => {
  const { roomId } = req.params;

  try {
    // (1) 해당 방의 메시지 찾기
    // (2) 보낸 사람(sender) 정보를 populate (닉네임 필요)
    // (3) 작성 시간(createdAt) 오름차순 (과거 -> 현재)
    const messages = await MessageModel.find({ room: roomId })
      .populate('sender', 'nickname') 
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "메시지 로드 실패" });
  }
});

export default ChatRouter;