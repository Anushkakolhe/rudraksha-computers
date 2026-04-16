const mongoose = require("mongoose");
const path = require("path");
const Student = require("../../models/Student");
const Course = require("../../models/Course");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeName = (value) => String(value || "").trim().toLowerCase();
const cleanCourseName = (name) => {
  if (!name) return "";
  return String(name).replace(/^course:\s*/i, "").trim().toLowerCase();
};
const buildContentArray = (source) => {
  if (!source) return [];
  if (Array.isArray(source)) return source.filter(Boolean).map((item) => {
    if (item && typeof item === "object") {
      return item.description || item.title || item.videoUrl || "";
    }
    return String(item || "").trim();
  }).filter(Boolean);
  if (typeof source === "string") {
    const lines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : [source.trim()];
  }
  return [];
};

const buildContentItems = (source) => {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source.map((item) => {
      if (item && typeof item === "object") {
        return {
          text: String(item.description || item.title || item.videoUrl || "").trim(),
          notesFile: item.notesFile || ""
        };
      }
      return {
        text: String(item || "").trim(),
        notesFile: ""
      };
    }).filter((item) => item.text.length > 0);
  }
  if (typeof source === "string") {
    return source
      .split(/\r?\n/)
      .map((line) => ({ text: line.trim(), notesFile: "" }))
      .filter((item) => item.text.length > 0);
  }
  return [];
};

