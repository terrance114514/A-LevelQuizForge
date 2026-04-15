# Backend Service

Express backend for A-Level Smart Practice.

## Quick Start

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3001` by default.

## Run As Persistent Service (systemd)

Service name: `alevel-smart-practice-backend.service`

```bash
sudo systemctl status alevel-smart-practice-backend.service
sudo systemctl restart alevel-smart-practice-backend.service
sudo systemctl stop alevel-smart-practice-backend.service
sudo systemctl start alevel-smart-practice-backend.service
sudo systemctl enable alevel-smart-practice-backend.service
sudo journalctl -u alevel-smart-practice-backend.service -f
```

## PostgreSQL Setup

1. Create database (example name: `alevel_smart_practice`).
2. Set `DATABASE_URL` in environment (or copy from `.env.example`).
3. Apply schema:

```bash
npm run db:schema
```

When `DATABASE_URL` is set, backend uses PostgreSQL for paper/session persistence.
If `DATABASE_URL` is not set, backend falls back to in-memory storage.

## API Overview

1. `GET /health`: health check
2. `GET /api/meta/curriculum`: curriculum tree
3. `GET /api/meta/stats`: question bank statistics
4. `GET /api/meta/storage`: current persistence mode
5. `POST /api/papers/generate`: generate a paper and return `paperId`
6. `POST /api/papers/submit`: submit answers by `paperId`
7. `POST /api/analysis`: build analysis from wrong-log payload
8. `GET /api/users`: list users (DB mode)
9. `POST /api/users`: create user (DB mode)
10. `GET /api/users/:userId`: get user by id (DB mode)
11. `GET /api/users/:userId/practices`: list user practice records (DB mode)
12. `GET /api/admin/records`: dashboard-like latest users and practices (DB mode)

## Notes

1. In-memory records expire automatically (default: 6 hours).
2. In DB mode, generated papers and submitted results are persisted in `practice_sessions`.

## Minimal DB Flow Example

1. Create user:

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice","email":"alice@example.com","role":"student","grade":"AS","targetScore":85}'
```

2. Generate paper (use user id):

```bash
curl -X POST http://localhost:3001/api/papers/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"<USER_ID>",
    "selection":{"grade":"AS","board":"CIE","subject":"Mathematics","paper":"P1"},
    "options":{"count":5,"difficulty":"中等","topics":["Functions","Trigonometry"]}
  }'
```

3. Submit answers:

```bash
curl -X POST http://localhost:3001/api/papers/submit \
  -H "Content-Type: application/json" \
  -d '{"paperId":"<PAPER_ID>","answers":[0,1,2,0,3]}'
```

4. List this user's records:

```bash
curl http://localhost:3001/api/users/<USER_ID>/practices
```

5. View recent access data (admin-friendly):

```bash
curl "http://localhost:3001/api/admin/records?usersLimit=10&practicesLimit=20"
```
