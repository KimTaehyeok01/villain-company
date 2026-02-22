import "./Modal.css";
import React, { useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

const CustomModal = ({
  isOpen,
  type,
  message,
  onConfirm,
  onCancel,
  inputPlaceholder,
}) => {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(inputValue);
    setInputValue("");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setInputValue("");
  };

  return (
    <div className="modal-overlay custom-alert-overlay">
      <div className="custom-modal-box fade-in">
        <div className="modal-icon">
          {type === "confirm" || type === "prompt" || type === "alert" ? (
            <AlertTriangle size={40} color="#a855f7" />
          ) : (
            <CheckCircle size={40} color="#00ff00" />
          )}
        </div>
        <p className="modal-message">{message}</p>

        {type === "prompt" && (
          <input
            type="password"
            className="modal-input"
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}

        <div className="modal-actions">
          {(type === "confirm" || type === "prompt") && (
            <button className="btn-cancel" onClick={handleCancel}>
              취소
            </button>
          )}
          <button className="btn-confirm" onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
