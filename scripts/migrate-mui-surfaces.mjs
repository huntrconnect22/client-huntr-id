import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

let count = 0;
let files = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (file.includes("/shared/ui/")) continue;
    if (entry.isDirectory()) { walk(file); continue; }
    if (!file.endsWith(".tsx")) continue;
    const source = fs.readFileSync(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const edits = [];
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "div") {
        const attrs = node.openingElement.attributes.properties;
        const surface = attrs.some(attr => {
          if (!ts.isJsxAttribute(attr) || !attr.initializer) return false;
          if (attr.name.getText(ast) === "className" && ts.isStringLiteral(attr.initializer)) {
            return attr.initializer.text.split(/\s+/).includes("glass-panel");
          }
          if (attr.name.getText(ast) !== "style" || !ts.isJsxExpression(attr.initializer) ||
              !attr.initializer.expression || !ts.isObjectLiteralExpression(attr.initializer.expression)) return false;
          return attr.initializer.expression.properties.some(prop =>
            ts.isPropertyAssignment(prop) && ["background", "backgroundColor"].includes(prop.name.getText(ast)) &&
            ts.isStringLiteral(prop.initializer) && prop.initializer.text === "var(--ui-bg-card)");
        });
        if (surface) {
          for (const tag of [node.openingElement.tagName, node.closingElement.tagName]) {
            edits.push({ start: tag.getStart(ast), end: tag.end, text: "HuntrSurface" });
          }
          count++;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    if (!edits.length) continue;
    let output = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    fs.writeFileSync(file, `import { Surface as HuntrSurface } from "~/shared/ui/Surface";\n${output}`);
    files++;
  }
}
walk("app");
console.log(JSON.stringify({ files, surfaces: count }));
