# Strategy Board (The Plan)

**Role**: Human Operator Territory

**Usage**: Define the roadmap and current focus here. This generates the instructions for the AI.

## Roadmap
1. **Core Features Phase**: Implement standup generation and history. [DONE]
2. **UX Polish**: Fix date formatting and edit mode bugs. [DONE]
3. **Weekly Logbook Generator**: Automated weekly reporting with Gemini AI and PDF export. [IN PROGRESS]

---

## CURRENT FOCUS
**GOAL**: Implement PDF Export logic.

**Context**:
- User can select a week and generate a professional logbook preview.
- Final step: Allow the user to download the preview as a high-quality PDF.
- Need to install `jspdf` and `html2canvas`.

**Tasks**:
- [x] Implement `getWeeklyEntries(startDate, endDate)` in `services/storageService.ts`.
- [x] Implement `generateWeeklyLog(entries)` in `services/geminiService.ts` using `formatOfLog.md` rules.
- [x] Create `WeeklyLogbookPreview` component in `components/WeeklyLogbookPreview.tsx`.
- [x] Create `WeeklyReportGenerator` modal/ui in `components/WeeklyReportGenerator.tsx`.
- [x] Add "Generate Weekly Report" button to `components/HistorySidebar.tsx`.
- [x] Implement PDF export logic in `utils/pdfExport.ts`.

---

## MILESTONE REACHED
The **Weekly Logbook Generator** is now fully operational.
- Service layer handles date-range fetching (Local & Cloud).
- AI synthesizes professional reports using established writing rules.
- Modal UI allows week selection and live preview.
- High-resolution PDF export is active.

---

## Pending Roadmap
- [ ] Web Notifications for Friday afternoon reminders.
- [ ] Export to Slack/Markdown.
- [ ] Jira "Done" ticket statistics in weekly report.
