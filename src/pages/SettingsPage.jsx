import React, { useState, useRef } from "react";
import {
  User,
  Mail,
  Shield,
  Save,
  Edit2,
  Key,
  Camera,
  Trash2,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "../firebase";
import CustomModal from "../components/CustomModal";

const SettingsPage = ({ userData, setUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userData.name);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });

  const fileInputRef = useRef(null);

  // 이름 수정 저장
  const handleSaveName = async () => {
    if (!newName.trim()) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "이름을 입력하십시오.",
      });
      return;
    }

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName });
      }
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { name: newName });
      setUserData({ ...userData, name: newName });
      setIsEditing(false);
      setModal({
        isOpen: true,
        type: "success",
        message: "이름이 수정 되었습니다.",
      });
    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, type: "alert", message: "수정 실패." });
    }
  };

  // 프로필 사진 변경 (업로드)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "이미지 파일만 가능합니다.",
      });
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(storage, `profileImages/${userData.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: photoURL });
      }
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { photoURL: photoURL });

      setUserData({ ...userData, photoURL: photoURL });

      setModal({
        isOpen: true,
        type: "success",
        message: "프로필 사진 변경 완료.",
      });
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      setModal({ isOpen: true, type: "alert", message: "사진 업로드 실패." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (e) => {
    e.stopPropagation(); // 부모 클릭 이벤트(파일 선택창 열기) 방지

    if (!window.confirm("기본 프로필로 돌아가겠습니까?")) return;

    setUploading(true);

    try {
      // 1. 스토리지에서 파일 삭제 (파일이 없을 수도 있으니 에러 무시)
      const storageRef = ref(storage, `profileImages/${userData.uid}`);
      await deleteObject(storageRef).catch((err) =>
        console.log("삭제할 파일 없음:", err),
      );

      // 2. Auth 및 Firestore에서 photoURL 초기화 (빈 문자열)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: "" });
      }
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { photoURL: "" });

      // 3. 상태 업데이트 (즉시 반영)
      setUserData({ ...userData, photoURL: "" });

      setModal({
        isOpen: true,
        type: "success",
        message: "기본 프로필로 초기화 되었습니다.",
      });
    } catch (error) {
      console.error("사진 삭제 실패:", error);
      setModal({ isOpen: true, type: "alert", message: "삭제 중 오류 발생." });
    } finally {
      setUploading(false);
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
        <div className="profile-card">
          <div className="profile-header">
            {/* 프로필 사진 영역 */}
            <div
              className="avatar-wrapper"
              // 기본 클릭: 파일 업로드 창 열기
              onClick={() => !uploading && fileInputRef.current.click()}
            >
              {userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-placeholder">
                  <User size={40} color="#fff" />
                </div>
              )}

              {/* 호버 시 나타나는 오버레이 */}
              <div className="avatar-overlay">
                {uploading ? (
                  <div className="spinner-small"></div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    {/* 카메라 아이콘 (업로드) */}
                    <Camera size={24} color="#fff" />

                    {userData.photoURL && (
                      <div
                        onClick={handleDeleteImage}
                        title="기본 이미지로 변경"
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: "5px",
                          borderRadius: "50%",
                          background: "rgba(255, 68, 68, 0.2)",
                        }}
                      >
                        <Trash2 size={20} color="#ff4444" />
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                    if (isEditing) handleSaveName();
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

        <div className="settings-section">
          <h3>🔐 계정 보안</h3>
          <p className="desc-text">비밀번호 변경은 관리자에게 문의하십시오.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
