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
  const [hoveredButton, setHoveredButton] = useState(false);
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#121212',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '48px',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            S
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#eeeeee',
            margin: 0
          }}>
            Synapse
          </h1>
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#eeeeee',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Create Account
        </h2>
        <p style={{
          color: '#888888',
          fontSize: '14px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Start managing your tasks today
        </p>

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: '#eeeeee',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}
              htmlFor="signup-name"
            >
              Name
            </label>
            <input
              type="text"
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#eeeeee',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: '#eeeeee',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}
              htmlFor="signup-email"
            >
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#eeeeee',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: '#eeeeee',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#eeeeee',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHoveredButton(true)}
            onMouseLeave={() => setHoveredButton(false)}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: hoveredButton && !loading
                ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
              boxShadow: hoveredButton && !loading ? '0 8px 16px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.2)',
              transform: hoveredButton && !loading ? 'translateY(-1px)' : 'translateY(0)'
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#888888',
            fontSize: '14px'
          }}>
            Already have an account?{" "}
            <Link
              href="/signin"
              style={{
                color: '#a5b4fc',
                fontWeight: '600',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
