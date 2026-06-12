# Baseball Mate

Spring Boot + React starter project for a baseball game companion matching service.

## Project Structure

- `backend`: Spring Boot REST API
- `frontend`: React (Vite)

## Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

If `mvnw` is not present in your environment, use:

```bash
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Current APIs

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/teams`
- `GET /api/users/me` (requires `Authorization: Bearer <token>`)
- `PUT /api/users/me` (requires `Authorization: Bearer <token>`)
- `GET /api/companions`
- `POST /api/companions` (requires `Authorization: Bearer <token>` and saved mypage profile)

Example payload for `POST /api/companions`:

```json
{
  "title": "Weekend game plan",
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
