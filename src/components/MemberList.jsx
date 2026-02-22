import "./MemberList.css";
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { User, Users } from "lucide-react";

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const memberData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(memberData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const formatShortDate = (dateVal) => {
    if (!dateVal) return "";
    try {
      let d;
      if (typeof dateVal.toDate === "function") {
        d = dateVal.toDate();
      } else {
        d = new Date(dateVal);
      }

      if (isNaN(d.getTime())) return "";

      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      return `${yy}.${mm}.${dd}`;
    } catch (error) {
      return "";
    }
  };

  if (loading) {
    return <div className="loading-text">멤버 목록 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error-text">멤버 목록 불러오기 실패: {error}</div>;
  }

  return (
    <div className="member-list-wrapper">
      <div className="member-list-header">
        <Users size={20} color="#a855f7" />
        <h3>작전 멤버 목록 ({members.length}명)</h3>
      </div>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.id} className="member-item">
            <div
              className="member-profile"
              style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
            >
              <div className="member-avatar">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <User size={24} color="#fff" />
                )}
              </div>
              <div
                className="member-info"
                style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
              >
                <span
                  className="member-name"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                  }}
                >
                  {member.name || "알수없음"}
                </span>
                <span
                  className="member-email"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                  }}
                >
                  {member.email || "이메일없음"}
                </span>
              </div>
            </div>

            {member.createdAt && formatShortDate(member.createdAt) && (
              <span
                className="member-joined-date"
                style={{
                  flexShrink: 0,
                  marginLeft: "15px",
                  whiteSpace: "nowrap",
                  color: "#888",
                  fontSize: "0.75rem",
                }}
              >
                {formatShortDate(member.createdAt)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberList;
