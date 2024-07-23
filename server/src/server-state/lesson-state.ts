import { Lesson, LessonHeader, parseLessonHeader, parseMarkdown } from "../../shared/models/lesson";
import path from "path";
import fs from "fs";

export class LessonState {

  // All lesson headers by filename
  private allLessonHeaders: { [key: string]: LessonHeader } = {};
  public readonly count: number;

  private readonly relativeLessonPath = '../../lessons/';
  private readonly absoluteLessonPath = 'lessons/';

  constructor() {

    // Load all lesson headers
    const lessonFolder = this.absoluteLessonPath;

    fs.readdirSync(lessonFolder).forEach(filename => {
      const file = this.bufferFile(this.relativeLessonPath + filename).toString();
      const fileHeader = parseLessonHeader(file);
      this.allLessonHeaders[filename] = fileHeader;
    });

    this.count = Object.keys(this.allLessonHeaders).length;
  }

  private bufferFile(relPath: string) {
    return fs.readFileSync(path.join(__dirname, relPath));
  }  

  getAllLessonHeaders(): { [key: string]: LessonHeader } {
    return this.allLessonHeaders;
  }

  getLessonByFilename(filename: string): Lesson {
    const file = this.bufferFile(this.relativeLessonPath + filename).toString();
    return parseMarkdown(file);
  }
}