"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/tasks",
      });

      if (error) {
        setError(error.message ?? "Unable to sign up");
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
          Create Account
        </h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label
              className="block text-white text-sm font-medium mb-2"
              htmlFor="signup-name"
            >
              Name
            </label>
            <input
              type="text"
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label
              className="block text-white text-sm font-medium mb-2"
              htmlFor="signup-email"
            >
              Email
            </label>
            <input
              type="email"
              id="signup-email"
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
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your password (min 8 characters)"
              minLength={8}
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/80">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-white font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
