# Reference: Worked Example

Use this to calibrate output quality — especially for stripping filler without losing substance, naming conflicts rather than smoothing them over, and writing follow-up questions that are specific to the meeting.

---

## Input (raw Teams transcript)

> Sarah Mitchell   00:00:42
> Okay so I think we're all here. Let's get started. Um, so today's call is just to align on the Q3 roadmap and what we're actually going to commit to. So yeah. Over to you Tom.
>
> Tom Ellis   00:01:05
> Right so, um, from engineering's side we've got capacity for roughly two major features in Q3. We've sized the notification system at about six weeks and the reporting dashboard at four. So that's ten weeks of work and we have twelve weeks in the quarter which means there's headroom but not much.
>
> Sarah Mitchell   00:02:10
> Okay, that's actually helpful. So Priya, from the product side — which of those two are we prioritising?
>
> Priya Sharma   00:02:22
> I mean honestly both are high priority but if I had to pick one to go first I'd say notifications. Clients have been asking for it since January and it's blocking a couple of enterprise deals.
>
> Tom Ellis   00:02:45
> Yeah, agreed. Notifications first makes sense from a dependency standpoint too — the reporting dashboard will use some of the same backend infrastructure so building notifications first reduces rework.
>
> Sarah Mitchell   00:03:10
> Okay great. So that's agreed. Notifications in Q3, reporting dashboard Q3 if capacity allows or Q4 if not.
>
> Priya Sharma   00:03:28
> Actually wait — I do want to flag the mobile work. We promised the sales team we'd have at least a basic mobile view by end of Q3. That wasn't in Tom's estimate.
>
> Tom Ellis   00:03:45
> Yeah that's, um, that's a problem. That's probably another three to four weeks of work. We can't do all three.
>
> Sarah Mitchell   00:04:02
> Okay so we have a conflict here. Let's — can we take that offline? I don't want to derail this whole call.
>
> Priya Sharma   00:04:12
> I think we need to decide it now actually. Sales is expecting a commitment by Friday.
>
> Sarah Mitchell   00:04:20
> Fine. Okay. So what are the options?
>
> Tom Ellis   00:04:28
> Option one: drop the reporting dashboard to Q4 and do notifications plus mobile in Q3. Option two: do notifications and reporting in Q3 and push mobile to Q4 and reset expectations with sales. Option three: descope mobile to just one platform — iOS only — which gets it to maybe two weeks.
>
> Priya Sharma   00:05:10
> I like option three. iOS first is fine, most of our enterprise clients are on iOS anyway.
>
> Sarah Mitchell   00:05:20
> Yeah, okay. Let's go with that. Notifications, reporting dashboard, and iOS mobile view in Q3. Tom — is that doable?
>
> Tom Ellis   00:05:30
> Twelve weeks, ten for notifications and reporting, two for iOS. Yes, that works. Tight but doable.
>
> Sarah Mitchell   00:05:45
> Great. Priya — can you update the roadmap doc and send it to sales today?
>
> Priya Sharma   00:05:52
> Yes, I'll do that this afternoon.
>
> Sarah Mitchell   00:05:58
> And Tom — just flag to me if anything changes on the capacity side.
>
> Tom Ellis   00:06:05
> Will do.
>
> Sarah Mitchell   00:06:08
> Okay great. I think that's it. Thanks everyone.

---

## Correct Output

---

**MEETING MINUTES**

**Date:** Not specified in transcript
**Attendees:** Sarah Mitchell, Tom Ellis, Priya Sharma
**Duration:** ~6 minutes

---

**Summary**
The team aligned on Q3 roadmap priorities. Three features were confirmed for Q3: the notification system, reporting dashboard, and an iOS-only mobile view. A scope conflict around mobile was raised mid-call and resolved by descoping from full mobile to iOS only, keeping the total estimate within the 12-week quarter.

---

**Key Discussion Points**

- **Engineering capacity** — Tom confirmed capacity for approximately 10 weeks of major feature work in Q3: 6 weeks for notifications, 4 for the reporting dashboard. 2 weeks of headroom exist in the quarter.
- **Prioritisation** — Notifications confirmed as the Q3 priority. Reasons: client demand since January and dependency on notifications infrastructure for the reporting dashboard backend.
- **Mobile scope conflict** — Priya flagged a commitment to sales for a mobile view by end of Q3, which was not in the original estimate. This added 3–4 weeks of work — more than the available headroom.
- **Resolution** — Three options were considered. The team agreed on Option 3: descope mobile to iOS only (~2 weeks), keeping the full Q3 plan (notifications + reporting + iOS) within the 12-week window.

---

**Decisions Made**

- Notifications system is Q3 priority 1.
- Reporting dashboard is Q3 priority 2 (if capacity holds).
- Mobile view descoped to iOS only for Q3. Android and full mobile deferred.
- Sales to be informed of the iOS-only scope.

---

**Action Items**

| Who | What | By When |
|-----|------|---------|
| Priya Sharma | Update roadmap doc to reflect Q3 decisions and send to sales | Today (afternoon) |
| Tom Ellis | Flag to Sarah if engineering capacity changes | Ongoing |

---

**Open Questions**

- Has sales been formally told that mobile will be iOS-only? Priya is sending the roadmap today but it's unclear if a verbal conversation with sales is also needed before Friday's commitment.
- What happens to the reporting dashboard if notifications runs over? Q4 was mentioned as a fallback but no owner or date was assigned for that decision.

---

**Want to dig deeper? Here are some things you could ask:**
- What are the enterprise deals blocked on notifications — and what's the commercial risk if notifications slips past Q3?
- Who is the decision-maker on the sales commitment for mobile, and do they know the scope changed?
- Is the iOS-only mobile view a full feature or a pared-down version — and does Priya's roadmap doc reflect that distinction clearly?

---

## Why This Output Is Good

**The conflict is named, not smoothed over.** Sarah tried to defer the mobile discussion ("let's take that offline"). The minutes record that Priya pushed back and the decision was made in the meeting — because that's what actually happened and it affects the action items.

**Decisions are listed separately from discussion.** The discussion section explains how the team got to the iOS decision. The decisions section records what was decided. Someone who wasn't in the meeting can read the decisions section in 30 seconds.

**Open questions surface what the meeting didn't resolve.** The sales communication gap and the reporting dashboard Q4 fallback are both things the PM needs to follow up on — and neither was given a clear owner in the meeting. Flagging them is more useful than pretending they were resolved.

**Follow-up questions are specific to this meeting.** "What are the enterprise deals blocked on notifications" is something only a person who read this transcript would ask. Generic follow-ups ("would you like more detail?") add no value.
