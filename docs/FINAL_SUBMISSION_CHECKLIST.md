# Final Build Week submission checklist

Verified against the [official rules](https://openai.devpost.com/rules), [official FAQ](https://openai.devpost.com/details/faqs), and [Build Week page](https://openai.com/build-week/) on July 18, 2026.

**Hard deadline:** July 21, 2026 at 5:00 PM Pacific Time. Treat July 21 at 3:00 PM PT as the internal freeze; submissions cannot be substantively changed after the official deadline.

## Account and eligibility — owner confirmation required

- [ ] Devpost account has joined OpenAI Build Week and the PACT draft exists.
- [ ] Entrant meets the age, residency, and OpenAI-supported-country requirements.
- [ ] Entry mode is confirmed as individual, team, or organization.
- [ ] If a team: every member is added and has accepted before the deadline; one eligible representative is authorized to submit.
- [ ] If PACT includes any pre-hackathon work: the submission identifies it and distinguishes the July 13–21 Build Week work. The dated repository history and Codex task provide supporting evidence.

## Required submission fields

- [ ] Project title: **PACT — Proof, Action, Coordination & Tracking**
- [ ] Track: **Work & Productivity**
- [ ] Tagline: **AI accountable for the business outcome—not just the answer.**
- [ ] Text description is pasted from `docs/SUBMISSION.md` and reviewed in the entrant's own voice.
- [ ] Public repository URL is added.
- [ ] Free, no-login working-project URL is added and tested in a signed-out browser.
- [ ] `/feedback` Session ID comes from the primary Codex task where most core functionality was built.

## Repository and testing access

- [ ] Repository is public with the MIT license. If kept private instead, share it with both `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] The README setup path works from a clean checkout using Node.js 20+: `npm ci`, `npm run judge:verify`, `npm run dev`.
- [ ] GitHub Pages deployment completed from the verified `main` branch.
- [ ] `https://…/?reset=1` loads the reviewed genuine GPT-5.6 artifact without an API key.
- [ ] The demo and repository remain free and unrestricted through **August 5, 2026 at 5:00 PM PT**, the end of the official judging period.
- [ ] No secret, customer data, personal data, or live enterprise credential appears in code, screenshots, logs, video, or submission text.

## Public YouTube video

- [ ] Runtime is approximately **2:50** and therefore strictly less than three minutes.
- [ ] Video is uploaded to YouTube and visibility is **Public**, not Unlisted or Private.
- [ ] Spoken English audio explains what PACT does, how Codex changed the build, and what GPT-5.6 does in the product.
- [ ] The product shown behaves exactly as narrated.
- [ ] Synthetic, simulated, observed, fixture, and human-authority labels remain visible.
- [ ] No copyrighted music is used. Safest choice: no music.
- [ ] No unlicensed third-party footage, logos, or media is used. Required verbal/product references to Codex, GPT-5.6, and the OpenAI Agents SDK remain factual.
- [ ] YouTube processing has completed at 1080p or higher; captions and audio are checked from a signed-out session.
- [ ] Public YouTube URL is pasted into Devpost and opened once from the submitted preview.

## Gallery order

1. `submission-assets/devpost-cover.png`
2. `10-mission-control.png`
3. `20-plant-digital-twin.png`
4. `30-proofline-verification.png`
5. `40-independent-audit.png`
6. `50-blocked-quality-guard.png`
7. `60-outcome-closeout.png`

Do not crop away truthfulness labels. Capture only after the genuine Northstar artifact is accepted and bind the gallery manifest to its exact plan and audit response IDs. Captions are prepared in `submission-assets/README.md`.

## Final freeze

```bash
npm ci
npm run judge:verify
npm run release:check
git status --short
```

- [ ] `judge:verify` passes.
- [ ] `release:check` passes after final URLs and Session ID are inserted.
- [ ] Latest commit is pushed and GitHub Actions/Pages are green.
- [ ] Devpost preview shows the correct cover, title, track, repository, demo, and video.
- [ ] Submit before the internal freeze, then confirm Devpost shows the project as submitted rather than draft.
