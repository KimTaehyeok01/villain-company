import React, { useState, useEffect } from "react";
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
  UserPlus,
  LogIn,
  ArrowLeft,
  Trash2,
  Terminal,
  Clock,
  Zap,
} from "lucide-react";
import "./App.css";

// --- Firebase 설정 ---
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
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";

/* =========================================
   [1] 회원가입 페이지
   ========================================= */
const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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
        createdAt: new Date().toISOString(),
      });

      alert(`환영한다, ${name}. 다시 로그인해라.`);
      navigate("/login");
    } catch (error) {
      console.error(error);
      setErrorMsg("가입 실패.");
    }
  };

  return (
    <div className="auth-container fade-in">
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

/* =========================================
   [2] 로그인 페이지
   ========================================= */
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

/* =========================================
   [3] 문의 게시판 (네 코드 그대로 유지)
   ========================================= */
const Notice = ({ userData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const isAdmin = userData?.role === "admin";
  const [notices, setNotices] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addNotice = async () => {
    if (!newTitle || !newContent) return alert("내용을 입력해라.");
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
      alert("문의 접수 완료.");
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      console.error("에러:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 이 문의 내역을 삭제하겠나? 복구는 없다.")) {
      try {
        await deleteDoc(doc(db, "notices", id));
        alert("삭제 완료.");
        setSelectedNotice(null);
      } catch (error) {
        alert("삭제 오류.");
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent) return alert("답변을 입력해라.");
    try {
      const noticeRef = doc(db, "notices", selectedNotice.id);
      await updateDoc(noticeRef, {
        reply: replyContent,
        replyDate: new Date().toISOString().split("T")[0],
        isAnswered: true,
      });
      alert("답변 완료.");
      setReplyContent("");
      setSelectedNotice(null);
    } catch (error) {
      console.error("답변 에러:", error);
    }
  };

  return (
    <div className="fade-in notice-page">
      <div className="page-header">
        <h2>🚨 절대 문의 사항</h2>
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

/* =========================================
   [4] 메인 대시보드 (아지트 - 4대 기능 추가)
   ========================================= */
const MainHome = ({ userData }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [logs, setLogs] = useState([
    `[SYSTEM] 빌런 네트워크 접속 중...`,
    `[SECURITY] 방화벽 4단계 가동 완료.`,
    `[NOTICE] 새로운 지령을 대기하십시오.`,
  ]);

  // 1. D-Day 카운트다운
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

  // 2. 생존 신고 기능
  const handleReport = () => {
    const time = new Date().toLocaleTimeString();
    const newLog = `[INFO] ${userData.name} 빌런 생존 보고 완료. (${time})`;
    setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
    alert("생존 신고가 접수되었다.");
  };

  return (
    <div className="fade-in main-home-wrapper">
      <div className="main-header">
        <h2>Welcome to Villain Co.</h2>
        <p className="status-text">
          <span className="online-dot"></span> 8명의 빌런이 작당 모의 중...
        </p>
      </div>

      <div className="dashboard-grid">
        {/* 카드 1: D-Day */}
        <div className="stat-card timer-card">
          <div className="card-header">
            <Clock size={20} color="#ff4444" />
            <h3>세계 정복 D-DAY</h3>
          </div>
          <div className="timer-display">{timeLeft}</div>
          <p className="timer-desc">성공적인 거사를 위해 역량을 결집하라.</p>
        </div>

        {/* 카드 2: 리소스 현황 (그래프) */}
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

        {/* 카드 3: 실시간 작전 로그 (터미널) */}
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

        {/* 카드 4: 생존 신고 버튼 */}
        <div className="stat-card report-card">
          <div className="card-header">
            <Zap size={20} color="#ffd700" />
            <h3>본부 보고</h3>
          </div>
          <button className="report-btn" onClick={handleReport}>
            🚨 생존 신고 (REPORT)
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

/* =========================================
   [5] App Shell
   ========================================= */
function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        setUserData(
          docSnap.exists()
            ? docSnap.data()
            : {
                uid: user.uid,
                email: user.email,
                name: user.displayName || "이름없음",
                role: "user",
              },
        );
      } else setUserData(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading-screen">시스템 로딩 중...</div>;

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
                <nav className="sidebar">
                  <h1 className="logo">VC</h1>
                  <div className="user-info">
                    <div className="user-name">{userData.name}</div>
                    <div className="user-role">
                      {userData.role === "admin" ? "관리자" : "빌런"}
                    </div>
                  </div>
                  <Link to="/">
                    <Home /> 아지트
                  </Link>
                  <Link to="/notice">
                    <Megaphone /> 절대 문의
                  </Link>
                  <Link to="/board">
                    <MessageSquare /> 비밀 게시판
                  </Link>
                  <a
                    href="#"
                    onClick={() => signOut(auth)}
                    className="logout-btn"
                  >
                    <Lock /> 로그아웃
                  </a>
                </nav>
                <main className="content">
                  <Routes>
                    <Route
                      path="/"
                      element={<MainHome userData={userData} />}
                    />
                    <Route
                      path="/notice"
                      element={<Notice userData={userData} />}
                    />
                    <Route
                      path="/board"
                      element={
                        <div>
                          <h2>💬 비밀 게시판</h2>
                          <p>준비 중...</p>
                        </div>
                      }
                    />
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
