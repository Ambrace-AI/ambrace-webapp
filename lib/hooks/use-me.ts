"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, saveProfile } from "@/lib/api/me";
import type { Me, ProfileUpdate } from "@/types/profile";

export const ME_KEY = ["me"] as const;

/** The signed-in student and their profile. Shared by every screen. */
export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: getMe });
}

/** Saves the profile and updates every screen that shows it. */
export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: ProfileUpdate) => saveProfile(profile),
    onSuccess: (me: Me) => queryClient.setQueryData(ME_KEY, me),
  });
}
