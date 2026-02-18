import React, { useState, useEffect, useRef } from "react";
import { Trophy, Medal } from "lucide-react";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  increment,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

const PingPongGame = ({ userData }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const [ranks, setRanks] = useState([]);

  const ballRef = useRef({ x: 300, y: 200, dx: 5, dy: 5, speed: 7 });
  const paddleRef = useRef({ y: 150, aiY: 150 });

  useEffect(() => {
    const q = query(
      collection(db, "gameScores"),
      orderBy("wins", "desc"),
      limit(10),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRanks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateRankScore = async () => {
    try {
      const scoreRef = doc(db, "gameScores", userData.uid);
      await setDoc(
        scoreRef,
        {
          name: userData.name,
          uid: userData.uid,
          wins: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      console.log("점수 업데이트 완료");
    } catch (error) {
      console.error("점수 업데이트 실패:", error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;

    const update = () => {
      if (!gameStarted || gameOver) return;

      let ball = ballRef.current;
      let paddle = paddleRef.current;

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y + 10 > canvas.height || ball.y - 10 < 0) ball.dy *= -1;

      let playerPaddleTop = paddle.y;
      let playerPaddleBottom = paddle.y + 100;
      let aiPaddleTop = paddle.aiY;
      let aiPaddleBottom = paddle.aiY + 100;

      if (ball.x - 10 < 20) {
        if (ball.y > playerPaddleTop && ball.y < playerPaddleBottom) {
          ball.dx *= -1;
          const deltaY = ball.y - (paddle.y + 50);
          ball.dy = deltaY * 0.3;
        } else if (ball.x < 0) {
          setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
          resetBall();
        }
      }

      if (ball.x + 10 > canvas.width - 20) {
        if (ball.y > aiPaddleTop && ball.y < aiPaddleBottom) {
          ball.dx *= -1;
          const deltaY = ball.y - (paddle.aiY + 50);
          ball.dy = deltaY * 0.3;
        } else if (ball.x > canvas.width) {
          setScore((prev) => ({ ...prev, player: prev.player + 1 }));
          resetBall();
        }
      }

      let aiTarget = ball.y - 50;
      if (aiTarget < paddle.aiY) paddle.aiY -= 6;
      else if (aiTarget > paddle.aiY) paddle.aiY += 6;

      if (paddle.aiY < 0) paddle.aiY = 0;
      if (paddle.aiY > canvas.height - 100) paddle.aiY = canvas.height - 100;

      draw(ctx, canvas);
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
  }, [gameStarted, gameOver, score]);

  useEffect(() => {
    if (score.player >= 3) {
      setGameOver(true);
      setWinner("빌런 승리!");
      updateRankScore();
    } else if (score.ai >= 3) {
      setGameOver(true);
      setWinner("AI 승리... 훈련 더 해라.");
    }
  }, [score]);

  const resetBall = () => {
    ballRef.current = {
      x: 300,
      y: 200,
      dx: 5 * (Math.random() > 0.5 ? 1 : -1),
      dy: 5 * (Math.random() > 0.5 ? 1 : -1),
      speed: 7,
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
            {(!gameStarted || gameOver) && (
              <div className="game-overlay">
                {gameOver ? <h3>{winner}</h3> : <h3>준비됐나?</h3>}
                <button
                  onClick={() => {
                    setScore({ player: 0, ai: 0 });
                    setGameOver(false);
                    setGameStarted(true);
                    resetBall();
                  }}
                >
                  {gameOver ? "재도전" : "훈련 시작"}
                </button>
              </div>
            )}
          </div>
          <p className="game-desc">PC: 마우스 이동 / Mobile: 터치 이동</p>
        </div>

        <div className="ranking-section">
          <div className="ranking-board">
            <div className="rank-header">
              <Trophy size={20} color="#ffd700" />
              <h3>전투력 랭킹 (승리 수)</h3>
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
                    <div className="rank-score">{rank.wins}승</div>
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
