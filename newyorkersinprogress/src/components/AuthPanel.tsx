import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { authClient, type AuthUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HERO_IMAGE } from "@/lib/images";
import { LESSONS, type Lesson } from "@/lib/curriculum";

export function AuthPanel({
  user,
  onSignedOut,
  onTryLesson,
  trialXp,
}: {
  user: AuthUser | null;
  onSignedOut: () => void;
  /** Signed out: play lesson 1 without an account */
  onTryLesson?: (lesson: Lesson) => void;
  /** Signed out: XP earned in the free lesson, shown as a nudge to sign up */
  trialXp?: number | undefined;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name ?? "");
    setAvatarUrl(user.image ?? "");
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } =
      mode === "signup"
        ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() })
        : await authClient.signIn.email({ email: email.trim(), password });
    setMessage(error ? error.message ?? "Something went wrong. Please try again." : mode === "signup" ? "Welcome to the neighborhood." : "Signed in. Your progress is ready.");
    setBusy(false);
  }

  async function google() {
    setBusy(true);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (error) {
      setMessage(error.message ?? "Google sign-in isn't available right now.");
      setBusy(false);
    }
  }

  if (user) {
    const display = user.name || user.email;
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="atlas-kicker">Your borough desk</p>
        <h1 className="mt-3 text-5xl">Good to see you, {display}.</h1>
        <div className="mt-10 border-y border-border py-8">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 text-lg font-semibold">{user.email}</p>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">Your XP, streak, completed lessons, theme, and saved places now follow you across devices.</p>
          <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const { error } = await authClient.updateUser({ name: profileName.trim(), image: avatarUrl.trim() || null }); setMessage(error ? error.message ?? "Couldn't save your profile." : "Profile saved."); setBusy(false); }}>
            <div><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={80} required className="mt-1.5" /></div>
            <div><Label htmlFor="avatar-url">Avatar image URL</Label><Input id="avatar-url" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={500} className="mt-1.5" /></div>
            <div className="flex items-center gap-3 sm:col-span-2"><Button disabled={busy}>Save profile</Button><Button type="button" variant="outline" onClick={async () => { await authClient.signOut(); onSignedOut(); }}>Sign out</Button></div>
          </form>
          {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </div>
      </section>
    );
  }

  const minutes = LESSONS.reduce((n, l) => n + l.minutes, 0);
  const free = LESSONS[0]!;

  return (
    <section className="grid min-h-screen bg-surface lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-[390px] overflow-hidden lg:min-h-screen">
        <img src={HERO_IMAGE} alt="A bright Manhattan street filled with New York energy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-transparent" />
        <div className="absolute left-0 top-0 flex h-3 w-full" aria-hidden><span className="flex-1 bg-primary" /><span className="flex-1 bg-mint" /><span className="flex-1 bg-lilac" /><span className="flex-1 bg-destructive" /></div>
        <div className="relative flex h-full min-h-[390px] flex-col justify-between p-7 text-primary-foreground sm:p-12 lg:min-h-screen lg:p-14">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-lg">W</span>
            <span className="nc-mascot grid size-12 place-items-center rounded-2xl bg-surface text-2xl shadow-lg" title="Toki">🐦</span>
            <div><p className="font-display text-xl font-bold text-surface">Walkin' Here!</p><p className="text-xs font-semibold text-surface/80">Learn NYC in 3 minutes a day</p></div>
          </div>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-primary-foreground shadow-lg">Now serving · New York City</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] text-surface sm:text-6xl">Move like you’ve lived here for years.</h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-surface/85 sm:text-lg">Master subway etiquette, bodega orders, sidewalk pace, slang, and the city’s unwritten rules.</p>
          </div>
        </div>
      </div>

      {/* The course, open to look at; lesson 1 is free to play without an account. */}
      <div className="nyc-glow px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">The course</p>
              <h2 className="mt-1 text-3xl font-extrabold text-foreground">
                {LESSONS.length} lessons, {minutes} minutes
              </h2>
            </div>
            {onTryLesson && (
              <Button type="button" className="h-11 font-extrabold shadow-[0_4px_0_color-mix(in_oklab,var(--foreground)_55%,transparent)]" onClick={() => onTryLesson(free)}>
                ▶ Try lesson 1 free
              </Button>
            )}
          </div>
          {trialXp !== undefined && (
            <p role="status" className="mt-4 rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm font-semibold text-foreground">
              Nice: {trialXp} XP from {free.title}. Create an account below to keep it and start your streak.
            </p>
          )}
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {LESSONS.map((lesson, i) => (
              <li key={lesson.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5">
                <span className="text-xl" aria-hidden>{lesson.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight text-foreground">{lesson.title}</span>
                  <span className="block text-xs text-muted-foreground">{lesson.minutes} min</span>
                </span>
                {i === 0 ? <span className="text-xs font-bold text-mint">Free</span> : <span className="text-xs text-muted-foreground" aria-label="Sign up to unlock">🔒</span>}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_70px_color-mix(in_oklab,var(--foreground)_10%,transparent)] sm:p-7">
            <p className="text-sm font-bold text-primary">Your city streak starts here</p>
            <h3 className="mt-1 text-2xl font-extrabold text-foreground">Save your progress and streak.</h3>
            <div className="grid grid-cols-2 border-b border-border">
              {(["signup", "signin"] as const).map((item) => (
                <Button key={item} type="button" variant="ghost" onClick={() => { setMode(item); setMessage(""); }} className={`mt-4 rounded-none border-b-4 ${mode === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
                  {item === "signin" ? "Sign in" : "Sign up"}
                </Button>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-5 h-11 w-full bg-surface font-bold" onClick={google} disabled={busy}>Continue with Google</Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" /></div>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              {mode === "signup" && <div className="sm:col-span-2"><Label htmlFor="name">Display name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-1.5" /></div>}
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="mt-1.5" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required className="mt-1.5" /></div>
              <Button className="h-12 w-full font-extrabold shadow-[0_4px_0_color-mix(in_oklab,var(--foreground)_55%,transparent)] sm:col-span-2" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
            </form>
            {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">How we handle your data: <Link to="/privacy" className="underline">Privacy Policy</Link></p>
          </div>
        </div>
      </div>
    </section>
  );
}
