const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/Student");
const StudentAuth = require("./studentModule/models/StudentAuth");

const http = require("http");

// Test dashboard endpoint
async function testDashboard() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://Admin:Admin%40123@cluster0.zm5kreg.mongodb.net/studentDB?retryWrites=true&w=majority");
    console.log("\n✅ MongoDB Connected\n");

    // Get all students in the database
    const allStudents = await Student.find({}).lean();
    console.log(`📊 Total students in Student collection: ${allStudents.length}`);

    if (allStudents.length > 0) {
      console.log("\n📋 Student Details:");
      allStudents.forEach((s, i) => {
        console.log(`  ${i + 1}. Name: ${s.name}, Email: ${s.email}, Course: ${s.course ? "YES" : "NO"}`);
      });
    } else {
      console.log("⚠️  No students found in Student collection");
    }

    // Get all StudentAuth
    const allStudentAuth = await StudentAuth.find({}).select({ email: 1, name: 1 }).lean();
    console.log(`\n📊 Total students in StudentAuth collection: ${allStudentAuth.length}`);

    if (allStudentAuth.length > 0) {
      console.log("\n👥 StudentAuth Details:");
      allStudentAuth.slice(0, 5).forEach((s, i) => {
        console.log(`  ${i + 1}. Name: ${s.name}, Email: ${s.email}`);
      });
    }

    // If we have both, let's make a test request
    if (allStudentAuth.length > 0) {
      const testEmail = allStudentAuth[0].email;
      console.log(`\n🔑 Using email for token: ${testEmail}`);

      // Create a test JWT
      const jwt = require("jsonwebtoken");
      const testToken = jwt.sign(
        { id: allStudentAuth[0]._id, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log(`\n📝 Test Token (first 50 chars): ${testToken.substring(0, 50)}...`);

      // Make test request to dashboard
      console.log("\n🌐 Making test request to /api/student/dashboard...\n");

      const options = {
        hostname: "localhost",
        port: 5000,
        path: "/api/student/dashboard",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${testToken}`,
          "Content-Type": "application/json"
        }
      };

      const request = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          console.log(`\n✅ Response Status: ${res.statusCode}`);
          console.log("📤 Response Data:", JSON.parse(data));
          console.log("\n👀 Check server terminal for ===== DEBUG START/END logs");
          mongoose.disconnect();
          process.exit(0);
        });
      });

      request.on("error", (e) => {
        console.error(`❌ Request Error: ${e.message}`);
        mongoose.disconnect();
        process.exit(1);
      });

      request.end();
    } else {
      console.log("\n⚠️  No StudentAuth found - cannot create test token");
      mongoose.disconnect();
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

testDashboard();
