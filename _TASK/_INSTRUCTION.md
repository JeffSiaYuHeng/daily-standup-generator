# Task Instruction

## Context
Implement the final feature: PDF Export. This requires installing `jspdf` and `html2canvas`, creating a utility function to capture the `logbook-preview` element, and integrating it into the `WeeklyReportGenerator`.

---

## Context Scope (Strict)
The Coder agent is ONLY allowed to modify the following files:
- utils/pdfExport.ts (New File)
- components/WeeklyReportGenerator.tsx
- package.json (Indirectly via npm install)

---

## Reference Scope (Read-Only)
- components/WeeklyLogbookPreview.tsx

---

## Steps (Execution Order)

1.  **Install Dependencies**:
    *   Run `npm install jspdf html2canvas`.

2.  **Create `utils/pdfExport.ts`**:
    *   Export a function `exportPDF = async (elementId: string, filename: string)`:
        *   Find the element by `elementId`.
        *   Use `html2canvas` to capture the element. Use `scale: 2` for high resolution.
        *   Use `jsPDF` to create a new PDF (A4 format).
        *   Add the image to the PDF.
        *   Save the PDF.

3.  **Update `components/WeeklyReportGenerator.tsx`**:
    *   Import `exportPDF` from `../utils/pdfExport`.
    *   Add state `isExporting: boolean`.
    *   Implement `handleExport = async () => { ... }`.
    *   Link the "Export PDF" button to `handleExport`.
    *   Add loading state to the button while exporting.

---

## Constraints & Rules
- Ensure the PDF looks professional (centered, proper margins).
- Handle potential errors if the element is not found.

---

## Out of Scope (Hard Stop)
- Do not modify any other files.

---

## Quality Checklist (Self-Review)
- [ ] `jspdf` and `html2canvas` installed.
- [ ] `exportPDF` utility correctly handles element scaling.
- [ ] Export button has a loading state.
- [ ] Filename is descriptive (e.g., `Internship_Log_[DateRange].pdf`).
