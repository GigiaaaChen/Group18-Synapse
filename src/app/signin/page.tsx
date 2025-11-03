"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: "/tasks",
      });

      if (error) {
        setError(error.message ?? "Unable to sign in");
      } else {
        router.push("/tasks");
      }
    } catch (_error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Welcome Back
        </h1>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label
              className="block text-white text-sm font-medium mb-2"
              htmlFor="signin-email"
            >
              Email
            </label>
            <input
              type="email"
              id="signin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label
              className="block text-white text-sm font-medium mb-2"
              htmlFor="signin-password"
            >
              Password
            </label>
            <input
              type="password"
              id="signin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-lg hover:bg-white/30 transition duration-300 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/80">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-white font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
