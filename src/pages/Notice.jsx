import React, { useState, useEffect } from "react";
import { Search, ChevronRight, X, Send, Trash2 } from "lucide-react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import CustomModal from "../components/CustomModal";

const Notice = ({ userData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const isAdmin = userData?.role === "admin";
  const [notices, setNotices] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addNotice = async () => {
    if (!newTitle || !newContent) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "내용을 입력해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    try {
      await addDoc(collection(db, "notices"), {
        title: newTitle,
        content: newContent,
        author: userData.name,
        uid: userData.uid,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        reply: "",
        isAnswered: false,
      });
      setModal({
        isOpen: true,
        type: "success",
        message: "문의 접수 완료.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      console.error("에러:", error);
    }
  };

  const handleDelete = (id) => {
    setModal({
      isOpen: true,
      type: "confirm",
      message: "정말 이 문의 내역을 삭제하겠나? 복구는 없다.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "notices", id));
          setModal({
            isOpen: true,
            type: "success",
            message: "삭제 완료.",
            onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
          });
          setSelectedNotice(null);
        } catch (error) {
          setModal({
            isOpen: true,
            type: "alert",
            message: "삭제 오류.",
            onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  const handleReplySubmit = async () => {
    if (!replyContent) {
      setModal({
        isOpen: true,
        type: "alert",
        message: "답변을 입력해라.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    try {
      const noticeRef = doc(db, "notices", selectedNotice.id);
      await updateDoc(noticeRef, {
        reply: replyContent,
        replyDate: new Date().toISOString().split("T")[0],
        isAnswered: true,
      });
      setModal({
        isOpen: true,
        type: "success",
        message: "답변 완료.",
        onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      setReplyContent("");
      setSelectedNotice(null);
    } catch (error) {
      console.error("답변 에러:", error);
    }
  };

  return (
    <div className="fade-in notice-page">
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onConfirm={(val) => {
          if (modal.onConfirm) modal.onConfirm(val);
          setModal({ ...modal, isOpen: false });
        }}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />

      <div className="page-header">
        <h2>🚨 문의 사항</h2>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} color="#888" />
            <input
              type="text"
              placeholder="문의 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin ? (
            <span className="admin-badge">👑 관리자</span>
          ) : (
            <span className="user-badge">👤 일반 모드</span>
          )}
        </div>
      </div>
      {!isAdmin && (
        <div className="admin-form fade-in">
          <input
            type="text"
            placeholder="문의 제목..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="운영진에게 보낼 내용..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button onClick={addNotice}>
            <Send size={16} /> 문의 전송
          </button>
        </div>
      )}
      <div className="notice-list">
        {notices
          .filter((n) => n.title.includes(searchTerm))
          .map((notice) => (
            <div
              key={notice.id}
              className="notice-item"
              onClick={() => {
                setSelectedNotice(notice);
                setReplyContent("");
              }}
            >
              <div className="notice-info">
                <span className="notice-date">{notice.date}</span>
                <h4 className="notice-title">
                  <span className="text-truncate">{notice.title}</span>{" "}
                  {notice.isAnswered ? (
                    <span className="status-badge status-done">답변완료</span>
                  ) : (
                    <span className="status-badge status-wait">처리중</span>
                  )}
                </h4>
                <span className="notice-author">By. {notice.author}</span>
              </div>
              <ChevronRight size={20} color="#a855f7" />
            </div>
          ))}
      </div>
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="notice-date">{selectedNotice.date}</span>
              <div style={{ display: "flex", gap: "10px" }}>
                {isAdmin && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedNotice.id)}
                  >
                    <Trash2 size={16} /> 삭제
                  </button>
                )}
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedNotice(null)}
                >
                  닫기 <X size={16} />
                </button>
              </div>
            </div>
            <h3>{selectedNotice.title}</h3>
            <p className="modal-author">작성자: {selectedNotice.author}</p>
            <div className="modal-body">{selectedNotice.content}</div>
            <div className="reply-section">
              <h4 style={{ color: "#a855f7", marginBottom: "15px" }}>
                {isAdmin ? "💬 관리자 답변 작성" : "💬 운영진 답변"}
              </h4>
              {selectedNotice.isAnswered ? (
                <div
                  style={{
                    background: "#222",
                    padding: "20px",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    lineHeight: "1.6",
                    marginTop: "10px",
                  }}
                >
                  {selectedNotice.reply}
                  <div
                    style={{
                      marginTop: "15px",
                      fontSize: "0.8rem",
                      color: "#666",
                      textAlign: "right",
                    }}
                  >
                    답변일: {selectedNotice.replyDate}
                  </div>
                </div>
              ) : isAdmin ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답변 입력..."
                    className="admin-textarea"
                  />
                  <button
                    onClick={handleReplySubmit}
                    className="admin-submit-btn"
                  >
                    답변 등록
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    color: "#666",
                    fontStyle: "italic",
                    marginTop: "10px",
                  }}
                >
                  아직 답변이 없다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notice;
