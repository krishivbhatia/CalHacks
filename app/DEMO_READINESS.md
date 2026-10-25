# Demo readiness work — 25 October 2026

The existing profile chooser and password **Parent** remain unchanged by request. They are a demo gate, not real authentication or server authorization. Use fictional profiles only.

## Completed changes

- All five seeded children now have stock Cartesia voice IDs. The placeholder-only migration preserves custom voices. Existing deployment profiles have been migrated without resetting their data.
- Aiden uses Corey; Priya uses Ella; Sam uses Daniel. Each new voice returned a valid RIFF/WAVE response in a live synthesis call. Each sample was 211,758 bytes. These are stock voices, not cloned child voices. Human listening and device playback remain separate checks.
- The live child transcript reads only the newest 100 messages in chronological order. Parent history starts with 50 newest messages and provides **Load older messages** pages of 50, preserving access to older history without loading an entire room at once.
- Parent replay uses the shared gesture-unlocked playback hook and stops when the room becomes inactive. Browser inspection verified that Pause disables every replay button and Resume enables them again; the room was restored to active.
- Added an internal, operator-only cleanup mutation for closed-room history. It requires an explicit confirmation literal and past cutoff, deletes at most 50 messages per invocation, and removes audio only when no remaining message references it. Active rooms cannot be cleaned up. No existing history was deleted.
- Production expansion/moderation/matching prompts are shared with operator evaluations. Claude helper supports optional response token accounting without logging credentials.
- A live false positive was found and addressed: “I want you to go again.” was flagged because it was short and unclear. The moderation prompt now requires concrete evidence of an unsafe category; ambiguity alone is insufficient. Historical flagged messages are preserved and are not retroactively reclassified.

## Live evidence and limits

Raw results are in `evidence/2026-10-25/`. Requests used the configured development deployment `limitless-pony-148`. Total: **40 Claude requests and 3 Cartesia synthesis requests**, exactly the approved Claude cap. No real child data was submitted by these evaluations. Tests were sequential; none was a capacity stress test.

- Initial moderation suite: **16/16** expected outcomes, comprising eight ordinary refusals/feelings/help requests and eight unsafe messages. This was before the prompt adjustment. A subsequent edge-case check exposed the turn-taking false positive, illustrating why 16/16 is not a general accuracy claim.
- After adjustment: **9/9** targeted labeled regression outcomes, including five allowed messages and four unsafe messages. Thus zero false positives among those five and zero false negatives among those four, for this run only. Three additional ambiguous-phrase observations all passed; only the ordinary turn-taking phrase has an expected label. The initial full 16-case suite was not rerun after adjustment because of the request cap. Independent, broader regression remains necessary.
- AAC expansion: six outputs reviewed against supplied symbols: “I see a red train.”, “I want water.”, “No.”, “Where is mom?”, “It is too loud.”, “I need help.” All six retained the supplied meaning and stayed under 12 words. This is developer review, not intended-community validation.
- Matching: **3/3** structurally valid results on one four-profile fixture, with profile order reversed in the middle trial. All three ranked quiet-a/quiet-b first and proposed active-a/active-b next. IDs, distinct pairs, score bounds and required fields were checked. The ranking favored communication/sensory fit over the train interest shared by an incompatible pair. One fixture cannot establish fairness, calibration, or successful friendships.
- Voices: **3/3** valid WAV responses, no files persisted by the evaluation action.

Measured server-to-provider wall times, rounded median and nearest-rank p95:

- Expansion, n=6: median **858 ms**, p95 **878 ms**.
- Initial moderation, n=16: median **1,123 ms**, p95 **1,428 ms**.
- Updated moderation regression, n=9: median **1,237 ms**, p95 **2,507 ms**.
- Matching, n=3: median **2,726 ms**, p95 **2,830 ms**.
- Voice synthesis, n=3: median **435 ms**, p95 **529 ms**.

These are action-side request timings, excluding browser network, confirmation, scheduling, decoding, and playback. Small-sample p95 values are descriptive, not service guarantees. All 40 Claude calls and three voice calls returned usable results during this run; this does not establish production reliability.

Captured usage for 34 of the 40 Claude calls: **27,424 input tokens and 4,710 output tokens**. The six ambiguity checks did not capture usage. These are partial provider-reported token totals, not a dollar bill or an all-in project cost. No pricing estimate, sustained load test, concurrency limit, or capacity claim is made.

## Automated verification

`npm test`: **46/46** tests pass across four files. Added tests cover active-room deletion refusal, cutoff behavior, retaining shared audio, deleting orphaned audio, 50-message cleanup batches, latest-100 transcript ordering, and history pagination. Updated the exhaustive 250-word test to inspect all persisted test rows rather than relying on the deliberately bounded live endpoint.

`npm run typecheck:backend`, `npm run lint`, and `npm run build` pass. Browser checks verified parent entry with Parent, transcript rendering, replay control availability, pause disabling replay, and resume restoring controls. They do not establish audible playback on two physical devices or a full accessibility audit.

## Cleanup operations

From `app/`, an authenticated deployment operator may invoke `retention:deleteClosedRoomBatch` using a room ID, a past timestamp in milliseconds, and `confirm: "DELETE CLOSED ROOM HISTORY"`. The room must already be closed. Review the target and cutoff first: deletion is permanent. Reinvoke while `mayHaveMore` is true; this flag is conservative when exactly 50 rows remain. There is no automatic scheduler or default deletion period, so existing demo data is retained until an operator deliberately acts.

The cleanup removes only selected room messages and unreferenced associated audio. It does not erase children, parent profiles, approved intake summaries, Agent component threads, provider-side logs, or backups. Parent intake restart already requests deletion of the old Agent thread, but approved profile fields remain. A complete retention/account-erasure policy and provider retention review are still needed.

## Remaining work

- Real authentication/ownership enforcement is deferred at the user's request. Public APIs still trust demo IDs; the frontend password does not protect them.
- Full child interface rehearsal on two physical devices, including unlock, bidirectional audio, pause while speaking, backgrounding, reconnect, and rejected drafts.
- Accessibility and intent-faithfulness evaluation with consenting intended-community participants and caregivers; no community or clinical claims are established here.
- Broader, independently labeled moderation and matching datasets, including the full suite after prompt changes, prompt injection, dialects, ambiguous AAC phrases, and repeated runs.
- User-approved retention periods, account/intake deletion, backup/provider handling, and any legal review required for a real deployment.
- Measured end-to-end p50/p95, concurrent-room load, sustained reliability, and actual billed cost. The bounded measurements above are a baseline, not completion of these items.
