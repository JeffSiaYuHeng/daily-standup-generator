#!/usr/bin/env node

/**
 * Auto-generate 06_DEPENDENCY_GRAPH.md from code import/export analysis
 * Uses static analysis to map file dependencies
 * Helps Planner understand side-effects when modifying files
 *
 * Usage: node scripts/generate-dependency-graph.js
 *
 * Note: Install madge first: npm install -g madge
 * Or use built-in analyzer if madge is not available
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to analyze for dependencies
const SOURCE_DIRS = ['app', 'components', 'lib', 'utils', 'hooks', 'context'];

// File extensions to analyze
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Check if madge is available
 */
function isMadgeAvailable() {
    try {
        execSync('madge --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate dependency graph using madge
 */
function generateWithMadge(rootDir) {
    console.log('📦 Using madge for dependency analysis...');

    const sourcePaths = SOURCE_DIRS
        .map(dir => path.join(rootDir, dir))
        .filter(p => fs.existsSync(p));

    if (sourcePaths.length === 0) {
        console.log('⚠️  No source directories found. Creating empty graph.');
        return { nodes: {}, summary: [] };
    }

    try {
        // Run madge and get JSON output
        const result = execSync(
            `madge --json --extensions ts,tsx,js,jsx ${sourcePaths.join(' ')}`,
            { encoding: 'utf8', cwd: rootDir }
        );

        const rawGraph = JSON.parse(result);
        return processRawGraph(rawGraph, rootDir);
    } catch (error) {
        console.error('❌ Madge analysis failed:', error.message);
        return generateBasicAnalysis(rootDir);
    }
}

/**
 * Basic dependency analysis (fallback when madge not available)
 */
function generateBasicAnalysis(rootDir) {
    console.log('📋 Using basic import analysis (madge not available)...');

    const graph = {};
    const files = [];

    // Collect all source files
    SOURCE_DIRS.forEach(dir => {
        const dirPath = path.join(rootDir, dir);
        if (fs.existsSync(dirPath)) {
            walkDirectory(dirPath, files, rootDir);
        }
    });

    // Analyze imports in each file
    files.forEach(filePath => {
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const imports = extractImports(filePath, rootDir);
        if (imports.length > 0) {
            graph[relativePath] = imports;
        }
    });

    return processRawGraph(graph, rootDir);
}

/**
 * Walk directory recursively
 */
function walkDirectory(dir, fileList, rootDir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            walkDirectory(fullPath, fileList, rootDir);
        } else if (item.isFile() && VALID_EXTENSIONS.includes(path.extname(item.name))) {
            fileList.push(fullPath);
        }
    });
}

/**
 * Extract imports from a file using regex
 */
function extractImports(filePath, rootDir) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = [];

        // Match: import ... from './path' or import ... from '@/path'
        const importRegex = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];

            // Skip external packages (those without ./ or @/)
            if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
                continue;
            }

            // Resolve relative imports
            const resolvedPath = resolveImportPath(filePath, importPath, rootDir);
            if (resolvedPath) {
                imports.push(resolvedPath);
            }
        }

        return imports;
    } catch (error) {
        return [];
    }
}

/**
 * Resolve import path to actual file path
 */