const getStudentDashboard = async (req, res) => {
  try {
    console.log("\n===== DEBUG START =====");

    // CHECK TOKEN
    console.log("REQ.STUDENT:", req.student);

    if (!req.student || !req.student.email) {
      console.log("❌ EMAIL NOT FOUND IN TOKEN");
      return res.status(401).json({ 
        message: "Invalid token",
        success: false,
        name: "Student",
        courses: [],
        totalCourses: 0,
        attendance: 0,
        assignments: 0,
        completed: 0
      });
    }

    const email = req.student.email.trim().toLowerCase();

    console.log("EMAIL FROM TOKEN:", email);

    // FETCH ALL STUDENTS (IMPORTANT)
    const allStudents = await Student.find().select({ email: 1, name: 1 });

    console.log("ALL STUDENTS IN DB:");
    allStudents.forEach(s => {
      console.log("  DB EMAIL:", s.email, "| NAME:", s.name);
    });

    // TRY EXACT MATCH
    let student = await Student.findOne({ email }).populate("course");

    console.log("EXACT MATCH:", student);

    // TRY CASE-INSENSITIVE MATCH
    if (!student) {
      student = await Student.findOne({
        email: { $regex: new RegExp("^" + email + "$", "i") }
      }).populate("course");
      console.log("REGEX MATCH:", student);
    }

    if (!student) {
      console.log("❌ NO MATCH FOUND IN STUDENT DB");
      console.log("===== DEBUG END =====\n");
      return res.status(404).json({ 
        message: "Student record not found",
        success: false,
        name: "Student",
        courses: [],
        totalCourses: 0,
        attendance: 0,
        assignments: 0,
        completed: 0
      });
    }

    console.log("✅ STUDENT FOUND:", student.email, student.name);

    // CHECK ALL POSSIBLE COURSE FIELDS
    console.log("student.courses:", student.courses);
    console.log("student.enrolledCourses:", student.enrolledCourses);
    console.log("student.course:", student.course);
    console.log("student.selectedCourses:", student.selectedCourses);

    let courses = [];
    
    // Check which field has course data
    if (Array.isArray(student.courses) && student.courses.length > 0) {
      console.log("✅ USING: student.courses");
      courses = student.courses;
    } else if (Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0) {
      console.log("✅ USING: student.enrolledCourses");
      courses = student.enrolledCourses;
    } else if (student.course) {
      console.log("✅ USING: student.course (single ref)");
      const courseData = student.course;

      let duration = null;

      // CASE 1: IF DAYS FIELD EXISTS
      if (courseData.days) {
        duration = courseData.days + " Days";
      }

      // CASE 2: CALCULATE FROM DATES
      else if (student.enrollmentDate && (student.expectedEndDate || student.endDate)) {
        const start = new Date(student.enrollmentDate);
        const end = new Date(student.expectedEndDate || student.endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // OPTIONAL: MONTH FORMAT
        if (diffDays > 30) {
          duration = Math.floor(diffDays / 30) + " Months";
        } else {
          duration = diffDays + " Days";
        }
      }

      // CASE 3: HANDLE EDGE CASES
      else if (student.expectedEndDate || student.endDate) {
        duration = "Ends on " + new Date(student.expectedEndDate || student.endDate).toLocaleDateString();
      }

      courses = [{
        courseName: courseData.courseName || courseData.name || "Course",
        duration: duration,
        feesPaid: student.feesPaid || 0,
        progress: student.progress || 0,
        expectedEndDate: student.expectedEndDate || student.endDate || null,
        enrolledDate: student.enrollmentDate
      }];
    } else if (Array.isArray(student.selectedCourses) && student.selectedCourses.length > 0) {
      console.log("✅ USING: student.selectedCourses");
      courses = student.selectedCourses;
    } else {
      console.log("⚠️  NO COURSES FOUND IN ANY FIELD");
    }

    console.log("RAW COURSES:", courses);

    const allCourses = await Course.find().lean();
    console.log("ALL OWNER COURSES LOADED:", allCourses.length);

    const normalizeCourseForStudent = (studentCourse) => {
      const courseNameValue = studentCourse.courseName || studentCourse.name || "";
      const cleanedName = cleanCourseName(courseNameValue);
      const matchedCourse = allCourses.find((ownerCourse) =>
        cleanCourseName(ownerCourse.courseName || ownerCourse.name || "") === cleanedName
      );

      const plainStudentCourse = studentCourse.toObject ? studentCourse.toObject() : { ...studentCourse };
      if (matchedCourse) {
        plainStudentCourse.courseId = matchedCourse._id.toString();
        plainStudentCourse.matchedOwnerName = matchedCourse.courseName || matchedCourse.name || courseNameValue;
      }
      return plainStudentCourse;
    };

    const selectedField = Array.isArray(student.courses) && student.courses.length > 0
      ? 'courses'
      : Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0
      ? 'enrolledCourses'
      : Array.isArray(student.selectedCourses) && student.selectedCourses.length > 0
      ? 'selectedCourses'
      : null;

    if (selectedField) {
      const updatedCourses = (student[selectedField] || []).map(normalizeCourseForStudent);
      if (selectedField === 'courses') {
        student.courses = updatedCourses;
        await student.save();
        console.log("STUDENT COURSES UPDATED WITH courseId");
      }
      courses = updatedCourses;
    }

    // FORMAT COURSES TO INCLUDE DURATION AND OWNER CONTENT
    const formattedCourses = await Promise.all(
      courses.map(async (c) => {
        console.log("COURSE OBJECT:", c);

        // Safe field extraction with fallbacks and cleaning
        const rawCourseName = c.name || c.courseName || c.title || "Unknown Course";
        const courseName = cleanCourseName(rawCourseName);
        const queryName = courseName || "Unknown Course";
        
        console.log("RAW NAME:", rawCourseName, "| CLEANED NAME:", queryName);

        const ownerCourse = c.courseId
          ? allCourses.find(ac => ac._id.toString() === c.courseId)
          : allCourses.find(ac =>
              cleanCourseName(ac.courseName || ac.name || "") === queryName
            );

        let duration = null;
        if (c.days) {
          duration = c.days + " Days";
        } else if (c.enrolledDate && c.expectedEndDate) {
          const start = new Date(c.enrolledDate);
          const end = new Date(c.expectedEndDate);
          const diffTime = end - start;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          duration = diffDays > 30 ? Math.floor(diffDays / 30) + " Months" : diffDays + " Days";
        } else if (c.expectedEndDate) {
          duration = "Ends on " + new Date(c.expectedEndDate).toLocaleDateString();
        } else {
          duration = c.duration || c.courseDuration || null;
        }

        const ownerContent = ownerCourse
          ? [
              ...buildContentArray(ownerCourse.content),
              ...buildContentArray(ownerCourse.modules),
              ...buildContentArray(ownerCourse.topics),
              ...buildContentArray(ownerCourse.description)
            ].filter((item, index, self) => item && self.indexOf(item) === index)
          : [];

        const studentContent = [
          ...buildContentArray(c.content),
          ...buildContentArray(c.modules)
        ].filter(Boolean);

        return {
          _id: c._id.toString(),
          name: (ownerCourse?.name || ownerCourse?.courseName || c.matchedOwnerName || rawCourseName || "Unknown Course"),
          courseId: ownerCourse ? ownerCourse._id.toString() : c.courseId || null,
          feesPaid: c.feesPaid || c.fees || 0,
          expectedEndDate: c.expectedEndDate || c.endDate || c.courseEndDate || null,
          duration: duration,
          progress: Math.min(typeof c.progress === "number" ? c.progress : (c.progress || 0), 100),
          content: ownerContent.length > 0 ? ownerContent : studentContent
        };
      })
    );

    // UPDATE STUDENT COURSES WITH COURSEID IF MISSING
    // FILTER TO ONLY SHOW COURSES WITH VALID OWNER COURSE
    console.log("FORMATTED COURSES (before filter):", formattedCourses.map(c => ({ name: c.name, courseId: c.courseId })));
    const validCourses = formattedCourses.filter(c => c.courseId);

    console.log("VALID COURSES (after filter):", validCourses.length, "courses");
    console.log("VALID COURSES NAMES:", validCourses.map(c => c.name));
    console.log("===== DEBUG END =====\n");

    const totalCourses = validCourses.length;
    const attendance = student.attendance || 0;
    const assignments = validCourses.reduce((sum, c) => sum + (c.assignments || 0), 0);
    const completed = validCourses.filter(c => (c.progress || 0) >= 100).length;

    return res.json({
      success: true,
      name: student.name,
      courses: validCourses,
      totalCourses,
      attendance,
      assignments,
      completed
    });
  } catch (err) {
    console.error("❌ ERROR:", err);
    console.log("===== DEBUG END (ERROR) =====\n");
    return res.status(500).json({ message: "Server error" });
  }
};

const getStudentCourseById = async (req, res) => {
  try {
    const studentCourseId = req.params.id;
    console.log("Requested Student Course ID:", studentCourseId);

    if (!studentCourseId) {
      return res.status(400).json({ success: false, message: "Course ID required" });
    }

    const email = req.student?.email?.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if student is enrolled in this course
    const courseArray = Array.isArray(student.courses)
      ? student.courses
      : Array.isArray(student.enrolledCourses)
      ? student.enrolledCourses
      : Array.isArray(student.selectedCourses)
      ? student.selectedCourses
      : [];

    // Find the enrolled course by its _id
    const enrolledCourse = courseArray.find(c => c._id.toString() === studentCourseId);
    if (!enrolledCourse) {
      return res.status(404).json({ success: false, message: "Course not found in enrollment" });
    }

    let ownerCourseId = enrolledCourse.courseId;
    if (!ownerCourseId) {
      const studentCourseName = cleanCourseName(enrolledCourse.courseName || enrolledCourse.name || "");
      const matchedOwner = await Course.findOne({
        $or: [
          { courseName: { $regex: new RegExp("^" + escapeRegex(studentCourseName) + "$$", "i") } },
          { name: { $regex: new RegExp("^" + escapeRegex(studentCourseName) + "$$", "i") } }
        ]
      }).lean();
      if (matchedOwner) {
        ownerCourseId = matchedOwner._id.toString();
        console.log("[getStudentCourseById] Recovered ownerCourseId from name:", ownerCourseId);
      }
    }

    if (!ownerCourseId) {
      return res.status(404).json({ success: false, message: "Course not linked to owner course" });
    }

    const ownerCourse = await Course.findById(ownerCourseId);
    if (!ownerCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const ownerContent = [
      ...buildContentItems(ownerCourse.content),
      ...buildContentItems(ownerCourse.modules),
      ...buildContentItems(ownerCourse.topics),
      ...buildContentItems(ownerCourse.description)
    ].filter((item, index, self) => item && self.text && self.findIndex((other) => other.text === item.text) === index);

    const studentContent = [
      ...buildContentItems(enrolledCourse.content),
      ...buildContentItems(enrolledCourse.modules),
      ...buildContentItems(enrolledCourse.topics),
      ...buildContentItems(enrolledCourse.description)
    ].filter((item, index, self) => item && item.text && self.findIndex((other) => other.text === item.text) === index);

    const contentArray = ownerContent.length > 0 ? ownerContent : studentContent;

    console.log("CONTENT FOUND:", contentArray);

    // Get progress from enrolled course
    const progress = Math.min(typeof enrolledCourse.progress === "number" ? enrolledCourse.progress : (enrolledCourse.progress || 0), 100);

    return res.json({
      success: true,
      courseName: ownerCourse.name || ownerCourse.courseName || "Course",
      duration: ownerCourse.duration || "Not Available",
      instructor: ownerCourse.instructor || "Not Available",
      progress,
      content: contentArray,
      notes: ownerCourse.notes || []
    });
  } catch (err) {
    console.error("❌ ERROR getStudentCourseById:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCourseById = async (req, res) => {
  try {
    let { courseId } = req.params;

    console.log("Incoming courseId:", courseId);

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    courseId = new mongoose.Types.ObjectId(courseId);

    const course = await Course.findById(courseId);

    console.log("Found course:", course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Convert notesFile paths to public URLs
    if (course.content && Array.isArray(course.content)) {
      course.content = course.content.map(item => {
        if (item.notesFile) {
          item.notesFile = `http://localhost:5000/uploads/notes/${path.basename(item.notesFile)}`;
          console.log("Serving file:", item.notesFile);
        }
        return item;
      });
    }

    console.log("RETURNED COURSE:", course.courseName || course.name);

    res.json(course);

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getStudentCourseContent = async (req, res) => {
  try {
    const courseName = (decodeURIComponent(req.params.courseName || "") || "").trim();
    console.log("Requested Course:", courseName);

    if (!courseName) {
      return res.status(400).json({ success: false, message: "Course name required" });
    }

    const escapedCourseName = courseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const email = req.student?.email?.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const student = await Student.findOne({ email }).populate("course");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const courseArray = Array.isArray(student.courses)
      ? student.courses
      : Array.isArray(student.enrolledCourses)
      ? student.enrolledCourses
      : Array.isArray(student.selectedCourses)
      ? student.selectedCourses
      : [];

    let course = courseArray.find((item) => 
      cleanCourseName(item.courseName || item.name || "") === cleanCourseName(courseName || "")
    );

    if (!course && student.course) {
      const courseCandidateName = cleanCourseName(student.course.courseName || student.course.name || "");
      if (courseCandidateName === cleanCourseName(courseName || "")) {
        course = {
          courseName: student.course.courseName || student.course.name,
          duration: student.course.duration || student.course.days || student.course.courseDuration || null,
          progress: student.progress || 0,
          enrolledDate: student.enrollmentDate,
          expectedEndDate: student.expectedEndDate || student.endDate || null,
          content: student.course.content || student.course.modules || []
        };
      }
    }

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    let ownerCourse = await Course.findOne({
      $or: [
        { courseName: { $regex: new RegExp("^" + escapedCourseName + "$", "i") } },
        { name: { $regex: new RegExp("^" + escapedCourseName + "$", "i") } }
      ]
    }).lean();

    if (!ownerCourse) {
      ownerCourse = await Course.findOne({
        $or: [
          { courseName: { $regex: new RegExp(escapedCourseName, "i") } },
          { name: { $regex: new RegExp(escapedCourseName, "i") } }
        ]
      }).lean();
    }

    if (!ownerCourse) {
      console.log("Course NOT FOUND in owner DB for:", courseName);
      return res.json({ success: false, message: "Course not found", content: [] });
    }

    let contentArray = [
      ...buildContentArray(ownerCourse.content),
      ...buildContentArray(ownerCourse.modules),
      ...buildContentArray(ownerCourse.topics),
      ...buildContentArray(ownerCourse.description)
    ].filter((item, index, self) => item && self.indexOf(item) === index);

    console.log("CONTENT FOUND:", contentArray);
    const progress = Math.min(typeof course.progress === "number" ? course.progress : (course.progress || 0), 100);

    return res.json({
      success: true,
      courseName: ownerCourse.name || ownerCourse.courseName || course.courseName || course.name || "Course",
      duration: ownerCourse.duration || course.duration || course.days || course.courseDuration || "Not Available",
      instructor: ownerCourse.instructor || "Not Available",
      progress,
      content: contentArray
    });
  } catch (err) {
    console.error("❌ ERROR getStudentCourseContent:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateStudentProgress = async (req, res) => {
  try {
    const email = req.student?.email?.trim().toLowerCase();
    const { courseId, progress } = req.body;

    if (!email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID required" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const courseArray = Array.isArray(student.courses)
      ? student.courses
      : Array.isArray(student.enrolledCourses)
      ? student.enrolledCourses
      : Array.isArray(student.selectedCourses)
      ? student.selectedCourses
      : [];

    let targetCourse = courseArray.find((item) => item._id?.toString() === courseId);

    if (!targetCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const nextProgress = Math.min(Number(progress) || 0, 100);
    targetCourse.progress = nextProgress;
    await student.save();

    return res.json({ success: true, progress: nextProgress });
  } catch (err) {
    console.error("❌ ERROR updateStudentProgress:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentCourseContent,
  getStudentCourseById,
  getCourseById,
  updateStudentProgress
};
