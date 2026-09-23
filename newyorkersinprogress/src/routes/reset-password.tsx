import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset Password | Walkin' Here!" },
    { name: "description", content: "Set a new password for your Walkin' Here! account." },
    { property: "og:title", content: "Reset Password | Walkin' Here!" },
    { property: "og:description", content: "Set a new password and return to learning New York City." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Checking your recovery link…");
  useEffect(() => {
    const recovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      const valid = recovery || Boolean(data.session);
      setReady(valid);
      setMessage(valid ? "Choose a strong new password." : "This recovery link is invalid or expired.");
    });
  }, []);
  return <main className="grid min-h-screen place-items-center bg-background px-6"><section className="w-full max-w-md border-t-4 border-primary bg-surface p-8 shadow-xl"><p className="atlas-kicker">Account recovery</p><h1 className="mt-2 text-4xl">Reset your password</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p>{ready && <form className="mt-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password }); setMessage(error?.message ?? "Password updated. You can return to the atlas."); }}><div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} maxLength={72} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" /></div><Button className="w-full">Set new password</Button></form>}<Button asChild variant="link" className="mt-4 px-0"><Link to="/">Return home</Link></Button></section></main>;
}