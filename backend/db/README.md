# Database Design

Schema file: `db/schema.sql`

## Tables

1. `users`
- Basic user profile table.
- Supports roles: `student`, `teacher`, `parent`.
- Fields include optional `grade` and `target_score`.

2. `practice_sessions`
- Stores generated paper data and submitted result.
- `generated_questions` keeps full question snapshot for reproducible scoring.
- `result` and `wrong_log` are JSONB payloads for analysis and reporting.
- `status` tracks `generated` vs `submitted`.

## View

`user_practice_summary` provides quick aggregate metrics by `user_id`.
