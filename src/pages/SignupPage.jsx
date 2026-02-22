import "./Auth.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import CustomModal from "../components/CustomModal";

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
      setErrorMsg("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("이름(활동명)을 입력하십시오.");
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
        message: `환영합니다, ${name}. 다시 로그인하십시오.`,
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

export default SignupPage;
