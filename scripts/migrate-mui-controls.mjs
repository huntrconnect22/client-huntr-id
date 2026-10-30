import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Change JSX tags only. Strings (including print templates), events and form data stay intact.
const tags = {
  button: ["Button", "Button"],
  input: ["Input", "Fields"], select: ["Select", "Fields"], textarea: ["Textarea", "Fields"],
  table: ["Table", "Table"], thead: ["TableHead", "Table"], tbody: ["TableBody", "Table"],
  tr: ["TableRow", "Table"], td: ["TableCell", "Table"], th: ["TableHeaderCell", "Table"],
};
const root = path.resolve("app");
const write = process.argv.includes("--write");
const totals = {};
let changedFiles = 0;
function visitDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (file.startsWith(path.join(root, "shared", "ui"))) continue;
    if (entry.isDirectory()) { visitDirectory(file); continue; }
    if (!entry.name.endsWith(".tsx")) continue;
    const source = fs.readFileSync(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const edits = [];
    const imports = new Map();
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxClosingElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(ast);
        const match = tags[tag];
        if (match) {
          const [name, module] = match;
          edits.push({ start: node.tagName.getStart(ast), end: node.tagName.end, text: `Huntr${name}` });
          imports.set(name, module);
          if (!ts.isJsxClosingElement(node)) totals[tag] = (totals[tag] ?? 0) + 1;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    if (!edits.length) continue;
    let output = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    }
    const grouped = new Map();
    for (const [name, module] of imports) {
      if (!grouped.has(module)) grouped.set(module, []);
      grouped.get(module).push(`${name} as Huntr${name}`);
    }
    const lines = [...grouped].map(([module, names]) => `import { ${names.join(", ")} } from "~/shared/ui/${module}";`).join("\n");
    if (write) fs.writeFileSync(file, `${lines}\n${output}`);
    changedFiles++;
  }
}
visitDirectory(root);
console.log(JSON.stringify({ mode: write ? "write" : "dry-run", changedFiles, controls: totals }, null, 2));
