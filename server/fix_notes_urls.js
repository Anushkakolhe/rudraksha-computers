/**
 * One-time migration script.
 * Fixes old notesFile URLs stored as /image/upload/ → /raw/upload/
 * Run once: node fix_notes_urls.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/Course");

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB");

  const courses = await Course.find({ "content.notesFile": { $ne: "" } });
  console.log(`Found ${courses.length} course(s) with notesFile entries`);

  let totalFixed = 0;

  for (const course of courses) {
    let modified = false;

    course.content = course.content.map((item) => {
      if (!item.notesFile) return item;

      const url = item.notesFile;

      // Only fix non-image files stored under /image/upload/
      if (url.includes("/image/upload/") && !IMAGE_EXTS.test(url)) {
        const fixed = url.replace("/image/upload/", "/raw/upload/");
        console.log(`  FIXING: ${url}`);
        console.log(`      TO: ${fixed}`);
        item.notesFile = fixed;
        modified = true;
        totalFixed++;
      } else {
        console.log(`  OK: ${url}`);
      }

      return item;
    });

    if (modified) {
      course.markModified("content");
      await course.save();
      console.log(`  Saved: ${course.courseName}`);
    }
  }

  console.log(`\nDone. Fixed ${totalFixed} URL(s).`);
  await mongoose.disconnect();
  process.exit(0);
}).catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
