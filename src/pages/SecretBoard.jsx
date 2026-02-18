import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  ChevronRight,
  Send,
  Lock,
  Unlock,
  Plus,
  Users,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import CustomModal from "../components/CustomModal";

const SecretBoard = ({ userData }) => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newMaxPeople, setNewMaxPeople] = useState(10);
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const scrollRef = useRef();

  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
    onConfirm: null,
    inputPlaceholder: "",
  });

  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    const q = query(
      collection(db, `chatRooms/${currentRoom.id}/messages`),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
      setTimeout(
        () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    });
    return () => unsubscribe();
  }, [currentRoom]);

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "방 이름을 입력해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    if (newIsPrivate && !newRoomPassword) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "비밀번호를 설정해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    await addDoc(collection(db, "chatRooms"), {
      name: newRoomName,
      maxParticipants: Number(newMaxPeople),
      isPrivate: newIsPrivate,
      password: newRoomPassword,
      createdBy: userData.uid,
      createdAt: new Date().toISOString(),
    });
    setNewRoomName("");
    setNewMaxPeople(10);
    setNewIsPrivate(false);
    setNewRoomPassword("");
    setIsCreatingRoom(false);
  };

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setModal({
        isOpen: true,
        type: "prompt",
        message: "🔒 비밀 작전 방이다. 암구호(비밀번호)를 대라.",
        inputPlaceholder: "암구호 입력",
        onConfirm: (inputPwd) => {
          if (inputPwd === room.password) {
            setCurrentRoom(room);
            setModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            setModal({
              isOpen: true,
              type: "alert",
              message: "암구호가 틀렸다. 접근 거부.",
              onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
          }
        },
      });
    } else {
      setCurrentRoom(room);
    }
  };

  const handleDeleteRoom = (e, room) => {
    e.stopPropagation();

    if (room.isPrivate) {
      setModal({
        isOpen: true,
        type: "prompt",
        message: "🔒 이 방은 잠겨있다. 삭제하려면 비밀번호를 입력해라.",
        inputPlaceholder: "비밀번호 입력",
        onConfirm: async (inputPwd) => {
          if (inputPwd === room.password) {
            try {
              await deleteDoc(doc(db, "chatRooms", room.id));
              setModal({
                isOpen: true,
                type: "success",
                message: "방이 제거되었다.",
                onConfirm: () =>
                  setModal((prev) => ({ ...prev, isOpen: false })),
              });
            } catch (error) {
              setModal({
                isOpen: true,
                type: "alert",
                message: "삭제 중 오류 발생.",
                onConfirm: () =>
                  setModal((prev) => ({ ...prev, isOpen: false })),
              });
            }
          } else {
            setModal({
              isOpen: true,
              type: "alert",
              message: "비밀번호가 틀렸다. 삭제 불가.",
              onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
          }
        },
      });
    } else {
      setModal({
        isOpen: true,
        type: "confirm",
        message: "이 작전 방을 폭파하겠나? 복구 불가능하다.",
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, "chatRooms", room.id));
            setModal({
              isOpen: true,
              type: "success",
              message: "방이 제거되었다.",
              onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
          } catch (error) {
            setModal({
              isOpen: true,
              type: "alert",
              message: "삭제 중 오류 발생.",
              onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
          }
        },
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, `chatRooms/${currentRoom.id}/messages`), {
      text: newMessage,
      sender: userData.name,
      uid: userData.uid,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  if (!currentRoom) {
    return (
      <div className="fade-in secret-board">
        <CustomModal
          isOpen={modal.isOpen}
          type={modal.type}
          message={modal.message}
          inputPlaceholder={modal.inputPlaceholder}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal({ ...modal, isOpen: false })}
        />
        <div className="page-header">
          <h2>💬 비밀 접선 장소</h2>
          <button
            className="create-room-btn"
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
          >
            <Plus size={18} /> {isCreatingRoom ? "취소" : "방 만들기"}
          </button>
        </div>
        {isCreatingRoom && (
          <div className="room-creator fade-in">
            <div className="creator-row">
              <input
                type="text"
                placeholder="작전명 (방 이름)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="input-name"
              />
              <input
                type="number"
                placeholder="정원"
                value={newMaxPeople}
                onChange={(e) => setNewMaxPeople(e.target.value)}
                min="2"
                max="100"
                className="input-num"
              />
            </div>
            <div className="creator-row">
              <div className="toggle-wrapper">
                <div className="toggle-info">
                  {newIsPrivate ? (
                    <Lock size={18} color="#ff4444" />
                  ) : (
                    <Unlock size={18} color="#888" />
                  )}
                  <span>비공개 설정</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {newIsPrivate && (
                <input
                  type="password"
                  placeholder="비밀번호 설정"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  className="input-pwd"
                />
              )}
            </div>
            <button onClick={createRoom} className="create-confirm-btn">
              개설하기
            </button>
          </div>
        )}
        <div className="room-list">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div
                key={room.id}
                className="room-item"
                onClick={() => handleJoinRoom(room)}
              >
                <div className="room-icon">
                  {room.isPrivate ? (
                    <Lock size={24} color="#ff4444" />
                  ) : (
                    <MessageSquare size={24} color="#a855f7" />
                  )}
                </div>
                <div className="room-info">
                  <h4>{room.name}</h4>
                  <div className="room-meta">
                    <span>
                      <Users size={12} /> 정원: {room.maxParticipants}명
                    </span>
                    {room.isPrivate && (
                      <span className="private-tag">비공개</span>
                    )}
                  </div>
                </div>
                {(room.createdBy === userData.uid ||
                  userData.role === "admin") && (
                  <button
                    className="room-delete-btn"
                    onClick={(e) => handleDeleteRoom(e, room)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <ChevronRight size={20} color="#666" />
              </div>
            ))
          ) : (
            <p className="no-result">개설된 작전 방이 없다.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in chat-room">
      <div className="chat-header">
        <button onClick={() => setCurrentRoom(null)}>
          <ArrowLeft size={20} />
        </button>
        <h3>
          {currentRoom.name}{" "}
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            ({currentRoom.maxParticipants}명 제한)
          </span>
        </h3>
        <span className="live-badge">LIVE</span>
      </div>
      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble ${msg.uid === userData.uid ? "my-msg" : "other-msg"}`}
          >
            <div className="chat-sender">{msg.sender}</div>
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>
      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="메시지 입력..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default SecretBoard;
