import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  Megaphone,
  MessageSquare,
  Activity,
  Target,
  ShieldAlert,
  Search,
  ChevronRight,
  X,
  Send,
  Lock,
  Unlock,
  UserPlus,
  LogIn,
  ArrowLeft,
  Trash2,
  Terminal,
  Clock,
  Zap,
  CheckCircle,
  Plus,
  Users,
  AlertCircle,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";
import "./App.css";

import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";

const CustomModal = ({
  isOpen,
  type,
  message,
  onConfirm,
  onCancel,
  inputPlaceholder,
}) => {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(inputValue);
    setInputValue("");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setInputValue("");
  };

  return (
    <div className="modal-overlay custom-alert-overlay">
      <div className="custom-modal-box fade-in">
        <div className="modal-icon">
          {type === "confirm" || type === "prompt" || type === "alert" ? (
            <AlertTriangle size={40} color="#a855f7" />
          ) : (
            <CheckCircle size={40} color="#00ff00" />
          )}
        </div>
        <p className="modal-message">{message}</p>

        {type === "prompt" && (
          <input
            type="password"
            className="modal-input"
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}

        <div className="modal-actions">
          {(type === "confirm" || type === "prompt") && (
            <button className="btn-cancel" onClick={handleCancel}>
              취소
            </button>
          )}
          <button className="btn-confirm" onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 서로 다르다.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("이름(활동명)을 입력해라.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const role = email === "admin@villain.com" ? "admin" : "user";
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        lastCheckIn: "",
        createdAt: new Date().toISOString(),
      });

      setModal({
        isOpen: true,
        type: "success",
        message: `환영한다, ${name}. 다시 로그인해라.`,
        onConfirm: () => navigate("/login"),
      });
    } catch (error) {
      console.error(error);
      setErrorMsg("가입 실패.");
    }
  };

  return (
    <div className="auth-container fade-in">
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm();
          setModal({ ...modal, isOpen: false });
        }}
      />
      <div className="auth-box">
        <h1 className="logo">
          VC <span style={{ fontSize: "1rem", color: "#666" }}>JOIN</span>
        </h1>
        <p className="auth-desc">신규 빌런 등록 절차</p>
        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="이름 (활동명)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="비밀번호 (6자리 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                borderColor:
                  confirmPassword && password !== confirmPassword
                    ? "#ff4444"
                    : "",
              }}
            />
          </div>
          {errorMsg && <p className="error-text">{errorMsg}</p>}
          <button type="submit" className="auth-btn">
            <UserPlus size={18} /> 가입 완료
          </button>
        </form>
        <div className="auth-footer">
          <span onClick={() => navigate("/login")} className="link-text">
            <ArrowLeft size={14} /> 로그인 화면으로 복귀
          </span>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMsg("이메일 혹은 비밀번호가 틀렸다.");
    }
  };
  return (
    <div className="auth-container fade-in">
      <div className="auth-box">
        <h1 className="logo">VC</h1>
        <p className="auth-desc">빌런 컴퍼니 접속</p>
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="이메일 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errorMsg && <p className="error-text">{errorMsg}</p>}
          <button type="submit" className="auth-btn login-btn-color">
            <LogIn size={18} /> 로그인
          </button>
        </form>
        <div className="auth-footer">
          계정이 없나?{" "}
          <span onClick={() => navigate("/signup")} className="link-text">
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
};