function resolveImportPath(fromFile, importPath, rootDir) {
    try {
        let targetPath;

        if (importPath.startsWith('@/')) {
            // Handle @/ alias (typically maps to root or src)
            targetPath = path.join(rootDir, importPath.replace('@/', ''));
        } else {
            // Handle relative imports
            const fromDir = path.dirname(fromFile);
            targetPath = path.join(fromDir, importPath);
        }

        // Try to resolve with extensions
        for (const ext of VALID_EXTENSIONS) {
            const withExt = targetPath + ext;
            if (fs.existsSync(withExt)) {
                return path.relative(rootDir, withExt).replace(/\\/g, '/');
            }
        }

        // Try as directory with index file
        for (const ext of VALID_EXTENSIONS) {
            const indexFile = path.join(targetPath, 'index' + ext);
            if (fs.existsSync(indexFile)) {
                return path.relative(rootDir, indexFile).replace(/\\/g, '/');
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Process raw dependency graph into structured format
 */
function processRawGraph(rawGraph, rootDir) {
    const nodes = rawGraph;
    const reverseMap = {}; // file -> files that import it
    const summary = [];

    // Build reverse dependency map
    Object.entries(nodes).forEach(([file, dependencies]) => {
        dependencies.forEach(dep => {
            if (!reverseMap[dep]) {
                reverseMap[dep] = [];
            }
            reverseMap[dep].push(file);
        });
    });

    // Generate summary for high-impact files (files imported by many others)
    const impactScores = Object.entries(reverseMap)
        .map(([file, importers]) => ({
            file,
            importerCount: importers.length,
            importers: importers
        }))
        .sort((a, b) => b.importerCount - a.importerCount)
        .slice(0, 20); // Top 20 most imported files

    impactScores.forEach(({ file, importerCount, importers }) => {
        summary.push({
            file,
            impact: 'HIGH',
            importedBy: importerCount,
            importers: importers.slice(0, 5), // Show first 5 importers
            hasMore: importerCount > 5
        });
    });

    return { nodes, reverseMap, summary };
}

/**
 * Generate markdown content
 */
function generateMarkdown(graphData) {
    const { nodes, reverseMap, summary } = graphData;
    const totalFiles = Object.keys(nodes).length;
    const totalDependencies = Object.values(nodes).reduce((sum, deps) => sum + deps.length, 0);

    return `# Dependency Graph

**AUTO-GENERATED** by \`scripts/generate-dependency-graph.js\`
**DO NOT EDIT MANUALLY** - Regenerate with: \`npm run gen:graph\`
**Last Updated:** ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })}

---

## Purpose

This file maps import/export relationships across the codebase.
**Critical for Planner**: Before modifying a file, check if it's imported by others.
If a file has many importers, changes may require updating Reference Scope or Context Scope.

---

## Statistics

- **Total Files Analyzed**: ${totalFiles}
- **Total Dependencies**: ${totalDependencies}
- **Average Dependencies per File**: ${totalFiles > 0 ? (totalDependencies / totalFiles).toFixed(1) : 0}

---

## High-Impact Files (Top 20)

These files are imported by many others. Modifying them requires careful impact analysis.

${summary.length > 0 ? summary.map(item => `
### \`${item.file}\`
- **Impact Level**: ${item.impact}
- **Imported By**: ${item.importedBy} file(s)
- **Key Importers**:
${item.importers.map(imp => `  - \`${imp}\``).join('\n')}
${item.hasMore ? `  - *...and ${item.importedBy - 5} more*` : ''}
`).join('\n') : '*No high-impact files detected*'}

---

## Full Dependency Map

<details>
<summary>Click to expand complete dependency graph (JSON format)</summary>

\`\`\`json
${JSON.stringify(nodes, null, 2)}
\`\`\`

</details>

---

## Reverse Dependency Map

<details>
<summary>Click to expand reverse dependencies (which files import what)</summary>

\`\`\`json
${JSON.stringify(reverseMap, null, 2)}
\`\`\`

</details>

---

## How Planner Should Use This

### Before Creating Context Scope:

1. **Read this file** to understand the file's position in the dependency tree
2. **Check "High-Impact Files"** section first
3. **If modifying a high-impact file**:
   - Add key importers to **Reference Scope** (read-only)
   - OR add to **Context Scope** if they also need changes
   - Document potential side-effects in instruction

### Example Decision Flow:

\`\`\`
Task: Modify lib/utils/validation.ts

Step 1: Check 06_DEPENDENCY_GRAPH.md
Step 2: Find validation.ts is imported by 12 files
Step 3: Identify top 3 importers:
  - app/auth/login/page.tsx
  - components/forms/UserForm.tsx
  - lib/actions/user-actions.ts

Step 4: Add to _INSTRUCTION.md:
  Context Scope:
    - lib/utils/validation.ts

  Reference Scope:
    - app/auth/login/page.tsx (uses validateEmail)
    - components/forms/UserForm.tsx (uses validatePassword)
\`\`\`

---

## Maintenance

- **Update**: Run \`npm run gen:graph\` before planning sessions
- **Tool**: Uses madge (install: \`npm install -g madge\`) or built-in analyzer
- **Directories Analyzed**: ${SOURCE_DIRS.join(', ')}
- **File Types**: ${VALID_EXTENSIONS.join(', ')}

---

## Integration with Evaluator

The Evaluator should verify:
- If a Context Scope file is high-impact, did the Coder test affected importers?
- Are breaking changes properly documented in 03_SERVER_ACTIONS.md?
`;
}

/**
 * Main execution
 */
function main() {
    const rootDir = path.resolve(__dirname, '..');
    const outputPath = path.join(rootDir, '_DOCS', '06_DEPENDENCY_GRAPH.md');

    console.log('🔍 Analyzing code dependencies...');

    const graphData = isMadgeAvailable()
        ? generateWithMadge(rootDir)
        : generateBasicAnalysis(rootDir);

    const markdown = generateMarkdown(graphData);

    fs.writeFileSync(outputPath, markdown, 'utf8');

    console.log(`✅ Generated: ${outputPath}`);
    console.log(`📊 Files analyzed: ${Object.keys(graphData.nodes).length}`);
    console.log(`🔗 High-impact files: ${graphData.summary.length}`);
}

// Execute
try {
    main();
} catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
}
