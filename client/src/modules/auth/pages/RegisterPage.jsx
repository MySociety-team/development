import { useState } from "react";

import { useNavigate } from "react-router";

import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../hooks/useAuth.js";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  mobileNumber: ""
};

function RegisterPage() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined
    }));

    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      nextErrors.name = "Name is required.";
    } else if (name.length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 4) {
      nextErrors.password = "Password must contain at least 4 characters.";
    }

    if (form.mobileNumber.trim() && !/^\+?[1-9]\d{7,14}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Enter a valid mobile number.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      };

      if (form.mobileNumber.trim()) {
        payload.mobileNumber = form.mobileNumber.trim();
      }

      await register(payload);

      navigate("/societies", {
        replace: true
      });
    } catch (error) {
      const code = error.response?.data?.code;

      if (code === "EMAIL_ALREADY_EXISTS") {
        setErrors((current) => ({
          ...current,
          email: "An account with this email already exists."
        }));
      } else {
        setApiError(
          error.response?.data?.message ?? "Unable to create your account. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Register to access your society."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="mobileNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
            Mobile number <span className="font-normal text-slate-400">(optional)</span>
          </label>

          <input
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            autoComplete="tel"
            value={form.mobileNumber}
            onChange={handleChange}
            placeholder="+919876543210"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />

          {errors.mobileNumber && (
            <p className="mt-1.5 text-sm text-red-600">{errors.mobileNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 4 characters"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
