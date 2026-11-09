# Deployment and QA checklist

This version changes Prisma schema and exam lifecycle logic. Back up the production database and deploy to staging first.

## Production change steps

1. Set `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, and `BLOB_READ_WRITE_TOKEN` in the environment (use existing values for the first three). Ensure Vercel Blob store is available.
2. Run `npm ci && npx prisma migrate deploy` and then `npm run build`. Deploy only after these pass in your environment.
3. Import `examples/sat-adaptive-demo.json` through Admin → Import & Export. The image in the second Math hard question is encoded in the JSON; check that a Vercel Blob URL is created and the question displays the line graphic.
4. Publish the test in the editor. In an anonymous browser, start the test using the password chosen during import.
5. Finish RW Module 1 with 0–1 correct; it must route to **RW Module 2 easy**; the hard questions must not appear in the page source/network response. Finish RW2; enter the timed break; after break start Math1. Finish Math1 with 0–1 correct; see Math2 easy and then results. Confirm the scored total is 8 questions, not 12.
6. Start a new attempt and score 2/2 on each Module 1; this must route to RW2 hard and Math2 hard. Final results must still include exactly four completed modules.
7. On an active module, enter an answer, flag it, cross out a choice, highlight passage text, then refresh. Verify the marks and remaining timer persist. Wait until expiry and confirm automatic submission. Check that you cannot return to a submitted module.
8. Reload midway through a timed intermission. Verify break time is preserved and the next module timer starts when you press Start.
9. Try accessing another student's session URL and results from a different authenticated student; access must be denied. Admin preview access must require admin login.
10. Test imports with bad JSON, missing alternate branches, malformed answer choices, bad image base64, and a valid image-only stem. Confirm invalid imports do not create partial database tests.

## Verification in this delivered archive

- TypeScript/TSX **syntax**: globally installed TypeScript parser checked all 135 TS/TSX source and test files, 0 parse errors.
- Executed pure routing smoke checks (both subject branches, skipped alternate module, final completion), score parsing, and a simulated embedded-image upload using a stub upload handler. Passed.
- JSON example: parsed and checked six modules/12 questions and a base64 PNG; simulated image materialization passed.
- **Not verified here**: `npm ci` could not complete in this environment, so Prisma client generation, full `next build`, Vitest suite, DB transactions, hosted image uploads and complete browser tests still need to run in your staging environment. Never treat this archive as production-verified until checklist items pass.

## Important difference from official SAT

The module thresholds are user-configurable practice heuristics. Raw scores are not College Board-equated section scores. The browser simulator does not have Bluebook's secure desktop environment or offline-first proctoring.
