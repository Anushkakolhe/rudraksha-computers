// API Utility - Centralized API calls with JWT authentication

const API_BASE_URL = "https://rudraksha-computers.onrender.com/api";
const AUTH_BASE_URL = "https://rudraksha-computers.onrender.com/auth";

class API {
  static getToken() {
    return localStorage.getItem("token");
  }

  static getHeaders() {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(url, method = "GET", body = null) {
    try {
      const options = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      // Add cache control
      options.headers["Cache-Control"] = "no-cache";

      const response = await fetch(url, options);
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : { success: false, message: 'Empty response from server' };
      } catch (jsonError) {
        console.error('Invalid JSON response from', url, text);
        return { success: false, message: 'Invalid JSON response from server' };
      }

      if (!response.ok && response.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, message: error.message };
    }
  }

  // STUDENTS API
  static students = {
    getAll: () => API.request(`${API_BASE_URL}/students`),
    get: (id) => API.request(`${API_BASE_URL}/students/${id}`),
    add: (data) => API.request(`${API_BASE_URL}/students`, "POST", data),
    update: (id, data) => API.request(`${API_BASE_URL}/students/${id}`, "PUT", data),
    delete: (id) => API.request(`${API_BASE_URL}/students/${id}`, "DELETE"),
  };

  // COURSES API
  static courses = {
    getAll: () => API.request(`${API_BASE_URL}/owner/courses`),
    get: (id) => API.request(`${API_BASE_URL}/owner/courses/${id}`),
    add: (data) => API.request(`${API_BASE_URL}/owner/courses`, "POST", data),
    update: (id, data) => API.request(`${API_BASE_URL}/owner/courses/${id}`, "PUT", data),
    delete: (id) => API.request(`${API_BASE_URL}/owner/courses/${id}`, "DELETE"),
  };

  // PACKAGES API
  static packages = {
    getAll: () => API.request(`${API_BASE_URL}/packages`),
    get: (id) => API.request(`${API_BASE_URL}/packages/${id}`),
    getById: (id) => API.request(`${API_BASE_URL}/packages/${id}`),
    add: (data) => API.request(`${API_BASE_URL}/packages`, "POST", data),
    update: (id, data) => API.request(`${API_BASE_URL}/packages/${id}`, "PUT", data),
    delete: (id) => API.request(`${API_BASE_URL}/packages/${id}`, "DELETE"),
  };

  // OWNER STUDENTS API
  static ownerStudents = {
    getAll: () => API.request(`${API_BASE_URL}/owner/students`),
    get: (id) => API.request(`${API_BASE_URL}/owner/students/${id}`),
    add: (data) => API.request(`${API_BASE_URL}/owner/students`, "POST", data),
    update: (id, data) => API.request(`${API_BASE_URL}/owner/students/${id}`, "PUT", data),
    delete: (id) => API.request(`${API_BASE_URL}/owner/students/${id}`, "DELETE"),
    payFees: (id, data) => API.request(`${API_BASE_URL}/owner/students/pay-fees/${id}`, "POST", data),
    payments: (id) => API.request(`${API_BASE_URL}/owner/students/${id}/payments`),
    reset: () => API.request(`${API_BASE_URL}/owner/students/reset`, "DELETE"),
  };
  // ATTENDANCE API
  static attendance = {
    getAll: () => API.request(`${API_BASE_URL}/attendance`),
    getByDate: (date) => API.request(`${API_BASE_URL}/owner/attendance?date=${date}`),
    getStudentStats: (id) => API.request(`${API_BASE_URL}/owner/attendance/student/${id}`),
    today: () => API.request(`${API_BASE_URL}/owner/attendance/today`),
    mark: (data) => API.request(`${API_BASE_URL}/owner/attendance`, "POST", data),
    stats: () => API.request(`${API_BASE_URL}/owner/attendance/stats`),
  };

  // DASHBOARD API
  static dashboard = {
    stats: () => API.request(`${API_BASE_URL}/owner/dashboard/stats`),
    enrollment: () => API.request(`${API_BASE_URL}/owner/dashboard/enrollment`),
    coursePopularity: () => API.request(`${API_BASE_URL}/owner/dashboard/course-popularity`),
    activities: () => API.request(`${API_BASE_URL}/owner/dashboard/activities`),
    classes: () => API.request(`${API_BASE_URL}/owner/dashboard/classes`),
  };

  // REPORTS API
  static reports = {
    filter: (type, year, month) => API.request(`${API_BASE_URL}/reports?type=${type}&year=${year}${month ? `&month=${month}` : ''}`),
    add: (data) => API.request(`${API_BASE_URL}/reports/add`, "POST", data),
    stats: () => API.request(`${API_BASE_URL}/reports/stats`),
    recent: (limit = 10) => API.request(`${API_BASE_URL}/reports?limit=${limit}`),
    transactions: () => API.request(`${API_BASE_URL}/reports/transactions`),
  };

  // SETTINGS API
  static settings = {
    get: () => API.request(`${API_BASE_URL}/settings`),
    update: (data) => API.request(`${API_BASE_URL}/settings`, "PUT", data),
  };
}
