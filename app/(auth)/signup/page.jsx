"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";

export default function SignupPage() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password)
      return setError("All fields are required.");
    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match.");
    try {
      setLoading(true);
      await signup(formData.name, formData.email, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-md p-8 shadow-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-blue-200 mt-1 text-sm">Join TaskFlow for free</p>
        </div>

        <Alert message={error} type="error" />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {[
            { label: "Full Name",        name: "name",            type: "text",     placeholder: "John Doe" },
            { label: "Email Address",    name: "email",           type: "email",    placeholder: "john@example.com" },
            { label: "Password",         name: "password",        type: "password", placeholder: "Minimum 6 characters" },
            { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Re-enter your password" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition backdrop-blur-sm"
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 mt-2 flex items-center justify-center"
          >
            {loading ? <Spinner size="sm" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-blue-300 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}