/**
 * FinSight — useAuth Hook
 * Authentication operations with React Query + Zustand
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiPost, apiGet, apiPatch } from "./apiClient";
import { ROUTES } from "@/utils/constants";
import toast from "react-hot-toast";
import type {
  ForgotPasswordInput,
  LoginCredentials,
  SignupCredentials,
  Profile,
  UpdateProfileInput,
} from "@/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, logout: storeLogout, user, isAuthenticated, isLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      apiPost<{ user: { id: string }; session: { access_token: string } }>(
        "/auth/login",
        credentials
      ),
    onSuccess: async (data) => {
      if (data.data) {
        const token = data.data.session.access_token;
        // First set token so isAuthenticated becomes true
        setUser(null, token);

        // Then try to fetch the full user profile
        try {
          const profileRes = await apiGet<Profile>("/auth/profile");
          if (profileRes.data) {
            setUser(profileRes.data, token);
          }
        } catch {
          // Profile fetch failed — user is still authenticated with token
        }

        toast.success("Welcome back!");
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const signupMutation = useMutation({
    mutationFn: (credentials: SignupCredentials) =>
      apiPost("/auth/signup", credentials),
    onSuccess: () => {
      toast.success("Account created! Please log in.");
      router.push(ROUTES.LOGIN);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Signup failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
      toast.success("Logged out");
      router.push(ROUTES.LOGIN);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordInput) => apiPost("/auth/forgot-password", payload),
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to send password reset email");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: UpdateProfileInput) => apiPatch<Profile>("/auth/profile", updates),
    onSuccess: (response) => {
      const token = useAuthStore.getState().accessToken;
      if (response.data) {
        setUser(response.data, token);
      }
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update profile");
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    requestPasswordReset: forgotPasswordMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
  };
}
