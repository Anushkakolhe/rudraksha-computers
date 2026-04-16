# API REFERENCE & QUICK START GUIDE

## 🚀 Running the Project

### Step 1: Install & Start Backend
```bash
cd d:\Student\server
npm install
node index.js
```
✅ Expected: "MongoDB Connected" + "Server running on port 5000"

### Step 2: Open Frontend
```bash
start d:\Student\client\pages\login.html
```
Or use Python HTTP server:
```bash
cd d:\Student\client
python -m http.server 3000
# Open: http://localhost:3000/pages/login.html
```

### Step 3: Login/Signup
1. Click "Sign Up"
2. Create account (password: 8-16 characters)
3. Login with credentials
4. Redirected to dashboard

---

## 📡 ALL API ENDPOINTS

### BASE URL: `http://localhost:5000`

---

## 🔓 NO AUTH REQUIRED

### Signup
```
POST /auth/signup
Body: {
  "name": "Admin Name",
  "email": "admin@institute.com",
  "password": "Password@123"
}
Response: {
  "success": true,
  "message": "Account created successfully. Please login.",
}
```

### Login
```
POST /auth/login
Body: {
  "email": "admin@institute.com",
  "password": "Password@123"
}
Response: {
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Admin Name",
    "email": "admin@institute.com"
  }
}
```

---

## 🔐 REQUIRES JWT TOKEN IN HEADER
```
Authorization: <token_from_login>
```

---

### STUDENTS

#### Add Student
```
POST /api/students
Headers: { "Authorization": "token" }
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "address": "City, State",
  "enrollmentDate": "2024-04-03",
  "endDate": "2024-07-03"
}
```

#### Get All Students
```
GET /api/students
Headers: { "Authorization": "token" }
Response: {
  "success": true,
  "students": [...]
}
```

#### Get Student Count
```
GET /api/students/count
Response: {
  "success": true,
  "count": 5
}
```

#### Get Single Student
```
GET /api/students/{id}
```

#### Update Student
```
PUT /api/students/{id}
Body: { "progress": 75 }
```

#### Delete Student
```
DELETE /api/students/{id}
```

---

### COURSES

#### Add Course
```
POST /api/courses
Body: {
  "title": "Web Development",
  "description": "Learn modern web development",
  "duration": 30,
  "price": 15000,
  "instructor": "Mr. Smith",
  "capacity": 50
}
```

#### Get All Courses
```
GET /api/courses
```

#### Get Course Count
```
GET /api/courses/count
```

#### Get Single Course
```
GET /api/courses/{id}
```

#### Update Course
```
PUT /api/courses/{id}
```

#### Delete Course
```
DELETE /api/courses/{id}
```

---

### PACKAGES

#### Create Package
```
POST /api/packages
Body: {
  "name": "Premium Bundle",
  "courses": ["courseId1", "courseId2"],
  "totalPrice": 20000,
  "discount": 10
}
```

#### Get All Packages
```
GET /api/packages
Response: {
  "success": true,
  "packages": [
    {
      "_id": "...",
      "name": "Premium Bundle",
      "finalPrice": 18000
    }
  ]
}
```

#### Get Single Package
```
GET /api/packages/{id}
```

#### Update Package
```
PUT /api/packages/{id}
```

#### Delete Package
```
DELETE /api/packages/{id}
```

---

### ATTENDANCE

#### Mark Attendance
```
POST /api/attendance
Body: {
  "studentId": "studentId",
  "course": "courseId",
  "status": "Present",
  "checkInTime": "2024-04-03T10:00:00"
}
```

#### Get All Attendance
```
GET /api/attendance
```

#### Get Today's Attendance
```
GET /api/attendance/today
```

#### Get Attendance Stats
```
GET /api/attendance/stats
Response: {
  "success": true,
  "stats": {
    "present": 25,
    "absent": 5,
    "late": 3
  }
}
```

#### Delete Attendance Record
```
DELETE /api/attendance/{id}
```

---

### DASHBOARD

#### Get Dashboard Stats
```
GET /api/dashboard/stats
Response: {
  "success": true,
  "stats": {
    "totalStudents": 42,
    "activeCourses": 8,
    "revenue": 125000,
    "completionRate": 87.5
  }
}
```

#### Get Enrollment Trend (Last 7 Days)
```
GET /api/dashboard/enrollment-trend
Response: {
  "success": true,
  "trend": [
    { "_id": "2024-03-28", "count": 3 },
    { "_id": "2024-03-29", "count": 5 }
  ]
}
```

