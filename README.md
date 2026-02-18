# 😈 Villain Company (빌런 컴퍼니)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-9.0-orange?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-4.0-purple?logo=vite)

> **"세계 정복을 꿈꾸는 빌런들을 위한 시크릿 아지트 & 관리 대시보드"**
>
> React와 Firebase를 활용하여 구축한 **실시간 커뮤니티 및 유저 관리 웹 애플리케이션**입니다.  
> 사용자 인증부터 실시간 데이터 동기화, 미니 게임, 프로필 관리까지 모던 웹의 필수 기능을 구현했습니다.

---

## 📸 Screen Shots

|                                            메인 대시보드                                             |                                         비밀 게시판                                          |                                     지옥 훈련소 (게임)                                     |
| :--------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: |
| <img src="https://placehold.co/600x400/1a1a1d/FFF?text=Dashboard+View" alt="Dashboard" width="100%"> | <img src="https://placehold.co/600x400/1a1a1d/FFF?text=Secret+Chat" alt="Chat" width="100%"> | <img src="https://placehold.co/600x400/1a1a1d/FFF?text=Mini+Game" alt="Game" width="100%"> |

---

## 🛠️ Tech Stack (기술 스택)

### Frontend

- **Library:** React (Vite)
- **Routing:** React Router DOM v6
- **Styling:** Pure CSS3 (Responsive Design / Flexbox & Grid)
- **Icons:** Lucide React

### Backend (Serverless)

- **Platform:** Google Firebase
- **Authentication:** Firebase Auth (Email/Password Login, Signup)
- **Database:** Cloud Firestore (NoSQL, Real-time Updates)
- **Storage:** Firebase Storage (Image Uploads)

---

## 🚀 Key Features (주요 기능)

### 1. 🔐 완벽한 인증 시스템 (Authentication)

- 회원가입 및 로그인/로그아웃 구현.
- **Firebase Auth**를 연동하여 보안성 높은 유저 세션 관리.
- 로그인 상태에 따른 `Private Router` 보호 (비로그인 시 접근 차단).

### 2. 📊 빌런 대시보드 (Main Dashboard)

- **D-DAY 카운터:** 특정 목표일까지 남은 시간을 실시간으로 계산하여 표시.
- **생존 신고 시스템:** 하루 한 번 출석 체크 기능 (Firestore 연동).
- 실시간 로그 및 리소스 현황 시각화 UI.

### 3. 💬 시크릿 보드 (Real-time Chat)

- **비밀방 생성:** 방 제목, 인원수 제한, 비밀번호 설정 가능.
- **실시간 채팅:** Firestore의 `onSnapshot`을 활용하여 새로고침 없는 대화 구현.
- 메시지 타임스탬프 및 내 메시지/상대 메시지 구분 UI.

### 4. 🏓 지옥의 핑퐁 훈련소 (Mini Game)

- **HTML5 Canvas API**를 활용한 핑퐁 게임 자체 구현.
- **레벨 시스템:** 승리 시 난이도 상승, 패배 시 게임 오버.
- **랭킹 시스템:** 유저별 최고 레벨 기록을 DB에 저장하고 실시간 순위표 제공.

### 5. ⚙️ 마이 페이지 (Profile Management)

- **프로필 이미지 관리:** Firebase Storage를 이용한 이미지 업로드, 변경, 삭제 기능.
- **정보 수정:** 닉네임 변경 및 사이드바/게시판 실시간 반영.
- **반응형 UI:** 모바일 및 데스크탑 환경에 최적화된 레이아웃 제공.

---

## 📂 Project Structure (폴더 구조)

```bash
src/
├── assets/          # 이미지 및 정적 파일
├── components/      # 재사용 가능한 컴포넌트 (Modal 등)
├── pages/           # 페이지 단위 컴포넌트
│   ├── MainHome.jsx     # 메인 대시보드
│   ├── SecretBoard.jsx  # 채팅방 리스트 및 채팅창
│   ├── PingPongGame.jsx # 핑퐁 게임 로직
│   ├── SettingsPage.jsx # 프로필 설정
│   └── LoginPage.jsx    # 로그인/회원가입
├── App.css          # 전체 공통 및 페이지별 스타일
├── App.jsx          # 라우팅 및 전역 상태 관리
├── firebase.js      # Firebase 설정 및 초기화
└── main.jsx         # Entry Point
```
