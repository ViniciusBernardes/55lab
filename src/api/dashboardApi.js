import { apiRequest } from "./httpClient";

export function getDashboard() {
  return apiRequest("/api/dashboard");
}
