import apiClient from "../../lib/apiClient.js";

export function login({ tenant_slug, phone_number, password }) {
  return apiClient.post("/auth/login", { tenant_slug, phone_number, password });
}

export function register(payload) {
  return apiClient.post("/auth/register", payload);
}

export function fetchCurrentUser() {
  return apiClient.get("/auth/me");
}