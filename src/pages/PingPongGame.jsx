import React, { useState, useEffect, useRef } from "react";
import { Trophy, Medal, Flame } from "lucide-react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase"; // 경로 주의

const PingPongGame = ({ userData }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const [ranks, setRanks] = useState([]);

  // 레벨 시스템
  const [level, setLevel] = useState(1);

  // ★ [추가] 카운트다운 상태 (기본 0, 0보다 크면 게임 멈춤)
  const [countDown, setCountDown] = useState(0);

  // 공 초기 속도 (난이도 하향 유지)
  const ballRef = useRef({ x: 300, y: 200, dx: 4, dy: 4, speed: 4 });
  const paddleRef = useRef({ y: 150, aiY: 150 });

  // 랭킹 불러오기
  useEffect(() => {
    const q = query(
      collection(db, "gameScores"),
      orderBy("maxLevel", "desc"),
      limit(10),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRanks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 최고 레벨 갱신
  const updateMaxLevelRecord = async (currentLevel) => {
    try {
      const scoreRef = doc(db, "gameScores", userData.uid);
      const scoreSnap = await getDoc(scoreRef);
      let prevMaxLevel = 0;
      if (scoreSnap.exists()) {
        prevMaxLevel = scoreSnap.data().maxLevel || 0;
      }
      if (currentLevel > prevMaxLevel) {
        await setDoc(
          scoreRef,
          {
            name: userData.name,
            uid: userData.uid,
            maxLevel: currentLevel,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.error("점수 업데이트 실패:", error);
    }
  };

  // ★ [추가] 카운트다운 타이머 로직
  useEffect(() => {
    let timer;
    if (countDown > 0 && gameStarted && !gameOver) {
      timer = setTimeout(() => {
        setCountDown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countDown, gameStarted, gameOver]);

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;

    // 안전장치: 점수 0:0일 때 공 중앙 정렬
    if (score.player === 0 && score.ai === 0) {
      ballRef.current.x = 300;
      ballRef.current.y = 200;
      const startSpeed = 4 + (level - 1) * 0.5;
      ballRef.current.dx = startSpeed * (Math.random() > 0.5 ? 1 : -1);
      ballRef.current.dy = startSpeed * (Math.random() > 0.5 ? 1 : -1);
      ballRef.current.speed = startSpeed;
    }

    const update = () => {
      if (!gameStarted || gameOver) return;

      // 먼저 화면을 그립니다 (멈춰있는 상태라도 보여야 하니까)
      draw(ctx, canvas);

      // ★ [핵심] 카운트다운 중이거나 점수 정산 중이면 물리 엔진 멈춤
      if (countDown > 0 || score.player >= 3 || score.ai >= 3) {
        animationId = requestAnimationFrame(update);
        return;
      }

      // --- 여기서부터 물리 연산 (공 이동, 충돌 등) ---
      let ball = ballRef.current;
      let paddle = paddleRef.current;

      ball.x += ball.dx;
      ball.y += ball.dy;

      // 벽 충돌
      if (ball.y + 10 > canvas.height) {
        ball.y = canvas.height - 10;
        ball.dy *= -1;
      } else if (ball.y - 10 < 0) {
        ball.y = 10;
        ball.dy *= -1;
      }

      let playerPaddleTop = paddle.y;
      let playerPaddleBottom = paddle.y + 100;
      let aiPaddleTop = paddle.aiY;
      let aiPaddleBottom = paddle.aiY + 100;

      // Player 패들 충돌
      if (ball.x - 10 < 20) {
        if (ball.y > playerPaddleTop && ball.y < playerPaddleBottom) {
          ball.dx = Math.abs(ball.dx);
          ball.x = 30;
          const deltaY = ball.y - (paddle.y + 50);
          ball.dy = deltaY * 0.3;
          ball.speed = Math.min(ball.speed + 0.2, 20);
        } else if (ball.x < 0) {
          setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
          resetBall();
        }
      }

      // AI 패들 충돌
      if (ball.x + 10 > canvas.width - 20) {
        if (ball.y > aiPaddleTop && ball.y < aiPaddleBottom) {
          ball.dx = -Math.abs(ball.dx);
          ball.x = canvas.width - 30;
          const deltaY = ball.y - (paddle.aiY + 50);
          ball.dy = deltaY * 0.3;
        } else if (ball.x > canvas.width) {
          setScore((prev) => ({ ...prev, player: prev.player + 1 }));
          resetBall();
        }
      }

      // AI 이동
      let aiSpeed = 3.0 + (level - 1) * 0.5;
      let reactionDelay = Math.max(0, 15 - level * 2);
      let aiTarget = ball.y - 50;

      if (aiTarget < paddle.aiY - reactionDelay) paddle.aiY -= aiSpeed;
      else if (aiTarget > paddle.aiY + reactionDelay) paddle.aiY += aiSpeed;

      if (paddle.aiY < 0) paddle.aiY = 0;
      if (paddle.aiY > canvas.height - 100) paddle.aiY = canvas.height - 100;

      animationId = requestAnimationFrame(update);
    };

    const draw = (ctx, canvas) => {
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      ctx.fillStyle = "#a855f7";
      ctx.fillRect(10, paddleRef.current.y, 10, 100);
      ctx.fillRect(canvas.width - 20, paddleRef.current.aiY, 10, 100);

      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    };

    if (gameStarted) {
      animationId = requestAnimationFrame(update);
    } else {
      draw(ctx, canvas);
    }

    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameOver, score, level, countDown]); // countDown 의존성 추가

  // 승패 및 레벨업 로직
  useEffect(() => {
    if (score.player >= 3) {
      const nextLevel = level + 1;
      updateMaxLevelRecord(nextLevel);

      setLevel(nextLevel);
      setScore({ player: 0, ai: 0 });

      // ★ 레벨업 시 카운트다운 3초 설정
      setCountDown(3);
      resetBall(nextLevel);
    } else if (score.ai >= 3) {
      setGameOver(true);
      updateMaxLevelRecord(level);
      setWinner(`훈련 종료! 최종 도달: LV.${level}`);
    }
  }, [score]);

  const resetBall = (currentLevel = level) => {
    const newSpeed = 4 + (currentLevel - 1) * 0.5;
    ballRef.current = {
      x: 300,
      y: 200,
      dx: newSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: newSpeed * (Math.random() > 0.5 ? 1 : -1),
      speed: newSpeed,
    };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top - 50;
    if (mouseY < 0) mouseY = 0;
    if (mouseY > canvas.height - 100) mouseY = canvas.height - 100;
    paddleRef.current.y = mouseY;
  };

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let touchY = e.touches[0].clientY - rect.top - 50;
    if (touchY < 0) touchY = 0;
    if (touchY > canvas.height - 100) touchY = canvas.height - 100;
    paddleRef.current.y = touchY;
  };

  return (
    <div className="fade-in game-container">
      <div className="page-header">
        <h2>🏓 지옥의 핑퐁 훈련소</h2>
      </div>

      <div className="game-content-wrapper">
        <div className="game-section">
          <div className="score-board">
            <span className="player-score">나: {score.player}</span>
            <div
              style={{
                color: "#ffd700",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              LV.{level}{" "}
              <span style={{ fontSize: "0.8rem", color: "#666" }}>
                (SPEED {(1 + (level - 1) * 0.1).toFixed(1)}x)
              </span>
            </div>
            <span className="ai-score">AI: {score.ai}</span>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="game-canvas"
            />

            {/* ★ 카운트다운 오버레이 (게임 중이고 카운트다운이 0보다 클 때) */}
            {countDown > 0 && !gameOver && (
              <div
                className="game-overlay"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                {/* 레벨업 직후라면 메시지 추가 표시 */}
                {level > 1 && countDown === 3 && (
                  <div
                    style={{
                      color: "#ffd700",
                      fontSize: "2rem",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Flame /> LEVEL UP! <Flame />
                  </div>
                )}
                <h3 style={{ fontSize: "5rem", color: "#fff", margin: 0 }}>
                  {countDown}
                </h3>
                <p style={{ color: "#ccc" }}>준비해라!</p>
              </div>
            )}

            {(!gameStarted || gameOver) && (
              <div className="game-overlay">
                {gameOver ? (
                  <>
                    <h3 style={{ color: "#ff4444" }}>{winner}</h3>
                    <p style={{ color: "#ccc", marginBottom: "20px" }}>
                      당신의 한계는 <b>레벨 {level}</b> 였습니다.
                    </p>
                  </>
                ) : (
                  <h3>준비됐나?</h3>
                )}
                <button
                  onClick={() => {
                    setScore({ player: 0, ai: 0 });
                    setLevel(1);
                    setGameOver(false);
                    setGameStarted(true);
                    setCountDown(3); // ★ 게임 시작 시 카운트다운 3초
                    resetBall(1);
                  }}
                >
                  {gameOver ? "처음부터 재도전" : "훈련 시작"}
                </button>
              </div>
            )}
          </div>
          <p className="game-desc">
            3점 획득 시 레벨 UP! 죽지 않고 어디까지 갈 수 있나?
          </p>
        </div>

        <div className="ranking-section">
          <div className="ranking-board">
            <div className="rank-header">
              <Trophy size={20} color="#ffd700" />
              <h3>전투력 랭킹 (최고 레벨)</h3>
            </div>
            <ul className="rank-list">
              {ranks.length > 0 ? (
                ranks.map((rank, index) => (
                  <li key={rank.id} className="rank-item">
                    <div className="rank-num">
                      {index === 0 && <Medal size={16} color="#ffd700" />}
                      {index === 1 && <Medal size={16} color="#c0c0c0" />}
                      {index === 2 && <Medal size={16} color="#cd7f32" />}
                      {index > 2 && (
                        <span className="num-text">{index + 1}</span>
                      )}
                    </div>
                    <div className="rank-name">{rank.name}</div>
                    <div className="rank-score">LV.{rank.maxLevel || 0}</div>
                  </li>
                ))
              ) : (
                <li className="no-rank">데이터 없음</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PingPongGame;
