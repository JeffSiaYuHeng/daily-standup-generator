# Strategy Board (The Plan)

**Role**: Human Operator Territory

**Usage**: Define the roadmap and current focus here. This generates the instructions for the AI.

## Roadmap
1. **Package Opening Flow**: Implement the unboxing ritual (UNOPENED → BLANK). [DONE]
2. **Workbench Refactor**: Relocate logic and restore Industrial UI design. [DONE]
3. **Admin Dashboard**: Create a central navigation hub for admin tools. [PAUSED]
4. **Recording Flow**: Implement workbench for BLANK → DRAFT → SEALED. [DONE]

---

## CURRENT FOCUS
**GOAL**: Fix Audio Playback URL Generation Bug

**Context**:
- Audio playback fails with `NotSupportedError: The element has no supported sources`.
- User manually replaced R2 presigned URL logic with Supabase public URL hardcoding.
- Files are stored in R2 (confirmed by `lib/storage/client.ts` and `lib/storage/upload.ts`).
- The `storage_key` field in DB contains the R2 object key.

**Tasks**:
- [ ] **Fix URL Signing**: Restore R2 `getSignedUrl` with `GetObjectCommand` in `getTapePlaybackConfig`.
- [ ] **Add URL Helper**: Create reusable `generatePresignedGetUrl` function in `lib/storage/upload.ts`.

---

## Pending Roadmap
(Empty)
