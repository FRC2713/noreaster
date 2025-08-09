import { useState } from "react";
import { supabase } from "../supabase/client";

export default function Component() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
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
        <button disabled={loading} type="submit" className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {status && <p className="mt-3 text-sm opacity-80">{status}</p>}
      <div className="mt-6 text-sm text-muted-foreground space-y-2">
        <p>Sign-up is disabled. Ask an admin to create your account or change your password.</p>
        <p>
          Admins: In Supabase Dashboard → Authentication → Providers → Email, disable new signups. To change a user's password, open Authentication → Users → select user → Reset Password.
        </p>
      </div>
    </div>
  );
}