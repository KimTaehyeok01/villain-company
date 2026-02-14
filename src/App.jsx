import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Home,
  Megaphone,
  MessageSquare,
  Users,
  Activity,
  Target,
  ShieldAlert,
  Search,
  ChevronRight,
  X,
  Send,
} from "lucide-react";
import "./App.css";

// --- Firebase Configuration ---
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * [Notice Component]
 * - 일반 사용자: 문의글 작성 (Create) 및 조회 (Read)
 * - 관리자: 문의글에 대한 답변 작성 (Update)
 * - 특징: Firestore 실시간 리스너(onSnapshot)를 사용하여 데이터 동기화
 */
const Notice = () => {
  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null); // 모달 활성화 여부
  const [isAdmin, setIsAdmin] = useState(false); // 관리자/사용자 모드 토글

  const [notices, setNotices] = useState([]); // 게시글 리스트

  // 입력 폼 상태 (작성용)
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 답변 폼 상태 (관리자용)
  const [replyContent, setReplyContent] = useState("");

  // --- Effects ---
  // 컴포넌트 마운트 시 Firestore 'notices' 컬렉션 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedNotices = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(loadedNotices);
    });

    return () => unsubscribe(); // 클린업: 언마운트 시 구독 해제
  }, []);

  // 검색어 필터링
  const filteredNotices = notices.filter((n) => n.title.includes(searchTerm));

  // --- Handlers ---

  // 사용자: 신규 문의 등록
  const addNotice = async () => {
    if (!newTitle || !newContent) return alert("제목과 내용을 모두 입력해라.");
    try {
      await addDoc(collection(db, "notices"), {
        title: newTitle,
        content: newContent,
        author: "익명 빌런",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
        reply: "", // 초기 답변은 비어있음
        isAnswered: false,
      });
      alert("문의 접수 완료. 대기해라.");
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      console.error("에러:", error);
    }
  };

  // 관리자: 답변 등록 (기존 문서 Update)
  const handleReplySubmit = async () => {
    if (!replyContent) return alert("답변 내용을 입력해라.");
    if (!selectedNotice) return;

    try {
      const noticeRef = doc(db, "notices", selectedNotice.id);
      await updateDoc(noticeRef, {
        reply: replyContent,
        replyDate: new Date().toISOString().split("T")[0],
        isAnswered: true,
      });

      alert("답변 등록 완료.");
      setReplyContent("");
      setSelectedNotice(null); // 답변 완료 후 모달 닫기
    } catch (error) {
      console.error("답변 에러:", error);
      alert("답변 등록 실패.");
    }
  };

  return (
    <div className="fade-in notice-page">
      {/* 1. Header Section: 타이틀 및 검색/모드 전환 */}
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
          <button
            className="admin-btn"
            onClick={() => setIsAdmin(!isAdmin)}
            style={{ borderColor: isAdmin ? "#a855f7" : "#333" }}
          >
            {isAdmin ? "관리자 모드 ON" : "사용자 모드"}
          </button>
        </div>
      </div>

      {/* 2. Form Section: 관리자가 아닐 때만 노출 */}
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

      {/* 3. List Section: 문의글 목록 */}
      <div className="notice-list">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="notice-item"
              onClick={() => {
                setSelectedNotice(notice);
                setReplyContent(""); // 모달 열 때 입력창 초기화
              }}
            >
              <div className="notice-info">
                <span className="notice-date">{notice.date}</span>
                <h4 className="notice-title">
                  {/* 말줄임표 처리된 제목 */}
                  <span className="text-truncate">{notice.title}</span>
                  {/* 상태 뱃지 */}
                  {notice.isAnswered ? (
                    <span className="status-badge status-done">답변완료</span>
                  ) : (
                    <span className="status-badge status-wait">처리중</span>
                  )}
                </h4>
                <span className="notice-author">By. {notice.author}</span>
              </div>
              <ChevronRight size={20} color="#a855f7" className="arrow" />
            </div>
          ))
        ) : (
          <p className="no-result">데이터 수신 중이거나 문의가 없다.</p>
        )}
      </div>

      {/* 4. Modal Section: 상세 보기 및 답변 작성 */}
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 (닫기 버튼 포함) */}
            <div className="modal-header">
              <span className="notice-date">{selectedNotice.date}</span>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedNotice(null)}
              >
                닫기 <X size={16} />
              </button>
            </div>

            {/* 문의 내용 영역 */}
            <h3>{selectedNotice.title}</h3>
            <p className="modal-author">작성자: {selectedNotice.author}</p>
            <div
              className="modal-body"
              style={{
                minHeight: "100px",
                borderBottom: "1px solid #333",
                paddingBottom: "20px",
                marginBottom: "20px",
              }}
            >
              {selectedNotice.content}
            </div>

            {/* 답변 영역 (조건부 렌더링) */}
            <div className="reply-section">
              <h4 style={{ color: "#a855f7", marginBottom: "10px" }}>
                {isAdmin ? "💬 관리자 답변 작성" : "💬 운영진 답변"}
              </h4>

              {/* Case A: 답변이 완료된 경우 */}
              {selectedNotice.isAnswered ? (
                <div
                  style={{
                    background: "#222",
                    padding: "15px",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedNotice.reply}
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "0.8rem",
                      color: "#666",
                      textAlign: "right",
                    }}
                  >
                    Answered at {selectedNotice.replyDate}
                  </div>
                </div>
              ) : isAdmin ? (
                /* Case B: 답변이 없고 관리자인 경우 (입력 폼) */
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
                    placeholder="여기에 답변을 입력해라..."
                    style={{
                      width: "100%",
                      height: "100px",
                      background: "#111",
                      border: "1px solid #333",
                      color: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      resize: "none",
                    }}
                  />
                  <button
                    onClick={handleReplySubmit}
                    style={{
                      background: "#a855f7",
                      color: "white",
                      border: "none",
                      padding: "10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    답변 등록
                  </button>
                </div>
              ) : (
                /* Case C: 답변이 없고 사용자인 경우 (대기 메시지) */
                <div style={{ color: "#666", fontStyle: "italic" }}>
                  아직 운영진이 확인 중이다. 잠시만 기다려라...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard Component ---
const MainHome = () => (
  <div className="fade-in">
    <div className="main-header">
      <h2>Welcome to Villain Co.</h2>
      <p className="status-text">
        <span className="online-dot"></span> 8명의 빌런이 현재 작당 모의 중...
      </p>
    </div>
    {/* Dashboard Widgets */}
    <div className="card-grid">
      <div className="stat-card">
        <div className="card-header">
          <Activity size={20} color="#a855f7" />
          <h3>진행 중인 작전</h3>
        </div>
        <div className="operation-item">
          <p>현상 수배 정보 갱신</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: "70%" }}></div>
          </div>
        </div>
        <div className="operation-item">
          <p>서버 침투 보안 무력화</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: "30%" }}></div>
          </div>
        </div>
      </div>
      <div className="stat-card">
        <div className="card-header">
          <Target size={20} color="#a855f7" />
          <h3>제거 대상</h3>
        </div>
        <ul className="target-list">
          <li>
            <span>LHS</span> <span className="priority high">HIGH</span>
          </li>
          <li>
            <span>BUG-ERROR</span> <span className="priority">LOW</span>
          </li>
        </ul>
      </div>
      <div className="stat-card">
        <div className="card-header">
          <ShieldAlert size={20} color="#ff4444" />
          <h3>보안 등급</h3>
        </div>
        <div className="security-status">
          <h4 style={{ color: "#ff4444" }}>LEVEL 4 : 위험</h4>
          <p>외부 침입 시도 감지됨</p>
        </div>
      </div>
    </div>
  </div>
);

// --- App Shell (Router & Layout) ---
function App() {
  return (
    <Router>
      <div className="villain-container">
        {/* Sidebar Navigation */}
        <nav className="sidebar">
          <h1 className="logo">VC</h1>
          <Link to="/">
            <Home /> 아지트
          </Link>
          <Link to="/notice">
            <Megaphone /> 절대 문의
          </Link>
          <Link to="/board">
            <MessageSquare /> 비밀 게시판
          </Link>
          <a href="https://discord.gg/spTuDEUV" target="_blank">
            <Users /> 디스코드
          </a>
        </nav>
        {/* Main Content Area */}
        <main className="content">
          <Routes>
            <Route path="/" element={<MainHome />} />
            <Route path="/notice" element={<Notice />} />
            <Route
              path="/board"
              element={
                <div>
                  <h2>💬 비밀 게시판</h2>
                  <p>준비 중...</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
