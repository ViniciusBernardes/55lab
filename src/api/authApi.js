import { apiRequest } from "./httpClient";

export function getCurrentUser() {
  return apiRequest("/api/user");
}

export function login(email, password) {
  return apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiRequest("/api/logout", { method: "POST" });
}
