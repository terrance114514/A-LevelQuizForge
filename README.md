# A-Level Smart Practice (Frontend + Backend)

A lightweight full-stack scaffold for international high school students studying A-Level.

## Features

1. Grade pathway selection: `G1`, `G2`, `AS`, `A2`
2. Exam board + subject + paper/module filtering (example preset includes `CIE Mathematics P1/P2/P3/P4`)
3. Mock exam generation with controls:
   - Number of questions
   - Difficulty level
   - Knowledge points
4. Wrong-question analysis page:
   - Error distribution by knowledge point
   - Weakness diagnosis
   - Actionable study suggestions
5. Mini-program prompting templates included

## Run Frontend

Open `index.html` directly in browser, or use a static server.

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Default backend URL: `http://localhost:3001`

## Backend API

1. `GET /health`
2. `GET /api/meta/curriculum`
3. `GET /api/meta/stats`
4. `POST /api/papers/generate`
5. `POST /api/papers/submit`
6. `POST /api/analysis`

### Example: Generate Paper

```bash
curl -X POST http://localhost:3001/api/papers/generate \
  -H "Content-Type: application/json" \
  -d '{
    "selection": {
      "grade": "AS",
      "board": "CIE",
      "subject": "Mathematics",
      "paper": "P1"
    },
    "options": {
      "count": 5,
      "difficulty": "中等",
      "topics": ["Trigonometry", "Functions"]
    }
  }'
```

### Example: Submit Answers

```bash
curl -X POST http://localhost:3001/api/papers/submit \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": "REPLACE_WITH_PAPER_ID",
    "answers": [0, 1, 0, 2, 3]
  }'
```

## File Map

- `index.html`: Home/selection page
- `pages/generate.html`: Mock paper generation page
- `pages/analysis.html`: Wrong-question analysis page
- `scripts/data.js`: Curriculum and question bank seed data
- `scripts/app.js`: Shared logic
- `scripts/generate.js`: Generator logic
- `scripts/analysis.js`: Analysis logic
- `PROMPTS.md`: Prompt templates for generating a mini-program
- `backend/`: Express API service

## Next Step Suggestions

- Replace local question bank with backend API and database.
- Add login/role support for student/teacher/parent.
- Persist wrong-question history across sessions.
- Add bilingual content (EN/ZH) and adaptive recommendation engine.
