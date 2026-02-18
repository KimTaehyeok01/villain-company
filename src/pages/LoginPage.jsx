import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

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

export default LoginPage;
