# Walkin’ Here! — Consolidated Product Plan

## Product vision
Build a polished, playful “Duolingo for people who just moved to New York City”: useful three-minute lessons, local recommendations, slang practice, rewards, and saved progress in a lively NYC-specific experience.

## Locked visual direction
- Use **Taxi Yellow only**: `#F5C518` for primary actions and selected states, deep ink/slate typography, white cards, and a soft near-white page background.
- Remove the Subway Line, Central Park, and Brooklyn Brownstone themes and remove the theme switcher entirely.
- Keep olive/mint for progress and success, with restrained lilac and red details for feedback and atmosphere.
- Use **Outfit** for headings, labels, buttons, and branding; use **Figtree** for body copy.
- Preserve colorful NYC photography, unique imagery per lesson and recommendation, the pigeon mascot, confetti, tactile button movement, progress animation, and reduced-motion support.
- Keep layouts spacious and legible: no crowded control clusters, nested cards, or excessive decorative motion.

## Access and accounts
- Signed-out visitors see only a responsive, full-height sign-in/sign-up experience: NYC photography and branding beside the account form on desktop, stacked on mobile.
- Support email/password and Google sign-in, email confirmation, password recovery, loading, validation, and feedback states.
- Hide lessons, Things to Do, Slang, XP, streaks, city controls, and navigation until authentication succeeds.
- Return users to the account screen after sign-out; keep password reset publicly accessible.
- Maintain private profiles with display name, avatar, XP, streak, Taxi Yellow preference, lesson progress, slang rewards, and saved/visited places.
- Merge existing local guest progress into an empty signed-in account and sync future progress across devices.

## Header and Profile menu
- Keep the Walkin’ Here! identity, pigeon mascot, NYC city selector, streak, XP, and current level in a compact header.
- Replace Account with a Profile control showing the member’s name or avatar.
- Keep the Profile menu hidden until clicked; then show identity, **View/Edit Profile**, and **Sign out**.
- Close it on outside click, Escape, or action selection, with correct keyboard and expanded-state support.
- Keep Profile out of the main navigation; only Daily Lessons, Things to Do, and Slang appear there.
- Open the existing editor only through **View/Edit Profile**, with a clear return to the prior section.

## Daily Lessons
- Keep six NYC lessons: OMNY & Subway Rules, Sidewalk Cadence, Bodega Culture, Ordering a Bagel & Coffee, Street Navigation, and Tipping Norms.
- Present them as a numbered photographic journey with duration, question count, XP, completion state, and click-to-start behavior.
- Use an interactive quiz with immediate feedback, explanations, animated question changes, progress, correct-answer celebration, and completion rewards.
- Retain Daily Mission, streak, five progression levels, XP breakdown, Slang of the Day, and Want to Go shortcuts in a compact companion area.

## Five-borough learning map
- Use a lightweight local illustrated map rather than a paid external mapping service.
- Clearly and accurately represent **Manhattan, Brooklyn, Queens, the Bronx, and Staten Island** in sensible relative positions.
- Label every borough and provide an accessible description naming all five.
- Draw the six-stop lesson route primarily through Manhattan without mislabeling geography; keep lesson markers interactive and the next stop emphasized in Taxi Yellow.
- Prevent borough and lesson labels from overlapping on desktop and mobile; state that the illustration is not to scale.

## Things to Do
- Keep 12 curated NYC recommendations across Museums & Culture, Hidden Gems, Parks & Walks, Late Night, and Free/Budget Hacks.
- Preserve category filters and rich three-column cards with unique photos, neighborhood, subway stop, cost, description, and Local Pro-Tip.
- Keep **Been There** and **Want to Go** actions, persisted bookmarks, first-visit XP rewards, and celebration feedback.

## Slang
- Keep NYC slang flashcards for Deadass, Brick, Mad, Facts/No Cap, The City, Schlep, Yerrr, Regular Coffee, Pie, Grill, and the existing extended set.
- Preserve phonetics, definitions, dialogue examples, cringe meter/warnings, category filters, search, and tap-to-flip interaction.
- Keep the Slang Challenge with immediate feedback, XP, streak credit, and confetti.

## Data and privacy
- Continue using the existing protected profile, lesson-progress, and saved-place records so each member accesses only their own information.
- Keep the server-controlled aggregate daily visit counter without IP addresses, precise location, fingerprints, advertising cookies, or direct visitor access to analytics records.
- Preserve the existing security rules, Google/email authentication settings, and unique media assignments.

## Responsive and quality requirements
- Use the wide desktop layout efficiently while stacking content clearly on phones.
- Keep every label, control, photograph, menu, map marker, and card within its container without overlap or horizontal scrolling.
- Maintain semantic headings, alt text, route metadata, visible focus styles, keyboard operation, and reduced-motion behavior.
- Verify signed-out and signed-in flows, Profile open/close/edit/sign-out behavior, password recovery, all three app sections, XP/streak updates, saved places, all five map boroughs, and desktop/mobile layouts.

## Superseded decisions
- The Park & Brick palette and Instrument Serif/Work Sans typography are removed.
- The public guest app view is removed; authentication is required before product content appears.
- Multi-theme selection is removed; Taxi Yellow is the sole visual system.
