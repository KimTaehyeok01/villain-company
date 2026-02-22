import "./Settings.css";
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
  UserX,
} from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
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

  const handleSaveName = async () => {
    if (!newName.trim()) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "이름을 입력해 주십시오.",
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
        message: "이름이 수정되었습니다.",
      });
    } catch (error) {
      console.error(error);
      setModal({
        isOpen: true,
        type: "alert",
        message: "수정에 실패했습니다.",
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
        message: "프로필 사진이 변경되었습니다.",
      });
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      setModal({
        isOpen: true,
        type: "alert",
        message: "사진 업로드에 실패했습니다.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (e) => {
    e.stopPropagation();

    if (!window.confirm("기본 프로필로 돌아가시겠습니까?")) return;

    setUploading(true);

    try {
      const storageRef = ref(storage, `profileImages/${userData.uid}`);
      await deleteObject(storageRef).catch((err) =>
        console.log("삭제할 파일 없음:", err),
      );

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: "" });
      }
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { photoURL: "" });

      setUserData({ ...userData, photoURL: "" });

      setModal({
        isOpen: true,
        type: "success",
        message: "기본 프로필로 초기화되었습니다.",
      });
    } catch (error) {
      console.error("사진 삭제 실패:", error);
      setModal({
        isOpen: true,
        type: "alert",
        message: "삭제 중 오류가 발생했습니다.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "정말로 계정을 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.",
      )
    ) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const storageRef = ref(storage, `profileImages/${userData.uid}`);
        await deleteObject(storageRef).catch(() => {});

        const userRef = doc(db, "users", userData.uid);
        await deleteDoc(userRef);

        await deleteUser(user);
      }
    } catch (error) {
      console.error("계정 탈퇴 에러:", error);
      if (error.code === "auth/requires-recent-login") {
        setModal({
          isOpen: true,
          type: "alert",
          message:
            "보안을 위해 로그아웃 후 다시 로그인한 뒤 탈퇴를 진행해 주십시오.",
        });
      } else {
        setModal({
          isOpen: true,
          type: "alert",
          message: "계정 탈퇴 중 오류가 발생했습니다.",
        });
      }
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
            <div
              className="avatar-wrapper"
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
          <p className="desc-text">
            비밀번호 변경은 관리자에게 문의해 주십시오.
          </p>

          <button
            onClick={handleDeleteAccount}
            style={{
              marginTop: "20px",
              padding: "15px 20px",
              backgroundColor: "rgba(255, 68, 68, 0.1)",
              color: "#ff4444",
              border: "1px solid rgba(255, 68, 68, 0.3)",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.2)";
              e.currentTarget.style.border = "1px solid #ff4444";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.1)";
              e.currentTarget.style.border = "1px solid rgba(255, 68, 68, 0.3)";
            }}
          >
            <UserX size={18} /> 계정 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