const Notice = ({ userData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const isAdmin = userData?.role === "admin";
  const [notices, setNotices] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addNotice = async () => {
    if (!newTitle || !newContent) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "내용을 입력해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    try {
      await addDoc(collection(db, "notices"), {
        title: newTitle,
        content: newContent,
        author: userData.name,
        uid: userData.uid,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        reply: "",
        isAnswered: false,
      });
      setModal({
        isOpen: true,
        type: "success",
        message: "문의 접수 완료.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      console.error("에러:", error);
    }
  };

  const handleDelete = (id) => {
    setModal({
      isOpen: true,
      type: "confirm",
      message: "정말 이 문의 내역을 삭제하겠나? 복구는 없다.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "notices", id));
          setModal({
            isOpen: true,
            type: "success",
            message: "삭제 완료.",
            onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
          });
          setSelectedNotice(null);
        } catch (error) {
          setModal({
            isOpen: true,
            type: "alert",
            message: "삭제 오류.",
            onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  const handleReplySubmit = async () => {
    if (!replyContent) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "답변을 입력해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    try {
      const noticeRef = doc(db, "notices", selectedNotice.id);
      await updateDoc(noticeRef, {
        reply: replyContent,
        replyDate: new Date().toISOString().split("T")[0],
        isAnswered: true,
      });
      setModal({
        isOpen: true,
        type: "success",
        message: "답변 완료.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      setReplyContent("");
      setSelectedNotice(null);
    } catch (error) {
      console.error("답변 에러:", error);
    }
  };

  return (
    <div className="fade-in notice-page">
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onConfirm={(val) => {
          if (modal.onConfirm) modal.onConfirm(val);
          setModal({ ...modal, isOpen: false });
        }}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />

      <div className="page-header">
        <h2>🚨 문의 사항</h2>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} color="#888" />
            <input
              type="text"
              placeholder="문의 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin ? (
            <span className="admin-badge">👑 관리자</span>
          ) : (
            <span className="user-badge">👤 일반 모드</span>
          )}
        </div>
      </div>
      {!isAdmin && (
        <div className="admin-form fade-in">
          <input
            type="text"
            placeholder="문의 제목..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="운영진에게 보낼 내용..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button onClick={addNotice}>
            <Send size={16} /> 문의 전송
          </button>
        </div>
      )}
      <div className="notice-list">
        {notices
          .filter((n) => n.title.includes(searchTerm))
          .map((notice) => (
            <div
              key={notice.id}
              className="notice-item"
              onClick={() => {
                setSelectedNotice(notice);
                setReplyContent("");
              }}
            >
              <div className="notice-info">
                <span className="notice-date">{notice.date}</span>
                <h4 className="notice-title">
                  <span className="text-truncate">{notice.title}</span>{" "}
                  {notice.isAnswered ? (
                    <span className="status-badge status-done">답변완료</span>
                  ) : (
                    <span className="status-badge status-wait">처리중</span>
                  )}
                </h4>
                <span className="notice-author">By. {notice.author}</span>
              </div>
              <ChevronRight size={20} color="#a855f7" />
            </div>
          ))}
      </div>
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="notice-date">{selectedNotice.date}</span>
              <div style={{ display: "flex", gap: "10px" }}>
                {isAdmin && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedNotice.id)}
                  >
                    <Trash2 size={16} /> 삭제
                  </button>
                )}
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedNotice(null)}
                >
                  닫기 <X size={16} />
                </button>
              </div>
            </div>
            <h3>{selectedNotice.title}</h3>
            <p className="modal-author">작성자: {selectedNotice.author}</p>
            <div className="modal-body">{selectedNotice.content}</div>
            <div className="reply-section">
              <h4 style={{ color: "#a855f7", marginBottom: "15px" }}>
                {isAdmin ? "💬 관리자 답변 작성" : "💬 운영진 답변"}
              </h4>
              {selectedNotice.isAnswered ? (
                <div
                  style={{
                    background: "#222",
                    padding: "20px",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    lineHeight: "1.6",
                    marginTop: "10px",
                  }}
                >
                  {selectedNotice.reply}
                  <div
                    style={{
                      marginTop: "15px",
                      fontSize: "0.8rem",
                      color: "#666",
                      textAlign: "right",
                    }}
                  >
                    답변일: {selectedNotice.replyDate}
                  </div>
                </div>
              ) : isAdmin ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답변 입력..."
                    className="admin-textarea"
                  />
                  <button
                    onClick={handleReplySubmit}
                    className="admin-submit-btn"
                  >
                    답변 등록
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    color: "#666",
                    fontStyle: "italic",
                    marginTop: "10px",
                  }}
                >
                  아직 답변이 없다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MainHome = ({ userData, setUserData }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [logs, setLogs] = useState([
    `[SYSTEM] 빌런 네트워크 접속 중...`,
    `[SECURITY] 방화벽 4단계 가동 완료.`,
    `[NOTICE] 새로운 지령을 대기하십시오.`,
  ]);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const isCheckedIn = userData?.lastCheckIn === todayStr;

  useEffect(() => {
    const targetDate = new Date("2026-12-31T23:59:59");
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${days}일 ${hours}시 ${mins}분 ${secs}초`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReport = async () => {
    if (isCheckedIn) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "오늘은 이미 생존 인증을 마쳤다. 내일 다시 보고해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { lastCheckIn: todayStr });
      setUserData((prev) => ({ ...prev, lastCheckIn: todayStr }));
      const time = new Date().toLocaleTimeString();
      const newLog = `[INFO] ${userData.name} 빌런 생존 보고 완료. (${time})`;
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
      setModal({
        isOpen: true,
        type: "success",
        message: "생존 인증 완료. 활동 마크가 부여되었다.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "통신 에러. 다시 시도해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  return (
    <div className="fade-in main-home-wrapper">
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm();
          setModal({ ...modal, isOpen: false });
        }}
      />
      <div className="main-header">
        <h2>Welcome to Villain Co.</h2>
        <p className="status-text">
          <span className="online-dot"></span> 8명의 빌런이 작당 모의 중...
        </p>
      </div>
      <div className="dashboard-grid">
        <div className="stat-card timer-card">
          <div className="card-header">
            <Clock size={20} color="#ff4444" />
            <h3>세계 정복 D-DAY</h3>
          </div>
          <div className="timer-display">{timeLeft}</div>
          <p className="timer-desc">성공적인 거사를 위해 역량을 결집하라.</p>
        </div>
        <div className="stat-card">
          <div className="card-header">
            <Activity size={20} color="#a855f7" />
            <h3>핵심 리소스 현황</h3>
          </div>
          <div className="resource-item">
            <div className="res-label">
              <span>비자금 확보</span>
              <span>85%</span>
            </div>
            <div className="res-bar">
              <div
                className="res-progress pulse"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
          <div className="resource-item">
            <div className="res-label">
              <span>시민 공포 지수</span>
              <span>62%</span>
            </div>
            <div className="res-bar">
              <div
                className="res-progress orange"
                style={{ width: "62%" }}
              ></div>
            </div>
          </div>
        </div>
        <div className="stat-card terminal-card">
          <div className="card-header">
            <Terminal size={20} color="#00ff00" />
            <h3>실시간 작전 로그</h3>
          </div>
          <div className="terminal-body">
            {logs.map((log, i) => (
              <div key={i} className="log-line">
                {log}
              </div>
            ))}
          </div>
        </div>
        <div className="stat-card report-card">
          <div className="card-header">
            <Zap size={20} color="#ffd700" />
            <h3>본부 보고</h3>
          </div>
          <button
            className={`report-btn ${isCheckedIn ? "done" : ""}`}
            onClick={handleReport}
            disabled={isCheckedIn}
          >
            {isCheckedIn ? "✔️ 생존 인증 완료" : "🚨 생존 신고 (REPORT)"}
          </button>
          <div className="security-status-info">
            <ShieldAlert size={16} color="#ff4444" />{" "}
            <span>보안 등급: LEVEL 4 (위험)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const PingPongGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");

  const ballRef = useRef({ x: 300, y: 200, dx: 5, dy: 5, speed: 7 });
  const paddleRef = useRef({ y: 150, aiY: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;

    const update = () => {
      if (!gameStarted || gameOver) return;

      let ball = ballRef.current;
      let paddle = paddleRef.current;

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y + 10 > canvas.height || ball.y - 10 < 0) ball.dy *= -1;

      let playerPaddleTop = paddle.y;
      let playerPaddleBottom = paddle.y + 100;
      let aiPaddleTop = paddle.aiY;
      let aiPaddleBottom = paddle.aiY + 100;

      if (ball.x - 10 < 20) {
        if (ball.y > playerPaddleTop && ball.y < playerPaddleBottom) {
          ball.dx *= -1;
          const deltaY = ball.y - (paddle.y + 50);
          ball.dy = deltaY * 0.3;
        } else if (ball.x < 0) {
          setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
          resetBall();
        }
      }

      if (ball.x + 10 > canvas.width - 20) {
        if (ball.y > aiPaddleTop && ball.y < aiPaddleBottom) {
          ball.dx *= -1;
          const deltaY = ball.y - (paddle.aiY + 50);
          ball.dy = deltaY * 0.3;
        } else if (ball.x > canvas.width) {
          setScore((prev) => ({ ...prev, player: prev.player + 1 }));
          resetBall();
        }
      }

      let aiTarget = ball.y - 50;
      if (aiTarget < paddle.aiY) paddle.aiY -= 6;
      else if (aiTarget > paddle.aiY) paddle.aiY += 6;

      if (paddle.aiY < 0) paddle.aiY = 0;
      if (paddle.aiY > canvas.height - 100) paddle.aiY = canvas.height - 100;

      draw(ctx, canvas);
      animationId = requestAnimationFrame(update);
    };

    const draw = (ctx, canvas) => {
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      ctx.fillStyle = "#a855f7";
      ctx.fillRect(10, paddleRef.current.y, 10, 100);
      ctx.fillRect(canvas.width - 20, paddleRef.current.aiY, 10, 100);

      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    };

    if (gameStarted) {
      animationId = requestAnimationFrame(update);
    } else {
      draw(ctx, canvas);
    }

    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameOver, score]);

  useEffect(() => {
    if (score.player >= 3) {
      setGameOver(true);
      setWinner("빌런 승리!");
    } else if (score.ai >= 3) {
      setGameOver(true);
      setWinner("AI 승리... 훈련 더 해라.");
    }
  }, [score]);

  const resetBall = () => {
    ballRef.current = {
      x: 300,
      y: 200,
      dx: 5 * (Math.random() > 0.5 ? 1 : -1),
      dy: 5 * (Math.random() > 0.5 ? 1 : -1),
      speed: 7,
    };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top - 50;
    if (mouseY < 0) mouseY = 0;
    if (mouseY > canvas.height - 100) mouseY = canvas.height - 100;
    paddleRef.current.y = mouseY;
  };

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let touchY = e.touches[0].clientY - rect.top - 50;
    if (touchY < 0) touchY = 0;
    if (touchY > canvas.height - 100) touchY = canvas.height - 100;
    paddleRef.current.y = touchY;
  };

  return (
    <div className="fade-in game-container">
      <div className="page-header">
        <h2>🏓 지옥의 핑퐁 훈련소</h2>
      </div>

      <div className="score-board">
        <span className="player-score">나: {score.player}</span>
        <span className="ai-score">AI: {score.ai}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="game-canvas"
        />
        {(!gameStarted || gameOver) && (
          <div className="game-overlay">
            {gameOver ? <h3>{winner}</h3> : <h3>준비됐나?</h3>}
            <button
              onClick={() => {
                setScore({ player: 0, ai: 0 });
                setGameOver(false);
                setGameStarted(true);
                resetBall();
              }}
            >
              {gameOver ? "재도전" : "훈련 시작"}
            </button>
          </div>
        )}
      </div>
      <p className="game-desc">PC: 마우스 이동 / Mobile: 터치 이동</p>
    </div>
  );
};

function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData({
            uid: user.uid,
            email: user.email,
            name: user.displayName || "이름없음",
            role: "user",
            lastCheckIn: "",
          });
        }
      } else setUserData(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setModal({
      isOpen: true,
      type: "confirm",
      message: "로그아웃 하시겠습니까?",
      onConfirm: () => {
        signOut(auth);
        setModal({ ...modal, isOpen: false });
      },
    });
  };

  if (loading) return <div className="loading-screen">시스템 로딩 중...</div>;

  const todayStr = new Date().toISOString().split("T")[0];
  const isCheckedIn = userData?.lastCheckIn === todayStr;

  return (
    <Router>
      <Routes>
        {!userData ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route
            path="*"
            element={
              <div className="villain-container">
                <CustomModal
                  isOpen={modal.isOpen}
                  type={modal.type}
                  message={modal.message}
                  onConfirm={modal.onConfirm}
                  onCancel={() => setModal({ ...modal, isOpen: false })}
                />

                <nav className="sidebar">
                  <h1 className="logo">VC</h1>
                  <div className="user-info">
                    <div className="user-name">
                      {userData.name}
                      {isCheckedIn && (
                        <span className="checkin-badge">
                          <CheckCircle size={12} /> 활동 중
                        </span>
                      )}
                    </div>
                    <div className="user-role">
                      {userData.role === "admin" ? "관리자" : "빌런"}
                    </div>
                  </div>
                  <Link to="/">
                    <Home /> 아지트
                  </Link>
                  <Link to="/notice">
                    <Megaphone /> 문의 사항
                  </Link>
                  <Link to="/board">
                    <MessageSquare /> 비밀 게시판
                  </Link>
                  <Link to="/game">
                    <Gamepad2 /> 지옥 훈련소
                  </Link>
                  <a
                    href="#"
                    onClick={handleLogoutClick}
                    className="logout-btn"
                    style={{ color: "#ff4444" }}
                  >
                    <Lock color="#ff4444" /> 로그아웃
                  </a>
                </nav>
                <main className="content">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <MainHome
                          userData={userData}
                          setUserData={setUserData}
                        />
                      }
                    />
                    <Route
                      path="/notice"
                      element={<Notice userData={userData} />}
                    />
                    <Route
                      path="/board"
                      element={<SecretBoard userData={userData} />}
                    />
                    <Route path="/game" element={<PingPongGame />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            }
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
