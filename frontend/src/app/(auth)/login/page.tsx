"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ROUTES } from "@/utils/constants";
import { loginSchema } from "@/utils/validation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoginLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    router.prefetch(ROUTES.DASHBOARD);
    router.prefetch(ROUTES.ADMIN);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email") {
          nextErrors.email = issue.message;
        }
        if (field === "password") {
          nextErrors.password = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    login(parsed.data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100">
      <SiteHeader />
      <main className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-700">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to continue managing your finances
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoginLoading}
            >
              <LogIn size={18} className="mr-2" />
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-right">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-brand-600 font-medium hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.SIGNUP}
              className="text-brand-600 font-medium hover:text-brand-700"
            >
              Sign Up
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter compact />
    </div>
  );
}
