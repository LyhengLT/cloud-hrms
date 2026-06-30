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

// Authenticated file download (sends the Bearer token, then saves the blob)
async function download(path, fallbackName) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Download failed (${res.status})`);
  }
  // Try to read filename from the Content-Disposition header
  let name = fallbackName;
  const cd = res.headers.get("Content-Disposition");
  const m = cd && cd.match(/filename="?([^"]+)"?/);
  if (m) name = m[1];

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  // auth
  login: (email, password) =>
    request("/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request("/auth/me"),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, new_password) =>
    request("/auth/reset-password", { method: "POST", body: { token, new_password } }),

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

  // stats (admin reports)
  stats: () => request("/stats"),

  // payroll
  generatePayslip: (b) => request("/payroll", { method: "POST", body: b }),
  payslipPdf: (id) => download(`/payroll/${id}/pdf`, `payslip-${id}.pdf`),
  exportPayrollExcel: () => download("/payroll/export/excel", "payroll.xlsx"),
  myPayslips: () => request("/payroll/me"),
  allPayslips: () => request("/payroll"),
};
