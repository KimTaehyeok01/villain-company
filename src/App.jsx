import React, { useState } from "react";
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
  PlusCircle,
  Send,
} from "lucide-react";
import "./App.css";

// 1. 절대 공지 컴포넌트
const Notice = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null); // 클릭한 공지 저장
  const [isAdmin, setIsAdmin] = useState(false); // 관리자 모드 여부
  const [notices, setNotices] = useState([
    {
      id: 1,
      title: "작전 코드: 네온 쉐도우 발동",
      date: "2026-02-14",
      author: "대장 빌런",
      content:
        "모든 빌런은 각자의 위치에서 대기하라. 네온 쉐도우 작전은 오늘 자정부터 시작된다.",
    },
    {
      id: 2,
      title: "디스코드 보안 채널 변경 안내",
      date: "2026-02-12",
      author: "보안 담당",
      content:
        "기존 음성 채널이 아닌 암호화된 전용 채널로만 접속하라. 링크는 디스코드 공지를 확인하라.",
    },
  ]);

  // 글쓰기 입력 상태
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const filteredNotices = notices.filter((n) => n.title.includes(searchTerm));

  // 공지사항 작성 함수
  const addNotice = () => {
    if (!newTitle || !newContent) return alert("제목과 내용을 모두 입력해라.");
    const newEntry = {
      id: notices.length + 1,
      title: newTitle,
      date: new Date().toISOString().split("T")[0],
      author: "운영진",
      content: newContent,
    };
    setNotices([newEntry, ...notices]);
    setNewTitle("");
    setNewContent("");
    setIsAdmin(false);
  };

  return (
    <div className="fade-in notice-page">
      <div className="page-header">
        <h2>🚨 절대 공지 사항</h2>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} color="#888" />
            <input
              type="text"
              placeholder="비밀 지령 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="admin-btn" onClick={() => setIsAdmin(!isAdmin)}>
            {isAdmin ? "닫기" : "공지 작성"}
          </button>
        </div>
      </div>

      {/* 관리자 공지 작성 폼 */}
      {isAdmin && (
        <div className="admin-form fade-in">
          <input
            type="text"
            placeholder="작전 제목..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="하달할 상세 지령..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button onClick={addNotice}>
            <Send size={16} /> 지령 발령
          </button>
        </div>
      )}

      {/* 하단 공지 리스트 */}
      <div className="notice-list">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="notice-item"
              onClick={() => setSelectedNotice(notice)}
            >
              <div className="notice-info">
                <span className="notice-date">{notice.date}</span>
                <h4 className="notice-title">{notice.title}</h4>
                <span className="notice-author">By. {notice.author}</span>
              </div>
              <ChevronRight size={20} color="#a855f7" className="arrow" />
            </div>
          ))
        ) : (
          <p className="no-result">검색 결과가 없다. 정보를 다시 확인해라.</p>
        )}
      </div>

      {/* 공지 상세 보기 모달 */}
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="notice-date">{selectedNotice.date}</span>
              <button onClick={() => setSelectedNotice(null)}>
                <X size={24} />
              </button>
            </div>
            <h3>{selectedNotice.title}</h3>
            <p className="modal-author">작성자: {selectedNotice.author}</p>
            <div className="modal-body">{selectedNotice.content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 홈 컴포넌트
const MainHome = () => (
  <div className="fade-in">
    <div className="main-header">
      <h2>Welcome to Villain Co.</h2>
      <p className="status-text">
        <span className="online-dot"></span> 8명의 빌런이 현재 작당 모의 중...
      </p>
    </div>

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

function App() {
  return (
    <Router>
      <div className="villain-container">
        <nav className="sidebar">
          <h1 className="logo">VC</h1>
          <Link to="/">
            <Home /> 아지트
          </Link>
          <Link to="/notice">
            <Megaphone /> 절대 공지
          </Link>
          <Link to="/board">
            <MessageSquare /> 비밀 게시판
          </Link>
          <a href="https://discord.gg/spTuDEUV" target="_blank">
            <Users /> 디스코드
          </a>
        </nav>
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
