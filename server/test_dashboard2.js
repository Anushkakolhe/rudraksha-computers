const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/Student");
const StudentAuth = require("./studentModule/models/StudentAuth");

const http = require("http");
const fs = require("fs");

// Clear previous debug log
try {
  fs.unlinkSync("./debug_logs.txt");
} catch (e) {}

// Intercept console.log
const originalLog = console.log;
const originalError = console.error;

function logToFile(args) {
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');
  
  fs.appendFileSync('./debug_logs.txt', message + '\n');
  originalLog(...args);
}

console.log = function (...args) {
  logToFile(args);
};

console.error = function (...args) {
  logToFile(args);
};

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
      allStudents.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. Name: ${s.name}, Email: ${s.email}, Course: ${s.course}`);
      });
    }

    // Get all StudentAuth
    const allStudentAuth = await StudentAuth.find({}).select({ email: 1, name: 1 }).lean();
    console.log(`\n📊 Total students in StudentAuth collection: ${allStudentAuth.length}`);

    if (allStudentAuth.length > 0) {
      console.log("\n👥 Using StudentAuth:");
      allStudentAuth.forEach((s, i) => {
        console.log(`  ${i + 1}. Name: ${s.name}, Email: ${s.email}`);
      });
    }

    // Make request with first StudentAuth
    if (allStudentAuth.length > 0) {
      const testEmail = allStudentAuth[0].email;
      console.log(`\n🔑 Creating token for: ${testEmail}`);

      const jwt = require("jsonwebtoken");
      const testToken = jwt.sign(
        { id: allStudentAuth[0]._id, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log(`\n🌐 Making request to: GET /api/student/dashboard`);
      console.log(`Authorization: Bearer ${testToken.substring(0, 30)}...`);

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
          try {
            const parsedData = JSON.parse(data);
            console.log("\n📤 RESPONSE DATA:");
            console.log(JSON.stringify(parsedData, null, 2));
          } catch (e) {
            console.log("RAW Response:", data);
          }

          console.log("\n⏳ Waiting 2 seconds for server logs...");
          setTimeout(() => {
            console.log("\n✅ Test Complete - Check debug_logs.txt for captured output");
            mongoose.disconnect();
            process.exit(0);
          }, 2000);
        });
      });

      request.on("error", (e) => {
        console.error(`❌ Request Error: ${e.message}`);
        mongoose.disconnect();
        process.exit(1);
      });

      request.end();
    } else {
      console.log("\n❌ No StudentAuth found");
    }

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

testDashboard();
