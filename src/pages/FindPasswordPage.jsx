import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const FindPasswordPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleFind = async (e) => {
    e.preventDefault();
    setMsg("조회 중...");

    try {
      // 1. Firestore에서 이름과 이메일이 일치하는 유저가 있는지 확인
      const q = query(
        collection(db, "users"),
        where("name", "==", name),
        where("email", "==", email),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMsg("일치하는 요원 정보가 없습니다.");
        return;
      }

      // 2. 정보가 일치하면 재설정 이메일 발송
      await sendPasswordResetEmail(auth, email);
      setMsg("재설정 메일을 보냈습니다. 메일함을 확인하십시오.");
    } catch (error) {
      setMsg("오류가 발생했습니다. 다시 시도하십시오.");
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-box">
        <h1 className="logo">VC</h1>
        <p className="auth-desc">비밀번호 재설정 요청</p>
        <form onSubmit={handleFind} className="auth-form">
          <input
            type="text"
            placeholder="이름 입력"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="가입한 이메일(아이디) 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p
            className="error-text"
            style={{
              color: msg.includes("보냈습니다") ? "#00ff00" : "#ff4444",
            }}
          >
            {msg}
          </p>
          <button type="submit" className="auth-btn">
            비밀번호 찾기 메일 발송
          </button>
        </form>
        <div className="auth-footer">
          기억이 나셨나요?{" "}
          <span onClick={() => navigate("/login")} className="link-text">
            로그인으로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
};

export default FindPasswordPage;
