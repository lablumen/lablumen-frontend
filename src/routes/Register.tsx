import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StepIndicator } from "@/components/ui/step-indicator";
import { confirmSignUp, resendConfirmationCode, signUp } from "@/lib/cognito";
import { Eye, EyeOff, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STEPS = [
  { id: 1, label: "Account details" },
  { id: 2, label: "Verify email" },
];

export function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Step 2 fields
  const [code, setCode] = useState("");

  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // --- client-side validation (Step 1 only) ---
  function validateStep1(): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  // --- Step 1: create account ---
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const clientError = validateStep1();
    if (clientError) { setError(clientError); return; }

    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Step 2: confirm email ---
  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
      navigate("/login?registered=true", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- resend code ---
  async function handleResend() {
    setResendSent(false);
    try {
      await resendConfirmationCode(email.trim());
      setResendSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-700 to-primary p-12 lg:flex lg:w-[45%]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">LabLumen</span>
        </div>

        <div>
          <blockquote className="text-3xl font-semibold leading-snug text-white">
            "Your health story, clearly told."
          </blockquote>
          <p className="mt-4 text-sm text-white/60">
            Create a free account to book lab tests, track your results, and get AI-powered health insights.
          </p>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} LabLumen. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-dark">LabLumen</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark">Create your account</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              {step === 1
                ? "Enter your details to get started."
                : `We sent a 6-digit code to ${email}. Enter it below to confirm your account.`}
            </p>
          </div>

          <StepIndicator steps={STEPS} current={step} className="mb-8" />

          {/* ── Step 1: account details ── */}
          {step === 1 && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-text-dark transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-text-dark transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-danger/20 bg-danger-50 px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
              >
                {submitting && <Spinner size="sm" className="text-white" />}
                {submitting ? "Creating account…" : "Create account"}
              </button>

              <p className="text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: verify email ── */}
          {step === 2 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="code">
                  Verification code
                </label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-lg border border-danger/20 bg-danger-50 px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {resendSent && (
                <p className="text-sm text-success">A new code has been sent to your email.</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
              >
                {submitting && <Spinner size="sm" className="text-white" />}
                {submitting ? "Verifying…" : "Verify email"}
              </button>

              <p className="text-center text-sm text-text-muted">
                Didn't receive a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-primary hover:underline"
                >
                  Resend
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
