import path from "path";
import fs from "fs";
import { parseMarkdown } from "../shared/lessons/markdown-parser";

function bufferFile(relPath: string) {
  return fs.readFileSync(path.join(__dirname, relPath));
}

test('Test lesson', () => {
  const file = bufferFile('../shared/lessons/lesson-test.md').toString();
  const markdown = parseMarkdown(file);

  expect(markdown.title).toBe("Avoid the longbar dependency");
  console.debug(markdown);

});