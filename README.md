# 🏟️ Baseball Together (야구동행)

> **야구 경기를 함께 볼 동행을 찾는 플랫폼**

혼자가 아닌 함께! 좋아하는 팀의 경기를 함께 관전할 동행을 쉽게 찾을 수 있는 매칭 서비스입니다.

## ✨ 주요 기능

- **사용자 인증**: 회원가입, 로그인 (Bearer Token 기반)
- **마이페이지**: 프로필 작성 (이름, 나이, 선호 팀)
- **공고 작성**: 야구 경기 관전 동행 모집
  - 경기장, 경기 일정, 필요 인원 설정
  - 티켓 이미지 업로드
  - 좌석 정보 입력
- **필터링 & 검색**:
  - 구단별 필터링 (10개 KBO 팀 지원)
  - 경기장별 필터링 (9개 주요 야구장)
- **북마크**: 마음에 드는 공고 저장
- **신청 관리**: 동행 신청, 수락/거절

## 🛠️ 기술 스택

### Backend
- **Framework**: Spring Boot 3.3.5
- **Language**: Java 21
- **Database**: H2 (File-based)
- **ORM**: Hibernate 6.5.3
- **Build Tool**: Maven
- **Server**: Tomcat (Port 8080)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5.4.21
- **Package Manager**: npm
- **Dev Server Port**: 5173
- **Styling**: CSS

## 📁 프로젝트 구조

```
야구동행/
├── backend/                           # Spring Boot 백엔드
│   ├── src/main/java/com/baseballmate/
│   │   ├── api/
│   │   │   ├── auth/                 # 인증 관련
│   │   │   ├── companion/            # 공고, 신청 관련
│   │   │   ├── web/                  # 컨트롤러
│   │   │   ├── config/               # 설정
│   │   │   └── common/               # 공통 기능
│   │   └── BaseballMateApplication.java
│   ├── src/main/resources/
│   │   └── application.yml            # 설정 파일
│   └── pom.xml
├── frontend/                          # React 프런트엔드
│   ├── src/
│   │   ├── App.jsx                   # 메인 앱 컴포넌트
│   │   ├── api.js                    # API 클라이언트
│   │   ├── main.jsx
│   │   └── styles.css                # 스타일
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 빠른 시작

### 사전 요구사항
- Java 21+
- Node.js 16+
- Maven 3.6+
- npm 8+

### 백엔드 실행

```bash
cd backend
mvn spring-boot:run
```

백엔드는 `http://localhost:8080`에서 실행됩니다.

### 프런트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프런트엔드는 `http://localhost:5173`에서 실행되며, `/api` 요청은 자동으로 백엔드로 프록시됩니다.

## 📚 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 사용자
- `GET /api/users/teams` - 팀 목록 조회
- `GET /api/users/me` - 내 프로필 조회 (인증 필수)
- `PUT /api/users/me` - 프로필 수정 (인증 필수)

### 공고
- `GET /api/companions` - 공고 목록 조회
- `POST /api/companions` - 공고 작성 (인증 필수)
- `PUT /api/companions/{id}` - 공고 수정 (인증 필수)
- `DELETE /api/companions/{id}` - 공고 삭제 (인증 필수)
- `PATCH /api/companions/{id}/close` - 공고 마감 (인증 필수)

### 신청
- `POST /api/companions/{postId}/applications` - 신청하기 (인증 필수)
- `DELETE /api/companions/{postId}/applications` - 신청 취소 (인증 필수)
- `POST /api/companions/{postId}/applications/{appId}/accept` - 신청 수락 (인증 필수)
- `POST /api/companions/{postId}/applications/{appId}/reject` - 신청 거절 (인증 필수)

### 북마크
- `POST /api/companions/{postId}/bookmark` - 북마크 추가/제거 (인증 필수)
- `GET /api/companions/bookmarks` - 북마크 목록 조회 (인증 필수)

## 🎯 KBO 구단 및 경기장

### 10개 KBO 구단
- LG 트윈스
- 두산 베어스
- SSG 랜더스
- 키움 히어로즈
- KIA 타이거즈
- 삼성 라이온즈
- 롯데 자이언츠
- 한화 이글스
- NC 다이노스
- KT 위즈

### 9개 주요 경기장
- 잠실야구장
- 인천 SSG 랜더스필드
- 고척스카이돔
- 수원 KT 위즈파크
- 대전 한화생명 볼파크
- 대구 삼성 라이온즈파크
- 광주 기아 챔피언스필드
- 사직야구장
- 창원 NC 파크

## 📋 주요 구현 사항

### 데이터베이스
- H2 File-based 데이터베이스 (`./data/baseballmate`)
- Hibernate ORM을 통한 자동 스키마 생성
- 5개 JPA Repository 구현

### 인증
- Bearer Token 기반 인증
- JWT-like 토큰 발급 및 검증
- 사용자별 프로필 정보 관리

### 파일 업로드
- MultipartFile을 통한 이미지 업로드
- UUID 기반 파일명 생성
- `./backend/uploads/` 디렉토리에 저장
- Static resource mapping으로 `/uploads/**` 경로 서빙

### 폼 검증
- Jakarta Validation 어노테이션 활용
- `@NotBlank`, `@NotNull`, `@Min`, `@Max` 등
- 요청 데이터 자동 검증

## 🔗 REST API 요청 예시

### 회원가입
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nickname": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 프로필 작성
```bash
curl -X PUT http://localhost:8080/api/users/me \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "홍길동",
    "age": 25,
    "favoriteTeam": "LG 트윈스"
  }'
```

### 공고 작성 (이미지 포함)
```bash
curl -X POST http://localhost:8080/api/companions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'title=주말 경기 함께 봐요' \
  -F 'stadium=잠실야구장' \
  -F 'gameDate=2026-06-20' \
  -F 'description=LG 경기 같이 관전할 분' \
  -F 'totalTickets=2' \
  -F 'wantedCount=1' \
  -F 'ticketImage=@path/to/image.png'
```

## 📝 개발 팀

- **개발**: IJaeIG

## 📄 라이센스

본 프로젝트는 학습 목적으로 제작되었습니다.

---

⚾ **함께 야구를 즐기세요!**
  "stadium": "Jamsil Baseball Stadium",
  "gameDate": "2026-05-16",
  "description": "Meet at gate 2 around 5:30 PM"
}
```

Example payload for `PUT /api/users/me`:

```json
{
  "name": "홍길동",
  "age": 25,
  "favoriteTeam": "LG 트윈스"
}
```
