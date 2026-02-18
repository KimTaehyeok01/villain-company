import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

import CustomModal from "./components/CustomModal";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MainHome from "./pages/MainHome";
import Notice from "./pages/Notice";
import SecretBoard from "./pages/SecretBoard";
import PingPongGame from "./pages/PingPongGame";

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
                    <Route
                      path="/game"
                      element={<PingPongGame userData={userData} />}
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
