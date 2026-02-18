import React, { useState, useRef } from "react";
import { User, Mail, Shield, Save, Edit2, Key } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import CustomModal from "../components/CustomModal";

const SettingsPage = ({ userData, setUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userData.name);
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [uploading, setUploading] = useState(false); // 업로드 상태 관리

  const fileInputRef = useRef(null);

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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "이미지 파일만 가능하다.",
      });
      return;
    }

    setUploading(true);

    try {
      // 1. 스토리지에 업로드 (경로: profileImages/UID)
      const storageRef = ref(storage, `profileImages/${userData.uid}`);
      await uploadBytes(storageRef, file);

      // 2. 다운로드 URL 가져오기
      const photoURL = await getDownloadURL(storageRef);

      // 3. Auth 및 Firestore 업데이트
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { photoURL });

      // 4. 화면 즉시 반영
      setUserData({ ...userData, photoURL });

      setModal({
        isOpen: true,
        type: "success",
        message: "프로필 사진이 변경되었다.",
      });
    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, type: "alert", message: "사진 업로드 실패." });
    } finally {
      setUploading(false);
      // input 초기화 (같은 파일 다시 선택 가능하게)
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImageChange}
      />

      <div className="page-header">
        <h2>⚙️ 환경 설정</h2>
      </div>

      <div className="settings-content">
        {/* 프로필 카드 섹션 */}
        <div className="profile-card">
          <div className="profile-header">
            <div
              className="avatar-circle"
              // 클릭 가능하도록 커서 변경, 내부 이미지 넘침 방지
              style={{
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}
              onClick={() => !uploading && fileInputRef.current.click()}
            >
              {/* 업로드 중이면 글씨 표시, 아니면 사진 또는 아이콘 표시 */}
              {uploading ? (
                <span style={{ fontSize: "0.8rem" }}>업로드..</span>
              ) : userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={40} color="#fff" />
              )}
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
