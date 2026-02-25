#!/usr/bin/env node

/**
 * Auto-generate 00_STRUCTURE.md from actual directory structure
 * Eliminates manual maintenance and prevents hallucinated paths
 * 
 * Usage: node scripts/generate-structure.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories and files to completely ignore
const IGNORE = new Set([
    'node_modules', '.git', 'dist', 'build', '.turbo',
    'coverage', '.DS_Store', 'Thumbs.db',
    'package-lock.json'
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
    const MAX_DEPTH = 6; // Prevent infinite recursion
    if (depth > MAX_DEPTH) return [];

    let lines = [];
    const prefix = indent + (isLast ? '└── ' : '├── ');
    const newIndent = indent + (isLast ? '    ' : '│   ');

    try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
            .filter(item => !shouldIgnore(item.name))
            .sort((a, b) => {
                // Directories first, then alphabetically
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

    // Add root-level important files first
    ROOT_FILES.forEach((file, idx) => {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
            lines.push(`├── ${file}`);
        }
    });

    // Add important directories
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

**AUTO-GENERATED** by \`scripts/generate-structure.js\`  
**DO NOT EDIT MANUALLY** - This file is regenerated before each planning session.  
**Last Updated:** ${getFormattedDate()}

---

## Purpose
This file provides the current valid file tree to prevent AI hallucination of paths.
It is automatically generated from the actual directory structure.

## Directory Structure

\`\`\`
daily-standup-generator/
${treeLines.join('\n')}
\`\`\`

---

## Maintenance

- **Auto-generated:** Run \`npm run gen:structure\` or \`node scripts/generate-structure.js\`
- **Pre-planning hook:** This should run automatically before Planner agent execution
- **Ignored items:** node_modules, .git, dist, build, .turbo, coverage
- **Scanned directories:** ${SCAN_DIRS.join(', ')}

## Integration with Dual-Brain System

The Planner agent should always read this file first to ensure accurate path references.
This eliminates the need for manual updates and prevents outdated structure information.
`;

    fs.writeFileSync(outputPath, content, 'utf8');

    console.log(`✅ Generated: ${outputPath}`);
    console.log(`📊 Total lines: ${content.split('\n').length}`);
    console.log(`📁 Directories scanned: ${SCAN_DIRS.length}`);
}

// Execute
try {
    main();
} catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
}
