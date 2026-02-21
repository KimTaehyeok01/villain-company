import React, { useState, useEffect } from "react";
import {
  Clock,
  Activity,
  Terminal,
  Zap,
  ShieldAlert,
  Users,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CustomModal from "../components/CustomModal";
import MemberList from "../components/MemberList";

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
  const [showMembers, setShowMembers] = useState(false);

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
        message: "오늘은 이미 생존 인증을 마쳤습니다. 내일 다시 보고하십시오.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    try {
      const userRef = doc(db, "users", userData.uid);
      const currentCount = userData?.attendanceCount || 0;
      const newCount = currentCount + 1;

      // Firestore에 출석 정보 업데이트
      await updateDoc(userRef, {
        lastCheckIn: todayStr,
        attendanceCount: newCount,
      });

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        lastCheckIn: todayStr,
        attendanceCount: newCount,
      }));

      const time = new Date().toLocaleTimeString();
      const newLog = `[INFO] ${userData.name} 생존 보고 완료 (${time})`;
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);

      setModal({
        isOpen: true,
        type: "success",
        message: "출석 체크가 완료되었습니다.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "통신 에러. 다시 시도하십시오.",
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
        <div className="header-titles">
          <h2>Welcome to Villain Co.</h2>
          <p className="status-text">
            <span className="online-dot"></span> 8명의 빌런이 작당 모의 중...
          </p>
        </div>

        <button
          className={`discord-member-btn ${showMembers ? "active" : ""}`}
          onClick={() => setShowMembers(!showMembers)}
          title="멤버 목록 표시하기"
        >
          <Users size={24} color={showMembers ? "#fff" : "#888"} />
        </button>
      </div>

      <div className="main-content-wrapper">
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
        {showMembers && (
          <div className="member-list-container fade-in">
            <MemberList />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainHome;
