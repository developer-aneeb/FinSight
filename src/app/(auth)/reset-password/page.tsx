"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ROUTES } from "@/utils/constants";
import { resetPasswordSchema } from "@/utils/validation";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const tokenType = hashParams.get("token_type");
    const flowType = hashParams.get("type");

    if (accessToken && tokenType?.toLowerCase() === "bearer" && flowType === "recovery") {
      setResetToken(accessToken);
      setIsPreparing(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    setErrors({ general: "Invalid or expired reset link. Please request a new password reset email." });
    setIsPreparing(false);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const nextErrors: { password?: string; confirmPassword?: string; general?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "password") {
          nextErrors.password = issue.message;
        }
        if (issue.path[0] === "confirmPassword") {
          nextErrors.confirmPassword = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    if (!resetToken) {
      setErrors({ general: "Reset session is missing. Please open the reset link again." });
      return;
    }

    if (!apiBase) {
      setErrors({ general: "API URL is not configured. Please set NEXT_PUBLIC_API_URL." });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const response = await fetch(`${apiBase}/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resetToken}`,
        },
        body: JSON.stringify({ password: parsed.data.password }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || body?.message || "Unable to reset password");
      }

      toast.success("Password updated successfully. Please sign in.");
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "Unable to reset password" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100">
      <SiteHeader />
      <main className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-700">Reset Your Password</h1>
            <p className="text-gray-500 text-sm mt-1">Set a new password for your account.</p>
          </div>

          {isPreparing ? (
            <p className="text-sm text-gray-500 text-center">Preparing secure reset session...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

              <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!resetToken}>
                <KeyRound size={18} className="mr-2" />
                Update Password
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Back to {" "}
            <Link href={ROUTES.LOGIN} className="text-brand-600 font-medium hover:text-brand-700">
              Sign In
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter compact />
    </div>
  );
}
