import type { Me, ProfileUpdate } from "@/types/profile";

import api from "./axios";

const ME_PATH = "/api/v1/me";

/** Who is signed in, and whether they still need to finish onboarding. */
export async function getMe(): Promise<Me> {
  const response = await api.get<Me>(ME_PATH);
  return response.data;
}

/** Creates the profile at onboarding, or replaces it when the student edits it. */
export async function saveProfile(profile: ProfileUpdate): Promise<Me> {
  const response = await api.put<Me>(ME_PATH, profile);
  return response.data;
}
