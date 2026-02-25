# Task Instruction: Add URL Helper for R2 GET Operations

## Context
The `lib/storage/upload.ts` currently only has `generatePresignedPutUrl` for uploads. We need a matching GET function to generate presigned URLs for audio playback from R2.

---

## Context Scope (Strict)
- `lib/storage/upload.ts`

---

## Steps (Execution Order)

1. Import `GetObjectCommand` from `@aws-sdk/client-s3`.
2. Create a new exported async function `generatePresignedGetUrl(key: string): Promise<string>`.
3. Inside the function:
   - Create a `GetObjectCommand` with `Bucket: process.env.R2_VAULT_BUCKET_NAME` and `Key: key`.
   - Use `getSignedUrl(r2VaultClient, command, { expiresIn: 3600 })` to generate the presigned URL.
   - Return the signed URL.

---

## Constraints & Rules
- Follow the existing pattern in `generatePresignedPutUrl`.
- Use 1 hour expiry (`expiresIn: 3600`).
- Keep the function signature simple (only `key` parameter).

---

## Out of Scope
- Do not modify `client.ts`.
- Do not modify any other files.
- Do not add error handling beyond what's in the existing pattern.

---

## Quality Checklist (Self-Review)
- [ ] Context Scope contains ≤ 4 files
- [ ] No code snippets included
- [ ] Out of Scope is explicit
