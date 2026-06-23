// Thin fetch wrapper. Token is read from memory (set by AuthContext) + localStorage.
const TOKEN_KEY = "hrms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new URLSearchParams(form).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // auth
  login: (email, password) =>
    request("/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request("/auth/me"),

  // departments
  listDepartments: () => request("/departments"),
  createDepartment: (b) => request("/departments", { method: "POST", body: b }),
  updateDepartment: (id, b) => request(`/departments/${id}`, { method: "PUT", body: b }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: "DELETE" }),

  // employees
  listEmployees: (q = "") => request(`/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createEmployee: (b) => request("/employees", { method: "POST", body: b }),
  updateEmployee: (id, b) => request(`/employees/${id}`, { method: "PUT", body: b }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: "DELETE" }),

  // attendance
  checkIn: () => request("/attendance/check-in", { method: "POST" }),
  checkOut: () => request("/attendance/check-out", { method: "POST" }),
  myAttendance: () => request("/attendance/me"),
  allAttendance: (d = "") => request(`/attendance${d ? `?work_date=${d}` : ""}`),

  // leaves
  requestLeave: (b) => request("/leaves", { method: "POST", body: b }),
  myLeaves: () => request("/leaves/me"),
  allLeaves: () => request("/leaves"),
  reviewLeave: (id, status) =>
    request(`/leaves/${id}/review`, { method: "PATCH", body: { status } }),

  // payroll
  generatePayslip: (b) => request("/payroll", { method: "POST", body: b }),
  myPayslips: () => request("/payroll/me"),
  allPayslips: () => request("/payroll"),
};
