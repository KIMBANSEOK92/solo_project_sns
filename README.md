# React 개인프로젝트 SNS

# 📣 react프로젝트 개요
#### 본 프로젝트는 최근 심각하게 증가하고 있는 아동학대 문제에 대한 사회적 경각심을 높이고,
#### 시민들이 보다 적극적으로 관심을 갖고 행동할 수 있도록 유도하는 것을 목표로 한다.

<br>

# 📘 프로젝트 소개

본 프로젝트는 최근 사회적으로 심각하게 증가하고 있는 **아동학대 문제**에 대한 경각심을 높이고,  
시민들이 보다 적극적으로 관심을 가지고 행동할 수 있도록 유도하는 것을 목표로 합니다.

2024년부터 2025년까지 집계된 아동학대 건수는 **총 24,492건**에 달하며,  
많은 사건이 주변에서 쉽게 은폐되거나 방관되는 경우가 많아 실제 체감은 더욱 낮은 것이 현실입니다.

본 서비스는 “충분히 예방할 수 있었던 문제임에도 왜 반복되는가?”라는 질문을 던지며  
작은 관심과 행동이 아이의 삶을 지킬 수 있다는 메시지를 전달하고자 합니다.

이를 위해 SNS 기반 기능(피드, 친구), 지역 기반 아동학대 정보 제공(Child Finder),  
후원 시스템 등 다양한 기능을 통해 **사회적 인식 개선과 실질적 참여**를 함께 이끌어냅니다.

<br>

# ⏳ 개발 기간
🗓️ **총 개발 기간:** 2025년 11월 25일 ~ 12월 2일 (약 1주간)
|기간|주요 진행 내용|
|------|----------------|
|2025년 11월 24일 ~ 2025년 11월 25일 | 문서 및 피그마 설계 |
|2025년 11월 26일 ~ 2025년 12월 2일| react 작업 시작 및 마무리 |

<br>

## 🖥️ **기술 스택**
|구분|기술|
|------|----------------|
|**Backend**|![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)|
|**Frontend**|![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)|
|**Database**|![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)|
|**Tools**|![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white) ![MaterialUI](https://img.shields.io/badge/Material%20UI-%23FFFFFF?style=for-the-badge&logo=MUI&logoColor=#007FFF)|
|**Collaboration**|![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white) ![ChatGPT](https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white) |

<br>

## 🔌 기능 구현 설명(정리본)

### 1. 카테고리 구성

##### 서비스는 총 4개의 핵심 카테고리로 구성된다.

- 피드(Feed)

- 아동찾기(Child Finder)

- 친구(Friends)

- 후원(Support)

 각 기능은 일반적인 SNS 구조를 기반으로 하되,
아동 보호와 인식 개선을 위한 특화된 목적을 반영하여 설계되었다. 

<br>

## 2. 기능 상세

### ① 피드(Feed)

##### 사용자들이 가장 많이 머무르는 공간으로, SNS 형태로 구현된 열린 소통 공간이다.

- 최신 소식, 공지, 아동학대 관련 정보 제공

- 게시글 작성 및 이미지 첨부 가능

- 댓글, 좋아요, 공유 기능 제공

- 사용자 간 자연스러운 소통 및 참여 유도

| View | 
|------|
|<img width="500" height="500" alt="메인 feed" src="https://github.com/user-attachments/assets/7cf3bb34-60dc-4d8a-a344-57e602edbd74" />|

<br>

### ② 아동신고(Child_Abuse_Reports)

##### 지역 기반의 아동학대 정보를 확인할 수 있는 핵심 기능이다.

- 전국 지역 목록 제공

- 특정 지역을 선택하면 해당 지역의

- 아동학대 의심 사례

- 신고 정보

- 보호가 필요한 아이들의 현황
등을 확인할 수 있음

- 지역별 정보를 직관적으로 파악할 수 있도록 구성

| View | 
|------|
|<img width="500" height="500" alt="아동찾기" src="https://github.com/user-attachments/assets/ece3b07c-616f-4bbb-8f58-a113ed0b898d" />|
|<img width="500" height="500" alt="아동학대신고" src="https://github.com/user-attachments/assets/5434ce56-0a46-45d8-8f51-108ee95b0581" />|

<br>

### ③ 친구(Friends)

##### 사용자 간 관계를 형성할 수 있는 SNS형 친구 기능.

- 다른 사용자에게 친구 신청 가능

- 상대가 수락하면 자동으로 친구 목록에 추가

- 친구들의 게시글, 활동 내역을 쉽게 확인 가능

- 커뮤니티 기반의 소통 확대

| View | 
|------|
|<img width="500" height="500" alt="친구 추가" src="https://github.com/user-attachments/assets/87211b81-7991-4572-b987-e34eb8f664d8" />|

<br>

### ④ 후원(Donations)

##### 아동학대 피해 아동을 돕기 위한 후원 기능.

- 금액에 관계 없이 누구나 후원 참여 가능

- 후원 내역은 사용자 계정과 연동하여 기록

- 누적 후원액을 기반으로 한 ‘명예의 전당’ 제공

- 투명한 후원 내역 확인 가능

- “작은 관심이 큰 변화를 만든다”는 메시지를 전달하는 공간

| View | 
|------|
|<img width="500" height="500" alt="후원" src="https://github.com/user-attachments/assets/f3815ba4-b3a9-494d-81b9-63d17dc44123" />|
|<img width="500" height="500" alt="후원하기" src="https://github.com/user-attachments/assets/aebf62ab-1a5e-4f72-ba8e-b2831edadbb6" />|

<br>



