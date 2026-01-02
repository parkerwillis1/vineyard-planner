#!/usr/bin/env node

/**
 * Lint Script: Detect legacy icon-label patterns that should use IconLabel components
 *
 * This script scans for the old pattern:
 * - Icon wrapper div followed by heading/span
 * - Missing m-0 or items-center
 *
 * Run: node scripts/lint-icon-labels.js
 * CI: Add to package.json scripts: "lint:icons": "node scripts/lint-icon-labels.js"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to detect
const LEGACY_PATTERNS = [
  // Icon wrapper div + heading without m-0
  /<div[^>]*className="[^"]*w-\d+\s+h-\d+[^"]*rounded[^"]*flex[^"]*items-center[^"]*justify-center[^"]*"[^>]*>\s*<\w+[^>]*className="[^"]*w-\d+\s+h-\d+[^"]*"[^>]*\/>\s*<\/div>\s*<h[1-6][^>]*className="(?!.*m-0)/g,

  // Flex container without items-center followed by icon
  /<div[^>]*className="[^"]*flex(?!.*items-center)[^"]*gap[^"]*"[^>]*>\s*<div[^>]*className="[^"]*w-\d+\s+h-\d+[^"]*rounded/g,

  // Heading with default margins in UI context (not in .prose)
  /<h[2-3][^>]*className="(?!.*m-0)(?!.*mt-)(?!.*mb-)[^"]*text-(lg|xl)[^"]*font-bold/g,
];

const EXCEPTIONS = [
  'node_modules',
  'build',
  'dist',
  '.git',
  'scripts',
];

function shouldSkipFile(filePath) {
  return EXCEPTIONS.some(ex => filePath.includes(ex));
}

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for legacy icon wrapper + heading pattern
  const iconWrapperPattern = /<div[^>]*className="[^"]*w-(?:8|10|12|14)\s+h-(?:8|10|12|14)[^"]*rounded[^"]*flex[^"]*items-center[^"]*justify-center[^"]*"[^>]*>\s*<\w+[^>]*className="[^"]*w-\d+\s+h-\d+[^"]*"[^>]*\/>\s*<\/div>\s*<h[1-6]/g;
  let match;
  while ((match = iconWrapperPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      line: lineNum,
      message: 'Legacy icon+heading pattern detected. Use IconLabelHeading component instead.',
      snippet: match[0].substring(0, 100) + '...'
    });
  }

  // Check for flex container without items-center
  const flexPattern = /<div[^>]*className="[^"]*flex\s+(?!.*items-center)[^"]*gap-\d+[^"]*"[^>]*>\s*<div[^>]*className="[^"]*w-(?:8|10|12|14)/g;
  while ((match = flexPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    // Check if this is actually an icon-label pattern
    const nextContent = content.substring(match.index, match.index + 500);
    if (nextContent.match(/<\/div>\s*<(?:h[1-6]|span|p)[^>]*>/)) {
      issues.push({
        line: lineNum,
        message: 'Flex container with icon missing items-center. Add items-center to className.',
        snippet: match[0].substring(0, 100) + '...'
      });
    }
  }

  // Check for headings without m-0 that are likely in UI rows
  const headingPattern = /<h[2-3][^>]*className="(?!.*m-0)(?!.*prose)(?!.*docs-content)[^"]*text-(lg|xl|2xl)[^"]*font-bold/g;
  while ((match = headingPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    // Check if preceded by icon container within 200 chars
    const precedingContent = content.substring(Math.max(0, match.index - 200), match.index);
    if (precedingContent.match(/w-(?:8|10|12|14)\s+h-(?:8|10|12|14)[^>]*rounded[^>]*flex/)) {
      issues.push({
        line: lineNum,
        message: 'Heading after icon container missing m-0. Add m-0 to className or use IconLabelHeading.',
        snippet: match[0].substring(0, 100) + '...'
      });
    }
  }

  return issues;
}

function main() {
  console.log('🔍 Linting for legacy icon-label patterns...\n');

  const files = glob.sync('src/**/*.{jsx,tsx,js,ts}', {
    ignore: ['node_modules/**', 'build/**', 'dist/**']
  });

  let totalIssues = 0;
  const fileIssues = {};

  files.forEach(file => {
    if (shouldSkipFile(file)) return;

    const issues = lintFile(file);
    if (issues.length > 0) {
      fileIssues[file] = issues;
      totalIssues += issues.length;
    }
  });

  if (totalIssues === 0) {
    console.log('✅ No legacy icon-label patterns detected!\n');
    console.log('All icon+label combinations are using IconLabel components or have proper alignment classes.\n');
    process.exit(0);
  }

  console.log(`❌ Found ${totalIssues} legacy icon-label pattern(s) in ${Object.keys(fileIssues).length} file(s):\n`);

  Object.entries(fileIssues).forEach(([file, issues]) => {
    console.log(`📄 ${file}`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.message}`);
      console.log(`   ${issue.snippet}\n`);
    });
    console.log('');
  });

  console.log('💡 Fix suggestions:');
  console.log('   1. Use IconLabelHeading for section headings');
  console.log('   2. Use IconLabelButton for action buttons');
  console.log('   3. Use IconLabel for simple icon+text combinations');
  console.log('   4. Add items-center to flex containers');
  console.log('   5. Add m-0 to headings in UI rows\n');

  console.log('📚 See: src/shared/components/ui/IconLabel.README.md\n');

  process.exit(1);
}

main();
