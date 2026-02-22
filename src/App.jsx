import React, { useState, useEffect } from "react";
import "./App.css";
import "./Sidebar.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import {
  Home,
  Megaphone,
  MessageSquare,
  Gamepad2,
  Lock,
  CheckCircle,
  Settings,
  User,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

// 페이지 불러오기
import CustomModal from "./components/CustomModal";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FindPasswordPage from "./pages/FindPasswordPage";
import MainHome from "./pages/MainHome";
import Notice from "./pages/Notice";
import SecretBoard from "./pages/SecretBoard";
import PingPongGame from "./pages/PingPongGame";
import SettingsPage from "./pages/SettingsPage";

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

  const isCheckedIn =
    userData?.lastCheckIn === new Date().toISOString().split("T")[0];

  return (
    <Router>
      <Routes>
        {!userData ? (
          /* 로그인하지 않았을 때 접근 가능한 경로들 */
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/find-pw" element={<FindPasswordPage />} />{" "}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* 로그인했을 때 (사이드바 레이아웃 포함) */
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
                    <div className="user-profile-container">
                      {userData.photoURL ? (
                        <img
                          src={userData.photoURL}
                          alt="프로필"
                          className="user-profile-img"
                        />
                      ) : (
                        <div className="user-profile-placeholder">
                          <User size={24} color="#888" />
                        </div>
                      )}
                    </div>

                    <div className="user-details">
                      <div className="user-name">
                        {userData.name}
                        {isCheckedIn && (
                          <span className="checkin-badge">
                            <CheckCircle size={10} /> 활동
                          </span>
                        )}
                      </div>
                      <div className="user-role">
                        {userData.role === "admin" ? "👑 관리자" : "😈 빌런"}
                      </div>
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
                  <Link to="/settings">
                    <Settings /> 환경 설정
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
                    <Route
                      path="/game"
                      element={<PingPongGame userData={userData} />}
                    />
                    <Route
                      path="/settings"
                      element={
                        <SettingsPage
                          userData={userData}
                          setUserData={setUserData}
                        />
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
