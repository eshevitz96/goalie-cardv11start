
const fs = require('fs');
const content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

let depth = 0;
let lines = content.split('\n');
let closeLocation = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple parser: doesn't handle strings/comments perfect but good enough for code structure
    // We strip strings first to avoid "{" in strings
    const stripped = line.replace(/".*?"/g, "").replace(/'.*?'/g, "").replace(/`.*?`/g, "");

    for (let char of stripped) {
        if (char === '{') depth++;
        if (char === '}') depth--;

        if (depth === 0 && closeLocation === null && i > 33) { // 33 is start of component
            closeLocation = i + 1;
            console.log(`Component potentially closed at line ${closeLocation}`);
            console.log(`Line content: ${lines[i]}`);
        }
    }
}

console.log(`Final Depth: ${depth}`);
if (depth !== 0) console.log("WARNING: File ends with non-zero depth!");
