import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "aoa2178@columbia.edu";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy | Walkin' Here!" },
    { name: "description", content: "What Walkin' Here! collects, why, and how to have your data deleted." },
    { property: "og:title", content: "Privacy Policy | Walkin' Here!" },
    { property: "og:description", content: "What Walkin' Here! collects, why, and how to have your data deleted." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: Privacy,
});

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "What we collect",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Account details:</strong> your email address and a display name. If you sign up with email, your password is stored only in hashed (scrambled) form, never as plain text. If you choose an avatar image link, we store that link.</li>
        <li><strong>Google sign-in:</strong> if you use “Continue with Google”, Google shares your name, email address and profile picture with us. We don’t get access to your Gmail, contacts, calendar or anything else in your Google account.</li>
        <li><strong>Your progress:</strong> lessons you’ve completed, XP, streak, the places you mark as “want to go” or “been”, and your city and theme preferences.</li>
        <li><strong>Visit counts:</strong> a single running total of visits per day, with nothing that identifies you.</li>
      </ul>
    ),
  },
  {
    heading: "How we use it",
    body: <p>Only to run the app: to sign you in, save your progress so it follows you across devices, and show your name on your profile. We don’t show ads, and we never sell or rent your information.</p>,
  },
  {
    heading: "Where it’s stored",
    body: <p>The website is hosted by <a className="underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel</a>, and your account and progress are stored in a database run by <a className="underline" href="https://neon.com/privacy-policy" target="_blank" rel="noreferrer">Neon</a>, which Vercel connects to the site. Both process data on our behalf, in the United States. Your browser keeps a sign-in cookie so you stay logged in.</p>,
  },
  {
    heading: "Deleting your data",
    body: <p>You can sign out at any time. To delete your account and everything linked to it, email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you signed up with, and we’ll remove it within 30 days.</p>,
  },
  {
    heading: "Children",
    body: <p>Walkin’ Here! isn’t directed at children under 13, and we don’t knowingly collect their information.</p>,
  },
  {
    heading: "Changes and contact",
    body: <p>If this policy changes, we’ll update the date below. Questions? Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>,
  },
];

function Privacy() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <article className="mx-auto max-w-2xl border-t-4 border-primary bg-surface p-8 shadow-xl sm:p-12">
        <p className="atlas-kicker">Walkin' Here!</p>
        <h1 className="mt-2 text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated September 23, 2026</p>
        <p className="mt-6 leading-7">Walkin’ Here! is a small app for learning New York City in three minutes a day. This page explains what information it keeps about you and what you can do about it.</p>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-2xl font-bold">{section.heading}</h2>
            <div className="mt-3 leading-7 text-foreground/90">{section.body}</div>
          </section>
        ))}
        <Button asChild variant="link" className="mt-10 px-0"><Link to="/">Return home</Link></Button>
      </article>
    </main>
  );
}
