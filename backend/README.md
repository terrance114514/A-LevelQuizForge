# Backend Service

Express backend for A-Level Smart Practice.

## Quick Start

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3001` by default.

## API Overview

1. `GET /health`: health check
2. `GET /api/meta/curriculum`: curriculum tree
3. `GET /api/meta/stats`: question bank statistics
4. `POST /api/papers/generate`: generate a paper and return `paperId`
5. `POST /api/papers/submit`: submit answers by `paperId`
6. `POST /api/analysis`: build analysis from wrong-log payload

## Notes

1. Generated papers are stored in memory and expire automatically.
2. This is a scaffold: replace in-memory storage with DB in production.
