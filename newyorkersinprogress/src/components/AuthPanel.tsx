import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HERO_IMAGE } from "@/lib/images";

export function AuthPanel({ user, onSignedOut }: { user: User | null; onSignedOut: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfileName(data?.display_name || user.user_metadata?.["display_name"] || "");
      setAvatarUrl(data?.avatar_url || user.user_metadata?.["avatar_url"] || "");
    });
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
      });
      setMessage(error?.message ?? (data.session ? "Welcome to the neighborhood." : "Check your email to confirm your account."));
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setMessage(error?.message ?? "Signed in. Your progress is ready.");
    }
    setBusy(false);
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setMessage(result.error.message);
    setBusy(false);
  }

  async function resetPassword() {
    if (!email.trim()) return setMessage("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error?.message ?? "Password reset link sent.");
  }

  if (user) {
    const display = user.user_metadata?.["display_name"] || user.user_metadata?.["full_name"] || user.email;
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="atlas-kicker">Your borough desk</p>
        <h1 className="mt-3 text-5xl">Good to see you, {display}.</h1>
        <div className="mt-10 border-y border-border py-8">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 text-lg font-semibold">{user.email}</p>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">Your XP, streak, completed lessons, theme, and saved places now follow you across devices.</p>
          <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const { error } = await supabase.from("profiles").update({ display_name: profileName.trim(), avatar_url: avatarUrl.trim() || null }).eq("id", user.id); setMessage(error?.message ?? "Profile saved."); setBusy(false); }}>
            <div><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={80} required className="mt-1.5" /></div>
            <div><Label htmlFor="avatar-url">Avatar image URL</Label><Input id="avatar-url" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={500} className="mt-1.5" /></div>
            <div className="flex items-center gap-3 sm:col-span-2"><Button disabled={busy}>Save profile</Button><Button type="button" variant="outline" onClick={async () => { await supabase.auth.signOut(); onSignedOut(); }}>Sign out</Button></div>
          </form>
          {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="grid min-h-screen bg-surface lg:grid-cols-[1.08fr_0.92fr]">
      <div className="relative min-h-[390px] overflow-hidden lg:min-h-screen">
        <img src={HERO_IMAGE} alt="A bright Manhattan street filled with New York energy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-transparent" />
        <div className="absolute left-0 top-0 flex h-3 w-full" aria-hidden><span className="flex-1 bg-primary" /><span className="flex-1 bg-mint" /><span className="flex-1 bg-lilac" /><span className="flex-1 bg-destructive" /></div>
        <div className="relative flex h-full min-h-[390px] flex-col justify-between p-7 text-primary-foreground sm:p-12 lg:min-h-screen lg:p-16">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-lg">W</span>
            <span className="nc-mascot grid size-12 place-items-center rounded-2xl bg-surface text-2xl shadow-lg" title="Pete the Pigeon">🐦</span>
            <div><p className="font-display text-xl font-bold text-surface">Walkin' Here!</p><p className="text-xs font-semibold text-surface/80">Learn NYC in 3 minutes a day</p></div>
          </div>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-primary-foreground shadow-lg">Now serving · New York City</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] text-surface sm:text-6xl lg:text-7xl">Move like you’ve lived here for years.</h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-surface/85 sm:text-lg">Master subway etiquette, bodega orders, sidewalk pace, slang, and the city’s unwritten rules.</p>
          </div>
        </div>
      </div>
      <div className="nyc-glow flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
       <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_70px_color-mix(in_oklab,var(--foreground)_12%,transparent)] sm:p-9">
        <p className="text-sm font-bold text-primary">Your city streak starts here</p>
        <h2 className="mt-2 text-3xl font-extrabold text-foreground">Welcome to New York.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to continue, or make an account and start your first three-minute lesson.</p>
        <div className="grid grid-cols-2 border-b border-border">
          {(["signin", "signup"] as const).map((item) => (
            <Button key={item} type="button" variant="ghost" onClick={() => { setMode(item); setMessage(""); }} className={`mt-5 rounded-none border-b-4 ${mode === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
              {item === "signin" ? "Sign in" : "Sign up"}
            </Button>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-6 h-11 w-full bg-surface font-bold" onClick={google} disabled={busy}>Continue with Google</Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <div><Label htmlFor="name">Display name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-1.5" /></div>}
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="mt-1.5" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required className="mt-1.5" /></div>
          <Button className="h-12 w-full font-extrabold shadow-[0_4px_0_color-mix(in_oklab,var(--foreground)_55%,transparent)]" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        {mode === "signin" && <Button type="button" variant="link" className="mt-3 h-auto p-0 text-xs" onClick={resetPassword}>Forgot password?</Button>}
        {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
       </div>
      </div>
    </section>
  );
}