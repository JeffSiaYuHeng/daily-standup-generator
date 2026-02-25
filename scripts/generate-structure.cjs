const fs = require('fs');
const path = require('path');

/**
 * Auto-generate 00_STRUCTURE.md from actual directory structure
 * Eliminates manual maintenance and prevents hallucinated paths
 * 
 * Usage: npm run gen:structure
 */

// Directories and files to completely ignore
const IGNORE = new Set([
    'node_modules', '.git', 'dist', 'build', '.turbo',
    'coverage', '.DS_Store', 'Thumbs.db',
    'package-lock.json', 'output.txt'
]);

// Only scan these top-level directories
const SCAN_DIRS = [
    '_DOCS', '_TASK', '.agent', 'components',
    'context', 'services', 'public', 'utils', 'scripts'
];

// Important root files to include
const ROOT_FILES = [
    'App.tsx', 'index.tsx', 'types.ts', 'database.sql',
    'vite.config.ts', 'package.json', 'tsconfig.json', 'index.html'
];

function shouldIgnore(name) {
    return IGNORE.has(name) || (name.startsWith('.') && !['.agent'].includes(name));
}

function buildTree(dir, indent = '', isLast = true, depth = 0) {
    const MAX_DEPTH = 6;
    if (depth > MAX_DEPTH) return [];

    let lines = [];
    const prefix = indent + (isLast ? '└── ' : '├── ');
    const newIndent = indent + (isLast ? '    ' : '│   ');

    try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
            .filter(item => !shouldIgnore(item.name))
            .sort((a, b) => {
                if (a.isDirectory() !== b.isDirectory()) {
                    return a.isDirectory() ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

        items.forEach((item, idx) => {
            const itemPath = path.join(dir, item.name);
            const isLastItem = idx === items.length - 1;

            if (item.isDirectory()) {
                lines.push(`${prefix}${item.name}/`);
                lines.push(...buildTree(itemPath, newIndent, isLastItem, depth + 1));
            } else {
                lines.push(`${prefix}${item.name}`);
            }
        });
    } catch (err) {
        console.error(`❌ Error reading ${dir}:`, err.message);
    }

    return lines;
}

function generateStructure(rootDir) {
    const lines = [];
    ROOT_FILES.forEach((file) => {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
            lines.push(`├── ${file}`);
        }
    });

    SCAN_DIRS.forEach((dir, idx) => {
        const dirPath = path.join(rootDir, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            const isLast = idx === SCAN_DIRS.length - 1;
            lines.push(`${isLast ? '└── ' : '├── '}${dir}/`);
            lines.push(...buildTree(dirPath, isLast ? '    ' : '│   ', true, 1));
        }
    });

    return lines;
}

function getFormattedDate() {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${days[d.getDay()]}`;
}

function main() {
    const rootDir = path.resolve(__dirname, '..');
    const outputPath = path.join(rootDir, '_DOCS', '00_STRUCTURE.md');

    console.log('🔍 Scanning project structure...');
    const treeLines = generateStructure(rootDir);

    const content = `# Daily Standup AI - Project Structure

**AUTO-GENERATED** by \`scripts/generate-structure.cjs\`  
**DO NOT EDIT MANUALLY** - This file is regenerated before each planning session.  
**Last Updated:** ${getFormattedDate()}

---

## Overview
Daily Standup AI is a web application designed to help software engineers generate high-quality daily standup updates. It takes raw, unstructured notes (text or voice) and transforms them into professional, team-ready status updates using Google Gemini AI.

## Directory Structure

\`\`\`
daily-standup-generator/
${treeLines.join('\n')}
\`\`\`

## Core Features

### 1. Standup Generation
- **Raw Input**: Accepts free-form text or voice input (via Web Speech API).
- **AI Processing**: Uses Google Gemini 1.5/2.0 to structure the input into "Yesterday", "Today", and "Blockers".
- **Context Awareness**: Can reference yesterday's standup or specific Jira tickets to improve accuracy.
- **Refinement**: Allows iterative refinement of the generated output via follow-up AI instructions.

### 2. Jira Ticket Management
- Track active tickets (In Progress, Todo, etc.).
- Easily select tickets to include in the current standup context.
- Keep a local/synced list of ticket keys and titles.

### 3. History & Persistence
- Automatically saves generated standups to local storage.
- Optional Cloud Sync with Supabase for cross-device access.
- Sidebar for browsing and reloading previous entries.

### 4. PWA Support
- Installable on desktop and mobile.
- Offline support via service workers.
- Add to Home Screen prompts.

## Component Architecture

- \`App.tsx\`: Central coordinator for state, view switching, and core logic.
- \`StandupInput\`: Handles the drafting phase (input field, ticket selection, mode toggles).
- \`StandupOutput\`: Displays the AI results, consistency notes, and refinement tools.
- \`HistorySidebar\`: Manages the list of past entries and sync controls.
- \`JiraTicketManager\`: Dedicated view for managing the user's ticket list.
- \`ApiKeySettings\`: Securely handles the Gemini API key storage.

## Data Flow

1. **Input**: User types notes or selects active Jira tickets.
2. **Context**: Optionally fetches the previous day's standup as reference.
3. **Generation**: Sends input + context to \`geminiService\` which prompts Gemini AI.
4. **Validation**: AI returns the standup plus "consistency notes" (e.g., forgotten tickets).
5. **Review**: User reviews, edits, or refines the output.
6. **Save**: Entry is persisted to local storage and/or Supabase.

## State Management

- **Local State**: Component-level state for UI toggles and form inputs.
- **App State**: Centralized in \`App.tsx\` (History, Tickets, Current Standup).
- **Persistence**: \`storageService.ts\` handles the abstraction between \`localStorage\` and Supabase.
- **Theme**: Dark/Light mode managed via Tailwind's \`dark\` class on the root element.

---

## Maintenance

- **Auto-generated:** Run \`npm run gen:structure\` or \`node scripts/generate-structure.cjs\`
- **Pre-planning hook:** This should run automatically before Planner agent execution
- **Ignored items:** node_modules, .git, dist, build, .turbo, coverage
- **Scanned directories:** ${SCAN_DIRS.join(', ')}
`;

    fs.writeFileSync(outputPath, content, 'utf8');

    console.log(`✅ Generated: ${outputPath}`);
}

main();
