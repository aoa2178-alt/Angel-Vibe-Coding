// Pre-written sample drafts and answers for demo mode (no API key configured).
window.DEMO_SAMPLES = [
  {
    id: "release",
    label: "Release note",
    examples:
`Schedule reports to send themselves

You can now set any saved report to email itself on a schedule, so your team gets the numbers without anyone having to remember to pull them.

What's new
- **Recurring delivery**: Choose daily, weekly, or monthly, and pick the send time in your own time zone.
- **Multiple recipients**: Add up to 20 addresses, including people outside your workspace.
- **PDF or CSV**: Send a formatted PDF for readers, or a CSV for anyone who wants to work with the data.

Available today on Team and Business plans.`,
    draft:
`ok so this sprint we (platform team) finally shipped the bulk edit thing, JIRA PLAT-2231. basically you can now select multiple tasks in list view with shift-click or the checkboxes and change assignee, due date, status or labels for all of them at once!! previously you had to open each task one at a time which people complained about a lot in the NPS survey. we also added undo (ctrl+z or the toast button) for 10 seconds after a bulk change since that was a big risk. max 500 tasks per edit for perf reasons. its behind the bulk_edit_v2 flag, rolling to 10% today then everyone by end of month. works on all plans except Free.`,
    rewrite:
`Update many tasks at once with bulk edit

You can now select a group of tasks and change them all in one step, instead of opening each task individually. Clean-ups that used to take an afternoon now take a few clicks.

What's new
- **Multi-select in list view**: Tick the checkboxes or Shift-click to select up to 500 tasks.
- **Edit what matters**: Change the assignee, due date, status, or labels for every selected task together.
- **Easy undo**: Changed your mind? Press Ctrl+Z or select Undo in the confirmation message within 10 seconds.

Available on all paid plans. Rolling out gradually, and it will reach every workspace by the end of the month.`,
    broken_guidelines: [
      { guideline: "Lead with the reader's outcome, not the feature.", phrase: "we (platform team) finally shipped the bulk edit thing" },
      { guideline: "Use the reader's own words: don't explain what they already know, and don't use jargon they don't.", phrase: "JIRA PLAT-2231" },
      { guideline: `Be confident, not hyped: no absolutes ("every", "all", "guaranteed"), and at most one exclamation mark per page.`, phrase: "all of them at once!!" },
      { guideline: "Keep sentences under 20 words, one idea each. Paired contrasts work well for headlines.", phrase: "previously you had to open each task one at a time which people complained about a lot in the NPS survey" },
      { guideline: "Use the reader's own words: don't explain what they already know, and don't use jargon they don't.", phrase: "behind the bulk_edit_v2 flag" }
    ],
    changes: [
      { before: "ok so this sprint we (platform team) finally shipped the bulk edit thing", after: "Update many tasks at once with bulk edit", reason: "Leads with what customers can do, not who built it." },
      { before: "JIRA PLAT-2231", after: "", reason: "Ticket numbers mean nothing to customers." },
      { before: "for all of them at once!!", after: "for every selected task together", reason: "Drops the double exclamation mark and keeps the tone calm." },
      { before: "its behind the bulk_edit_v2 flag, rolling to 10% today", after: "Rolling out gradually", reason: "Swaps internal rollout details for what customers will notice." },
      { before: "works on all plans except Free", after: "Available on all paid plans", reason: "Says who gets it, not who doesn't." }
    ],
    variants: {
      short:
`Bulk edit is here

Select up to 500 tasks in list view and change their assignee, due date, status, or labels in one step. Changed your mind? Undo within 10 seconds.

On all paid plans, reaching every workspace by the end of the month.`,
      punchy:
`Stop editing tasks one by one.

Select up to 500. Change them all at once. Assignee, due date, status, labels: done.

Made a mistake? Undo it in 10 seconds.

Coming to every paid workspace by the end of the month.`,
      formal:
`Introducing bulk edit

You can now update multiple tasks simultaneously from list view. Select up to 500 tasks, then change the assignee, due date, status, or labels for all of them in a single action. Changes can be reversed within 10 seconds using Ctrl+Z or the Undo option.

Bulk edit is available on all paid plans and will be enabled for every workspace by the end of the month.`
    }
  },
  {
    id: "support",
    label: "Support reply",
    examples:
`Hi Marcus,

That's frustrating: you set up the export and got an empty file back. I looked at your account and found what happened: the export ran before last night's sync had finished, so there was nothing to include yet.

Here's how to get your data:
1. Go to Settings → Exports.
2. Select "Run again" next to Tuesday's export.

If the file still comes back empty, just reply here and I'll pull it for you myself.

Priya`,
    draft:
`Hello Mr. Okafor,

We apologize for any inconvenience. Per our records you did not verify your email address, which is why you are not receiving the password reset emails. This is stated in our onboarding guide. Also the engineering team made a change last week to the email provider which may have caused delays but that is outside of support's control.

To resolve please log in with google sign in, go to account settings, and click resend verification. Then try the password reset again. If it still doesnt work you can open a new ticket.

Best regards,
Priya Sharma
Customer Support Team`,
    rewrite:
`Hi Emeka,

I'm sorry you've been stuck waiting on a password reset email that never arrives. I checked your account, and your email address hasn't been verified yet, so reset emails aren't being sent to it. Some emails were also delayed last week while we switched email providers, which may have made this harder to spot.

Here's how to get back in:
1. Sign in with the "Continue with Google" button.
2. Go to Account settings and select "Resend verification".
3. Click the link in the verification email, then request the password reset again.

I'll keep an eye on your account for the next 24 hours to make sure the emails come through. If anything still doesn't arrive, reply here and I'll reset it for you directly.

Priya`,
    broken_guidelines: [
      { guideline: `Keep it conversational, not formal: use contractions and everyday words, and cut stiff phrases like "per our records" or "please be advised".`, phrase: "We apologize for any inconvenience." },
      { guideline: `Keep it conversational, not formal: use contractions and everyday words, and cut stiff phrases like "per our records" or "please be advised".`, phrase: "Per our records" },
      { guideline: "Error messages say what happened, why, and how to fix it, without blaming the reader.", phrase: "This is stated in our onboarding guide." },
      { guideline: "Keep sentences under 20 words, one idea each. Paired contrasts work well for headlines.", phrase: "Also the engineering team made a change last week to the email provider which may have caused delays but that is outside of support's control." }
    ],
    changes: [
      { before: "We apologize for any inconvenience.", after: "I'm sorry you've been stuck waiting on a password reset email that never arrives.", reason: "Names the actual problem instead of a stock apology." },
      { before: "Per our records you did not verify your email address", after: "your email address hasn't been verified yet", reason: "States the cause without pointing a finger." },
      { before: "This is stated in our onboarding guide.", after: "", reason: "Removed because it reads as blaming the customer." },
      { before: "that is outside of support's control", after: "which may have made this harder to spot", reason: "Owns the delay instead of blaming another team." },
      { before: "you can open a new ticket", after: "reply here and I'll reset it for you directly", reason: "Offers a direct next step instead of starting over." }
    ],
    variants: {
      short:
`Hi Emeka,

Sorry about the missing reset emails. Your email address isn't verified yet, so they aren't being sent.

Sign in with Google, go to Account settings, and select "Resend verification". Then request the reset again.

Still stuck? Reply here and I'll reset it for you.

Priya`,
      punchy:
`Hi Emeka,

Found it. Your email isn't verified yet, so reset emails can't reach you.

Here's the fix:
1. Sign in with Google.
2. Account settings → "Resend verification".
3. Click the link, then reset your password.

Not working? Reply and I'll do it for you.

Priya`,
      formal:
`Dear Mr. Okafor,

Thank you for contacting us about the password reset emails. Your email address has not yet been verified, which prevents reset emails from being delivered. Some emails were also delayed last week during a change of email provider.

To restore access, please sign in using Google, open Account settings, and select "Resend verification". Once you have confirmed your address, you can request a new password reset.

If the emails still do not arrive, please reply to this message and I will reset your password directly.

Kind regards,
Priya Sharma`
    }
  },
  {
    id: "update",
    label: "Team update",
    examples:
`Status: At risk
Data warehouse migration will likely slip from May 30 to June 6.

Progress
- 38 of 52 pipelines migrated and validated.

Risks
- Finance dashboards depend on 6 pipelines with undocumented logic. Owner: Aisha. Mitigation: pairing with Finance analysts this week to document them.

Asks
- Approve 2 extra contractor weeks ($9k) to cover the remaining validation.`,
    draft:
`Hi all, just wanted to share a quick update on the mobile onboarding project. As you know we've been working hard on this for a while. Good progress this week — the new signup flow is basically done and design signed off on it on Tuesday. We got through most of the QA tickets (I think 23 out of 30ish). Android is a bit behind iOS because Sam was out sick for a few days. The big thing is that we still haven't heard back from legal on the new consent screen text, and we can't submit to the app stores without it, which could push us past the March 18 launch. It would really help if someone could nudge legal. Otherwise things are looking pretty good and the team is feeling positive!`,
    rewrite:
`Status: At risk
Mobile onboarding may miss the March 18 launch: app store submission is blocked on legal approval of the consent screen text.

Progress
- New signup flow complete; design signed off on Tuesday.
- 23 of 30 QA tickets closed.
- Android is a few days behind iOS after an unplanned team absence.

Risks
- Legal hasn't approved the consent screen text, and we can't submit to the app stores without it. Owner: project lead. Mitigation: escalating to legal this week; the flow is ready to submit as soon as the text is approved.

Asks
- Help getting a response from legal on the consent screen text by the end of this week.`,
    broken_guidelines: [
      { guideline: "Lead with the reader's outcome, not the feature.", phrase: "just wanted to share a quick update on the mobile onboarding project" },
      { guideline: "Use the reader's own words: don't explain what they already know, and don't use jargon they don't.", phrase: "As you know we've been working hard on this for a while." },
      { guideline: `Be specific: use numbers instead of adjectives, and name real customers instead of "teams everywhere".`, phrase: "Good progress this week" },
      { guideline: "Keep sentences under 20 words, one idea each. Paired contrasts work well for headlines.", phrase: "The big thing is that we still haven't heard back from legal on the new consent screen text, and we can't submit to the app stores without it, which could push us past the March 18 launch." }
    ],
    changes: [
      { before: "Hi all, just wanted to share a quick update on the mobile onboarding project.", after: "Status: At risk", reason: "Opens with the status leaders scan for first." },
      { before: "As you know we've been working hard on this for a while.", after: "", reason: "Cut because it tells readers what they already know." },
      { before: "We got through most of the QA tickets (I think 23 out of 30ish).", after: "23 of 30 QA tickets closed.", reason: "States the number plainly instead of hedging." },
      { before: "because Sam was out sick for a few days", after: "after an unplanned team absence", reason: "Keeps a teammate's health out of a leadership update." },
      { before: "It would really help if someone could nudge legal.", after: "Help getting a response from legal on the consent screen text by the end of this week.", reason: "Turns a vague hope into a specific ask with a deadline." }
    ],
    variants: {
      short:
`Status: At risk
The March 18 launch is blocked on legal approval of the consent screen text.

- Signup flow done and signed off.
- 23 of 30 QA tickets closed.

Ask: help getting legal's answer this week.`,
      punchy:
`Status: At risk
We're one legal sign-off away from launch.

Signup flow: done. QA: 23 of 30. Android: a few days behind.

No consent text, no app store submission. No submission, no March 18.

Ask: get us an answer from legal this week.`,
      formal:
`Status: At risk
The mobile onboarding launch planned for March 18 may be delayed, as app store submission requires legal approval of the consent screen text.

Progress
- The new signup flow is complete and received design approval on Tuesday.
- 23 of 30 QA tickets have been resolved.
- Android development is several days behind iOS due to an unplanned absence.

Risks
- Legal has not yet approved the consent screen text. Owner: project lead. Mitigation: the flow is ready for submission as soon as approval is received.

Asks
- Support in obtaining a response from legal by the end of this week.`
    }
  }
];
