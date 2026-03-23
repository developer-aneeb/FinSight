import Link from "next/link";
import { ROUTES } from "@/utils/constants";
import {
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  PiggyBank,
  Target,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
        <span className="text-2xl font-bold text-brand-700">FinSight</span>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-gray-600 hover:text-brand-600 transition"
          >
            Sign In
          </Link>
          <Link
            href={ROUTES.SIGNUP}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-brand-100">
          <Zap size={14} />
          AI-Powered Finance for Pakistan
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          Take Control of Your{" "}
          <span className="text-brand-600">Finances</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Track every rupee, set smart budgets, and get AI-driven insights —
          all built for the Pakistani financial landscape with PKR support.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={ROUTES.SIGNUP}
            className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-200"
          >
            Start Free
          </Link>
          <Link
            href={ROUTES.LOGIN}
            className="text-gray-600 px-6 py-3 rounded-lg font-medium hover:text-brand-600 transition"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <TrendingUp size={24} />,
              title: "Transaction Tracking",
              description:
                "Log income and expenses with categories, tags, and receipt uploads. Search and filter effortlessly.",
            },
            {
              icon: <Target size={24} />,
              title: "Smart Budgets",
              description:
                "Set weekly, monthly, or yearly spending limits per category and receive alerts as you approach them.",
            },
            {
              icon: <BarChart3 size={24} />,
              title: "Visual Analytics",
              description:
                "Interactive charts showing spending trends, category breakdowns, and savings rate over time.",
            },
            {
              icon: <PiggyBank size={24} />,
              title: "Savings Insights",
              description:
                "See exactly how much you save each month and track your progress toward financial goals.",
            },
            {
              icon: <Zap size={24} />,
              title: "AI Insights",
              description:
                "Get intelligent recommendations based on your spending patterns to optimize your finances.",
            },
            {
              icon: <Shield size={24} />,
              title: "Secure & Private",
              description:
                "Row-level security ensures your data is only visible to you. Built on enterprise-grade Supabase.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto text-center px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to take control?
        </h2>
        <p className="text-gray-500 mb-8">
          Join thousands managing their finances smarter with FinSight.
        </p>
        <Link
          href={ROUTES.SIGNUP}
          className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-200"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} FinSight. Built for Pakistan 🇵🇰
      </footer>
    </div>
  );
}
