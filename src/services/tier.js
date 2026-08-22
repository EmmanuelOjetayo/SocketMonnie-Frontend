import { apiClient } from "./apiClient";

export async function getMyTierInfo() {
  return apiClient.get("/tier/me");
}

export async function requestUpgrade(tier) {
  return apiClient.post("/tier/upgrade-request", { requestedTier: tier });
}

export async function getAllTiers() {
  return apiClient.get("/tier/all");
}