import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

export default function Component() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Detect password recovery redirect and establish a session
  useEffect(() => {
    async function handleRecovery() {
      try {
        const url = new URL(window.location.href);
        const type = url.searchParams.get("type");
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setResetMode(true);
            window.history.replaceState({}, "", url.origin + url.pathname);
            return;
          }
        }
        if (window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const access_token = hashParams.get("access_token") ?? undefined;
          const refresh_token = hashParams.get("refresh_token") ?? undefined;
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) {
              setResetMode(true);
              window.history.replaceState({}, "", url.origin + url.pathname);
              return;
            }
          }
        }
        if (type === "recovery") setResetMode(true);
      } catch (e) {
        // ignore
      }
    }
    handleRecovery();
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus("Signed in!");
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "Unable to sign in."}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetLink(e: React.MouseEvent) {
    e.preventDefault();
    setStatus(null);
    if (!email) {
      setStatus("Enter your email first.");
      return;
    }
    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setStatus("Password reset link sent. Check your email.");
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "Unable to send reset link."}`);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (newPassword.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStatus("Password updated. You can now sign in.");
      setResetMode(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "Unable to update password."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold mb-4">{resetMode ? "Reset password" : "Sign in"}</h1>
      {resetMode ? (
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            autoComplete="new-password"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            autoComplete="new-password"
          />
          <button disabled={loading} type="submit" className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black">
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            autoComplete="username"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            autoComplete="current-password"
          />
          <div className="flex items-center gap-3">
            <button disabled={loading} type="submit" className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black">
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button type="button" onClick={handleSendResetLink} className="text-sm underline opacity-90 hover:opacity-100">Forgot password?</button>
          </div>
        </form>
      )}
      {status && <p className="mt-3 text-sm opacity-80">{status}</p>}
      {!resetMode && (
        <div className="mt-6 text-sm text-muted-foreground space-y-2">
          <p>Sign-up is disabled. Ask an admin to create your account or change your password.</p>
          <p>
            Admins: In Supabase Dashboard → Authentication → Providers → Email, disable new signups. To change a user's password, open Authentication → Users → select user → Reset Password.
          </p>
        </div>
      )}
    </div>
  );
}