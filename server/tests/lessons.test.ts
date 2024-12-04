import path from "path";
import fs from "fs";
import { parseMarkdown } from "../shared/models/lesson";
// import { LessonState } from "../src/old/lesson-state";


// Test that all lessons follow markdown rules
test('Test all lessons for valid markdown', () => {
  const lessonFolder = 'lessons/';

  function bufferFile(relPath: string) {
    return fs.readFileSync(path.join(__dirname, relPath));
  }  

  fs.readdirSync(lessonFolder).forEach(filename => {
    const file = bufferFile('../' + lessonFolder + filename).toString();
    expect(parseMarkdown(filename, file)).toBeDefined();
  });

  // COMMENTED OUT FOR NOW UNTIL LESSONS ARE IMPLEMENTED

  // Make sure this doesn't throw an error
  //const lessonState = new LessonState();

  //console.log(`Verified ${lessonState.count} lessons.`);

});