#### Get Course Popularity
```
GET /api/dashboard/course-popularity
Response: {
  "success": true,
  "popularity": [
    {
      "courseId": "...",
      "title": "Web Development",
      "enrollments": 15
    }
  ]
}
```

#### Get Recent Activities
```
GET /api/dashboard/recent-activities
Response: {
  "success": true,
  "activities": {
    "students": [...],
    "transactions": [...]
  }
}
```

#### Get Today's Classes
```
GET /api/dashboard/today-classes
```

---

### REPORTS

#### Get All Transactions
```
GET /api/reports/transactions
Response: {
  "success": true,
  "transactions": [
    {
      "_id": "...",
      "type": "income",
      "amount": 5000,
      "description": "Course Fee",
      "date": "2024-04-03"
    }
  ]
}
```

#### Add Transaction
```
POST /api/reports/transactions
Body: {
  "type": "income",
  "amount": 5000,
  "description": "Web Development Course",
  "studentId": "studentId"
}
```

#### Get Financial Stats
```
GET /api/reports/stats
Response: {
  "success": true,
  "stats": {
    "revenue": 125000,
    "expenses": 45000,
    "profit": 80000
  }
}
```

#### Delete Transaction
```
DELETE /api/reports/transactions/{id}
```

---

### SETTINGS

#### Get Settings
```
GET /api/settings
Response: {
  "success": true,
  "settings": {
    "instituteName": "Rudraksha Institute",
    "email": "info@institute.com",
    "phone": "+91 9876543210",
    "address": "City, State",
    "notifications": true
  }
}
```

#### Update Settings
```
PUT /api/settings
Body: {
  "instituteName": "New Institute Name",
  "email": "newemail@institute.com",
  "phone": "+91 9876543211",
  "address": "New City",
  "notifications": true
}
```

---

## 📝 COMMON RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Validation error or bad request"
}
```

### Error Response (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## 🧪 Test with cURL

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@institute.com","password":"Password123"}'
```

### Get Students (with token)
```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: YOUR_TOKEN_HERE"
```

### Add Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "phone":"+91 9876543210"
  }'
```

---

## 🖥️ Frontend JavaScript Usage

### Using API Utility (api.js)

#### Get All Students
```javascript
const result = await API.students.getAll();
if(result.success) {
  console.log(result.students);
}
```

#### Add Student
```javascript
const result = await API.students.add({
  name: "John",
  email: "john@example.com",
  phone: "+91 9876543210"
});
```

#### Delete Student
```javascript
const result = await API.students.delete(studentId);
```

#### Get Dashboard Stats
```javascript
const result = await API.dashboard.stats();
console.log(result.stats);
```

#### Get Financial Report
```javascript
const result = await API.reports.stats();
console.log(result.stats.profit);
```

---

## 🔑 Important Notes

✅ **Token Expiration**: 7 days
✅ **Password Requirements**: 8-16 characters
✅ **Email**: Must be unique
✅ **Timestamps**: ISO 8601 format
✅ **All amounts**: in Rupees (₹)

---

## ⚡ Performance Tips

- API responses are paginated (default 10 items)
- Use filters to reduce data transfer
- Cache frequently accessed data
- Implement lazy loading for large tables

---

## 🐛 Debug Mode

### Enable Network Logging
```javascript
// Add to console
localStorage.setItem("debug", "true");
```

### Check Stored Token
```javascript
console.log(localStorage.getItem("token"));
```

### Verify User Data
```javascript
console.log(JSON.parse(localStorage.getItem("user")));
```

---

## 📌 Sample Data for Testing

### Student
```javascript
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "+91 9123456789",
  "address": "Mumbai, Maharashtra"
}
```

### Course
```javascript
{
  "title": "Advanced Excel",
  "description": "Master Excel formulas and pivot tables",
  "duration": 15,
  "price": 8000,
  "instructor": "Mr. Verma"
}
```

### Package
- Select 2+ courses
- Set discount: 10-20%
- Final price auto-calculated

### Attendance
```javascript
{
  "studentId": "...",
  "course": "...",
  "status": "Present"
}
```

### Transaction
```javascript
{
  "type": "income",
  "amount": 5000,
  "description": "Course Fee - MS Office",
  "studentId": "..."
}
```

---

**Last Updated: April 3, 2026**
**Status: PRODUCTION READY ✅**
