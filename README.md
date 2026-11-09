# Bluebook-style SAT simulator — updated

An independent SAT practice site built on Next.js 14, Prisma/PostgreSQL and Vercel Blob. **Not affiliated with or endorsed by College Board.** Reproduces testing interactions for practice, but does not reproduce official digital SAT equating or score scaling.

## What changed

- Full-screen Bluebook-inspired student test toolbar and footer question menu; mark for review; answer elimination; passage highlighting; optional line reader; calculator/reference controls; responsive layout.
- Subject-aware two-stage adaptive routing. RW Module 1 → RW Module 2 easy **or** hard → Math Module 1 → Math Module 2 easy **or** hard → Results. The unselected branches are never shown or included in results. Admin sets `adaptiveThreshold` per subject's Module 1. If absent, a proportional default based on example thresholds (RW 19/27, Math 16/22) is used; **this is a configurable practice heuristic, not College Board's official adaptive rule**.
- A server-persisted module start timestamp drives an absolute timer. A refresh/revisit does not reset it. Time starts **only** on pressing Start next module after a submitted module or break. The server rejects late edits. Break-end timestamps survive page reloads.
- Unselected adaptive question banks stay on the server until the student's route is determined. Answers, marked questions, highlights, and eliminated options persist. Autosave is serialized on the client and protected from concurrent write loss with serializable database transactions.
- Signed exam-access cookie for guests, student-ownership validation for student accounts, and admin-only preview access. Results and session mutations use the same ownership rules. Correct answers/explanations are not exposed to a student when question review is disabled.
- Admin → Import & Export: accepts full test JSON, uploads embedded base64 question/choice/reference images directly from the browser to Vercel Blob, validates adaptive configuration, creates questions+modules in a database transaction, and opens the new test in the editor.
- Export includes break settings and reference-sheet image so exports round-trip more completely.

## Deploy / upgrade

1. Use Node.js 20+; `npm ci`.
2. Set `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (at least 32 chars), and `BLOB_READ_WRITE_TOKEN` on Vercel. Use the existing project's variables; never put credentials in the JSON test.
3. Run **`npx prisma migrate deploy`**. This adds `moduleStartedAt`, `breakEndsAt`, `strikethrough` to `TestSession`. Then `npm run build` and deploy.
4. Admin → Import & Export → **Import a test**. Enter a student test password and choose the JSON file. The test is created under Tests. Review it and publish.
5. `npm test` runs unit tests. `npx tsc --noEmit` performs a separate typecheck. Test against an actual Vercel Blob-enabled and Postgres-enabled staging instance before production.

### JSON format — PDF → JSON

See [`examples/sat-adaptive-demo.json`](examples/sat-adaptive-demo.json) for a full self-contained *structure* with six populated modules and one embedded PNG. It is a **short functional demonstration, not a full SAT**.

```json
{
  "version": 1,
  "test": {
    "title": "Example test", "description": "...",
    "isPublished": false, "adaptiveEnabled": true,
    "allowReview": true, "showExplanations": true,
    "referenceSheetImage": null,
    "modules": [
      {
        "subject": "reading_writing", "moduleNumber": 1,
        "difficulty": "standard", "order": 0,
        "timeLimitSeconds": 1920, "breakAfterSeconds": 0,
        "adaptiveThreshold": 19,
        "questions": [{
          "subject": "reading_writing", "type": "multiple_choice", "difficulty": "medium",
          "passage": "Original text...", "stem": "Question text...",
          "choices": [
            {"id":"A","mode":"text","text":"First answer"},
            {"id":"B","mode":"text","text":"Second answer"},
            {"id":"C","mode":"text","text":"Third answer"},
            {"id":"D","mode":"text","text":"Fourth answer"}
          ],
          "correctAnswer": "B", "explanation": "..."
        }]
      }
    ]
  }
}
```

**Required adaptive module collection** (in this exact subject progression, with unique `order` values):

| `order` | `subject` | `moduleNumber` | `difficulty` | Official-length example |
|---|---|---|---|---|
| 0 | `reading_writing` | 1 | `standard` | 27 questions, 1920 s |
| 1 | `reading_writing` | 2 | `easy` | 27 questions, 1920 s |
| 2 | `reading_writing` | 2 | `hard` | 27 questions, 1920 s |
| 3 | `math` | 1 | `standard` | 22 questions, 2100 s |
| 4 | `math` | 2 | `easy` | 22 questions, 2100 s |
| 5 | `math` | 2 | `hard` | 22 questions, 2100 s |

**Breaks belong to the module before the break.** For a 10-minute SAT intermission, use `breakAfterSeconds: 600` on *both* Reading and Writing Module 2 branches, and `breakAfterSeconds: 0` on Math Module 1. (The included demo uses a 600-second break on both RW Module 2 variants.)

Each question needs subject/type (`multiple_choice` or `grid_in`), prompt, correct answer, and choices for multiple choice. For grid-in use a numeric or fractional `correctAnswer` and no choices. Valid image slots: `passageImage`, `stemImage`, `explanationImage`, choice `{ "mode": "image", "imageUrl": ... }`, and the test-level `referenceSheetImage`. Set the appropriate `passageIsImage` / `stemIsImage` / `explanationIsImage` boolean. The URL field can contain an existing public `https://...` URL or **`data:image/png;base64,...`** (also JPEG/WebP/GIF). When imported, data-URI images are decoded in the browser, uploaded to the existing Vercel Blob handler and replaced with HTTPS URLs. The server does **not** access local disk filenames or arbitrary image hosts.

**PDF conversion process:** upload a PDF in this conversation. Questions, choices, diagrams, the correct answer key and explanations can be transcribed into this JSON format. We need **both alternate second-module question sets** for each subject to deliver a genuinely branched adaptive test. A single linear four-module PDF does not, by itself, contain both adaptive branches. Supply multiple source tests or authorize newly authored alternative branches; do not invent an official answer key. Carefully verify diagrams and answer keys before publication. Convert diagrams to base64 in the JSON so you only upload one file in the admin panel.

### Practical notes / limits

- Web browsers cannot enforce the official Bluebook secure device environment or guaranteed offline-first delivery. A network connection is needed for autosave and session transitions.
- This simulator shows raw correctness and percentages; **400–1600 scores are not official**. Official scaled scores require independently calibrated item parameters and equating.
- Image fields accept PNG/JPEG/WebP/GIF. The file uploader requires `BLOB_READ_WRITE_TOKEN` and a configured Vercel Blob store. Maximum raw image size is 10 MB, and importer JSON size is limited to 60 MB. Uploaded images may remain in Blob storage if a later validation/database step fails; clean up orphans through the admin maintenance workflow.
- Active guest sessions created before this version may need a new test login because they do not carry the new signed exam-access cookie.
- The project includes historical `.patch` files from its earlier versions; they are not automatically applied and should not override current `src` code.
