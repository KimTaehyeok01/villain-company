import React, { useState } from "react";
import { User, Mail, Shield, Save, Edit2, Key } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import CustomModal from "../components/CustomModal";

const SettingsPage = ({ userData, setUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userData.name);
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });

  const handleSave = async () => {
    if (!newName.trim()) {
      setModal({ isOpen: true, type: "alert", message: "이름을 입력해라." });
      return;
    }

    try {
      // 1. Firebase Auth 프로필 업데이트 (로그인 정보)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName });
      }

      // 2. Firestore DB 업데이트 (데이터베이스)
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { name: newName });

      // 3. 앱 전체 상태(userData) 즉시 반영 (새로고침 없이 바뀌게)
      setUserData({ ...userData, name: newName });

      setIsEditing(false);
      setModal({
        isOpen: true,
        type: "success",
        message: "프로필이 수정되었다.",
      });
    } catch (error) {
      console.error(error);
      setModal({
        isOpen: true,
        type: "alert",
        message: "수정 실패. 다시 시도해라.",
      });
    }
  };

  return (
    <div className="fade-in settings-container">
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onConfirm={() => setModal({ ...modal, isOpen: false })}
      />

      <div className="page-header">
        <h2>⚙️ 환경 설정</h2>
      </div>

      <div className="settings-content">
        {/* 프로필 카드 섹션 */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-circle">
              <User size={40} color="#fff" />
            </div>
            <div className="profile-summary">
              <h3>{userData.name}</h3>
              <span className="role-badge">
                {userData.role === "admin" ? "👑 관리자" : "😈 빌런"}
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <label>
                <Mail size={16} /> 이메일
              </label>
              <div className="value-box readonly">{userData.email}</div>
            </div>

            <div className="detail-item">
              <label>
                <Shield size={16} /> 활동명 (이름)
              </label>
              <div className={`value-box ${isEditing ? "editing" : ""}`}>
                {isEditing ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span>{userData.name}</span>
                )}
                <button
                  className="edit-icon-btn"
                  onClick={() => {
                    if (isEditing) handleSave();
                    else setIsEditing(true);
                  }}
                >
                  {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>
                <Key size={16} /> 고유 코드 (UID)
              </label>
              <div className="value-box readonly uid-text">{userData.uid}</div>
            </div>
          </div>
        </div>

        {/* 추가 설정 섹션 (나중에 기능 추가 가능) */}
        <div className="settings-section">
          <h3>🔐 계정 보안</h3>
          <p className="desc-text">비밀번호 변경은 관리자에게 문의해라.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
