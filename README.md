# web26-2Ryuk

## 🛫 팀명

> **2Ryuk** <br />
> 
> 운명처럼 모인 4명의 개발자가 **26(이륙)** 이라는 이름 아래, <br /> 
> 함께 더 높은 곳으로 비상하겠다는 의미를 담았습니다.

<br />

## 🧑‍🤝‍🧑 팀원 구성

| <img src="https://avatars.githubusercontent.com/u/61217259?v=4" width="120" style="border-radius: 50%;" /> | <img src="https://avatars.githubusercontent.com/u/102642679?v=4" width="120" style="border-radius: 50%;" /> | <img src="https://avatars.githubusercontent.com/u/50689050?v=4" width="120" style="border-radius: 50%;" /> | <img src="https://avatars.githubusercontent.com/u/50124461?v=4" width="120" style="border-radius: 50%;" /> |
| :--------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------: |
| **[J060\_김윤영](https://github.com/KimYunYeong)** | **[J167\_윤수연](https://github.com/seha01130)** | **[J288\_허우솔](https://github.com/dnthf652)** | **[J289\_현승준](https://github.com/seungjoonH)** |

<br />

## 🎤 프로젝트 소개

<img width="200px" src="https://github.com/user-attachments/assets/4cf8ac8a-a12d-424a-b354-529bc0fbeaa5" alt="ddorok" />

> 누구나 가볍게 참여하고 자연스럽게 대화를 이어갈 수 있도록 돕는, <br />부담 없는 음성 기반 소셜 서비스

<br />

##  🔍 문제 정의

온라인 모임에서 발생하는 '어색한 침묵'과 '복잡한 준비 과정'을 해결하고자 합니다.
1. **낮은 접근성:** 설치와 설명이 필요한 복잡한 서비스는 즉흥적인 모임에 부적합합니다.
2. **대화 소재 고갈:** 단순 음성 채팅은 금방 지루해지고, 분위기를 띄울 장치가 부족합니다.
3. **참여 불균형:** 숙련도가 필요한 게임은 특정 인원만 즐기는 소외감을 유발합니다.

**물방울톡**은 가벼운 게임을 통해, 대화의 흐름을 자연스럽게 만듭니다.

<br />

## 🌟 주요 기능

### 1. 간편한 소셜 로그인

&nbsp;&nbsp; 복잡한 회원가입 절차 없이, 사용하던 GitHub나 Google 계정으로 클릭 한 번에 바로 시작할 수 있습니다.

<img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/1df5566c-4389-4e15-9446-4a6a554b0164" />

<br clear="left" />
<br />
<br />

### 2. 텍스트 채팅
#### &nbsp;&nbsp; 2-1. 전체 채팅

&nbsp;&nbsp; 대화방에 들어가지 않아도, 서비스에 접속한 모든 사람들과 소통할 수 있는 열린 공간입니다.

<img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/e809ca6f-3958-4f07-b6a2-fa7d9f278500" />

<br clear="left" />
<br />

- 문제 해결: [최근 채팅 내역 중복 노출 문제](https://rapid-bubble-113.notion.site/2ee207f2334180e6b251c2184f9395a9?source=copy_link)

<br />

####  &nbsp;&nbsp; 2-2. 대화방 채팅
  
&nbsp;&nbsp; 관심 있는 주제의 방에 들어가 새로운 사람들과 인연을 맺거나, 친구들과 우리만의 아지트를 만들어보세요.
 
<img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/4b024449-7897-478a-ba3a-2020b48773b3" />

<br clear="left" />
<br />

- 결정 사항: [채팅방 HTTP, WebScoket 책임 정의](https://rapid-bubble-113.notion.site/HTTP-WebSocket-2fb207f233418027940ec5f6e464d2ef?source=copy_link)

<br />
<br />

#### 3. 음성 채팅

&nbsp;&nbsp; 실시간 텍스트 채팅은 물론, WebRTC 기반의 선명한 음성 채팅으로도 소통할 수 있습니다.

<br />

- 결정 사항: [Redis Mediasoup 데이터 구조 전략](https://rapid-bubble-113.notion.site/Redis-Mediasoup-2ed207f23341809aaf88dca67f3e2e13?source=copy_link)

<br />

#### 4. 미니게임

&nbsp;&nbsp; 대화가 끊겨 어색한 순간, 간단한 미니게임으로 분위기를 전환해보면 어떨까요?  
&nbsp;&nbsp; 게임 점수에 따라 실시간으로 업데이트되는 랭킹 시스템을 통해 다른 유저들과 경쟁하며 새로운 재미를 찾아보세요.
 
&nbsp;&nbsp; <img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/6cfb0fe9-f114-4b65-bee9-a1f8eb96800c" />  
<br clear="left" />
&nbsp;&nbsp; <img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/dcebbf1d-61d5-4913-9f8a-252503a3e5e5" />
<br clear="left" />
&nbsp;&nbsp; <img align="left" width="800" alt="비커채우기" src="https://github.com/user-attachments/assets/91a646f1-b06c-4fb2-a56b-42bc649860a3" />  
<br clear="left" />
&nbsp;&nbsp; <img align="left" width="800" alt="반응속도테스트" src="https://github.com/user-attachments/assets/f3744602-bd3c-4684-9e95-d7e1f715c97a" />  
<br clear="left" />
<br />
&nbsp;&nbsp; <img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/7cfd6774-5da2-46f2-bf7c-9df55f8d14d1" />  

<br clear="left" />
<br />

- 결정 사항: [랭킹 페이지 표시 방식](https://rapid-bubble-113.notion.site/2eb207f2334180eca00edf864ad78f36?source=copy_link)
- 최적화: [게임 기록 저장 로직 최적화](https://rapid-bubble-113.notion.site/N-1-2f5207f23341807c9f8be95cb244001e?source=copy_link)
- 개선: [음성 채팅 기능 성능 개선](https://rapid-bubble-113.notion.site/2fb207f2334180f5bc83eab7a6136f38?source=copy_link)

<br />
<br />

#### 5. 안전한 대화 환경

&nbsp;&nbsp; 모두가 즐겁게 대화할 수 있도록, 비속어 필터링과 강제 퇴장 기능으로 쾌적한 커뮤니티를 만들어갑니다.

&nbsp;&nbsp; <img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/baf11707-6fd0-4871-aa12-f1296afa3184" />  
&nbsp;&nbsp; <img align="left" width="800" alt="image" src="https://github.com/user-attachments/assets/4a759687-4f7a-4827-bcc4-af259961b128" />

<br clear="left" />
<br />
<br />

- 결정 사항: [비속어 필터링 로직](https://rapid-bubble-113.notion.site/2fb207f2334180d7bea8d9d54f35acd6?source=copy_link)

<br />
<br />

## 📄 우리 프로젝트가 더 궁금하다면?

우리 프로젝트에 대한 심층적인 정보는 아래 Wiki 또는 Notion 문서를 참고해주세요.

- [기획서](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%EA%B8%B0%ED%9A%8D%EC%84%9C)
- [디자인 시스템](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%8A%A4%ED%85%9C)
- [폴더 구조](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%ED%8F%B4%EB%8D%94-%EA%B5%AC%EC%A1%B0)
- [컴포넌트 설계 철학](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EC%84%A4%EA%B3%84-%EC%B2%A0%ED%95%99)
- [컴포넌트 구조](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EA%B5%AC%EC%A1%B0)
- [도메인별 기술 문서 인덱스](https://github.com/boostcampwm2025/web26-2Ryuk/wiki/%EB%8F%84%EB%A9%94%EC%9D%B8%EB%B3%84-%EA%B8%B0%EC%88%A0-%EB%AC%B8%EC%84%9C-%EC%9D%B8%EB%8D%B1%EC%8A%A4)
- [API 명세](https://rapid-bubble-113.notion.site/API-2e0207f2334180a6b745f9ffdabb3391?source=copy_link)
- [DB Schema](https://rapid-bubble-113.notion.site/DB-2df207f23341807da4eef6ac7e1cc19f?source=copy_link)
- [이슈 해결 과정](https://rapid-bubble-113.notion.site/2cb207f2334180e8b3a5c889b8449a3a?v=2cb207f2334180fabf59000c34c5fb47&source=copy_link)
- [논의 및 결정 사항](https://rapid-bubble-113.notion.site/2e8207f2334180babadee83d5391e7e2?v=2e8207f2334180d19aa2000cd4f2bb4f&source=copy_link)

<br />

<div>
<a target="_blank" href="https://rapid-bubble-113.notion.site/TEAM-2Ryuk-2c3207f2334180df9885fc1c9faaffd6">
  <img style="display: inline-block;" src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=ffffff">
</a>
<a target="_blank" href="https://www.figma.com/design/tqQlwooFxarpauITyIb1F2/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=0-1&t=ieqopGSEZg7urKrQ-1">
  <img style="display: inline-block;" src="https://img.shields.io/badge/Figma-f24e1e?style=for-the-badge&logo=figma&logoColor=ffffff">
</a>
<a target="_blank" href="https://www.figma.com/board/pKgKfXgY2hQbMGjdSXudeB/%ED%85%8C%EC%98%A4%EC%9D%98-%EC%8A%A4%ED%94%84%EB%A6%B0%ED%8A%B8-%ED%85%9C%ED%94%8C%EB%A6%BF--web26-?node-id=0-1&t=zfkjclSSRSpPYmuh-1">
  <img style="display: inline-block;" src="https://img.shields.io/badge/FigJam-8743f7?style=for-the-badge&logo=figma&logoColor=ffffff">
</a>
</div>

<br />
<br />

## 🛠️ 기술 스택

#### 🖥️ Frontend

<span>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/CSS%20Modules-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Zustand-7c4a1e?style=for-the-badge">

</span>

#### 🏗️ Backend

<span>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/TypeORM-FF470F?style=for-the-badge">
 
</span>

#### 🗄️ Database
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">

#### ☁️ Infra / DevOps

<span>
  <img src="https://img.shields.io/badge/Naver%20Cloud-03C75A?style=for-the-badge&logo=naver&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white">
</span>

#### ⏳ Real-time Media
<span>
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white">
  <img src="https://img.shields.io/badge/Mediasoup-f39c12?style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/WebRTC-007FFF?style=for-the-badge&logo=webrtc&logoColor=white">
  
</span>

#### 🔐 Auth

<span>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
  <img src="https://img.shields.io/badge/Google%20OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white">
  <img src="https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub OAuth-181717?style=for-the-badge&logo=github&logoColor=white">
</span>

#### 🤝 Collaboration

<span>
  <img src="https://img.shields.io/badge/GatherTown-5B3CC4?style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">
  <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub%20Projects-181717?style=for-the-badge&logo=github&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub%20Wiki-181717?style=for-the-badge&logo=github&logoColor=white">
</span>

#### 🗺️ Architecture

<span>
  <img width="1069" height="547" alt="image" src="https://github.com/user-attachments/assets/9b6abaed-30b2-4dc1-bc41-1bdb76cb6a10" />
</span>
