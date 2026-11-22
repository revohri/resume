# Shared AI Walking Tour — Plan

## The idea

A group walks together. Everyone has their own phone and headphones. One **AI tour guide** talks, and
everyone hears it at the same moment. The guide:

1. **Narrates on its own** when the group gets near something interesting, using GPS.
2. **Answers questions**, and everyone hears the answer.

## Key decisions (with recommendations)

### 1. How does everyone hear the same audio?

| Option | How it works | Verdict |
| --- | --- | --- |
| **A. Live audio room (WebRTC)** | The AI joins a voice room as a speaker. Listeners join by QR code and hear it live. | **Recommended.** Real-time, scales to any group size, works on the phones people already have. |
| B. Broadcast text + local TTS | The server sends text, and each phone speaks it aloud. | Cheaper, but phones drift out of sync and voices differ. A decent fallback for bad signal. |
| C. Hardware broadcast | One phone feeds a Bluetooth broadcast (Auracast / LE Audio) or a multi-headphone transmitter. | No app needed for listeners, but needs specific hardware and has limited range. Useful for testing Phase 1 with a real group. |

**Pick A.** Use **LiveKit**: open source, has a hosted free tier, and its Agents framework is built for "an AI
joins a room and talks". This also avoids building audio infrastructure yourself.

### 2. Who can ask questions?

Live open mics are the hard part: crosstalk, echo, people talking over the AI. So listeners don't share a
live mic. **They record short clips.**

| Mode | How it works | Complexity |
| --- | --- | --- |
| **Host only** | The guide-holder's phone has a push-to-talk button. | Low |
| **Everyone, queued** (recommended default) | Any listener holds a button to record a clip (or types a question). It goes into a queue, and the AI answers it to the whole group with "Sam asked: …" | Low–medium. A clip is just an upload, with no live mixing. |
| Everyone, open mic | A live voice conversation with the whole group. | High. Skip it. |

The host gets two toggles: **auto-answer vs. approve each question**, and **listeners can ask on/off**.

### 3. Whose location drives it?

**The host's phone only.** The group moves together, so one GPS track is enough. This also means only one device
needs location permission and battery drain.

### 4. Web app or native app?

- **Phase 1–3: a PWA (web app).** Listeners scan a QR code and they're in. No install, which matters a lot for
  a casual group.
- **Phase 4: native via Expo / React Native**, *if* testing shows it's needed. The web can't keep tracking
  location reliably with the screen locked (iOS especially), and background audio is flaky. Until then the
  host keeps the screen on, which is fine for a 1–2 hour walk with a battery pack.

## Architecture

```
 Host phone (PWA)                     Server                         Listener phones (PWA)
 ─────────────────                    ──────                         ─────────────────────
 GPS watchPosition ──location──▶  Tour Session service
 Push-to-talk ─────clip────────▶   ├─ POI finder (OSM / Wikipedia)
 Host controls ────────────────▶   ├─ Narration scheduler          ◀── question clips / text
                                   ├─ Question queue                    "Raise hand" button
                                   └─ Guide brain:
                                        STT → Claude → TTS
                                             │
                                             ▼
                                    LiveKit room ── AI audio track ──▶  everyone hears it
                                                 ── data channel  ───▶  live transcript, "now
                                                                         talking about X"
```

### Components

| Piece | Choice | Notes |
| --- | --- | --- |
| Audio room | LiveKit (Cloud to start) | The AI agent is a participant that publishes one audio track. |
| Agent runtime | LiveKit Agents (Node or Python) | Runs the STT → LLM → TTS loop and publishes audio. |
| Speech-to-text | Deepgram or Whisper | Only for question clips, so it's cheap. |
| LLM | Claude via the Anthropic SDK (`claude-opus-5-5`, low effort for snappy replies) | Tool use for `get_nearby_places`, `get_place_details`, `get_route_context`. Haiku 5.5 is an option if latency or cost becomes an issue. |
| Text-to-speech | ElevenLabs or Cartesia (streaming) | Streaming TTS keeps time-to-first-word low. |
| Places data | Wikipedia GeoSearch + OpenStreetMap Overpass (free), Google Places (optional, paid) | Wikipedia has the stories, and OSM has the coverage. |
| Web app | Vite + React PWA, `livekit-client` | One app with two roles: host and listener. |
| State | In-memory per tour to start, Redis/SQLite later | Tours are short-lived. |

### Proactive narration logic (the "brain")

1. Every ~10s, take the host's location, speed, and heading.
2. Keep a **prefetched POI list** within ~500m. Refresh it when the group has moved about 200m.
3. Score each POI by distance, whether it's ahead of the group (using heading), notability (Wikipedia
   pageviews), and whether it's already been covered. Skip anything already covered.
4. When a POI comes within ~40–60m, the guide is idle, and the last narration ended more than 30s ago:
   narrate it.
5. **Pre-generate** narration for the next likely 1–2 POIs while walking, so it starts instantly on arrival.
6. **Priority:** a question in progress > a queued question > proactive narration > filler ("on your left…").
   The guide never cuts itself off mid-sentence. New items wait for a natural pause.
7. Keep a running **tour memory** (places covered, questions asked) in the Claude conversation, so the guide
   can refer back ("like the church we saw earlier…") and doesn't repeat itself.

### Join flow

1. The host opens the app and taps **Start tour**. Optionally they pick a theme (history, food,
   architecture, kids) and a length.
2. The app shows a **QR code plus a 4-letter code**.
3. Listeners scan, enter a name, and tap **Join**. The tap is required for browsers to allow audio playback.
4. Everyone hears: "Welcome, everyone…"

## Phases

### Phase 0 — Monorepo ✅
This repo is now a monorepo. The resume lives in `apps/resume`, and this app lives in `apps/tour-guide`.

### Phase 1 — Solo prototype (prove the content is good)
- A single-device PWA: location → POIs → Claude narration → TTS played locally.
- Push-to-talk questions.
- **Test:** do a real walk alone. Is it interesting? Is the timing right? Is it too chatty?
- You could already use this with a group via option C (a Bluetooth broadcast or splitter).

### Phase 2 — Shared listening
- Add LiveKit. The agent joins the room, and listeners join by QR code.
- Live transcript and a "now talking about" card on listener phones.
- Host controls: pause, skip, "tell us more", volume ducking.

### Phase 3 — Group questions
- "Raise hand" clips and typed questions from any listener go into a queue.
- Host moderation toggle. Attribution in answers ("Priya asked…").
- Rate limiting per listener.

### Phase 4 — Polish (pick based on Phase 1–3 feedback)
- Native host app (Expo) for background location and audio.
- **Per-listener language:** each listener picks a language and gets their own translated TTS track.
- Pre-planned routes: pick stops in advance and pre-generate everything (also gives offline resilience).
- Post-tour recap: a map, the places visited, and a transcript sent to everyone.

## Proposed folder structure

```
apps/
  resume/            # existing Jekyll site
  tour-guide/        # PWA (host + listener)
  tour-agent/        # LiveKit agent worker (STT → Claude → TTS)   — Phase 2
packages/
  tour-shared/       # shared types: tour state, events, POI schema
```

## Rough running costs (per 2-hour tour, ~10 people)

These are order-of-magnitude guesses. Measure during Phase 1.
- **TTS:** dominant cost. ~30–45 min of speech → a few dollars depending on provider and voice.
- **LLM:** a few hundred calls with tour memory and prompt caching → around a dollar or less.
- **LiveKit:** 10 listeners × 2h is well within the free tier to start.
- **STT:** question clips only → cents.

## Risks / open questions

- **Latency on questions:** aim for under 2s to the first spoken word. Streaming TTS plus a short opening
  ("Good question — ") helps.
- **Spotty mobile data:** listeners buffer a few seconds. Option B (text + local TTS) is the fallback.
- **Accuracy / hallucination:** ground narration in fetched Wikipedia/OSM text, and tell the model to say
  "I'm not sure" rather than invent facts.
- **Battery on the host phone:** keep the screen on and bring a battery pack for Phase 1–3.
- **Privacy:** only the host's location is used, and it isn't stored after the tour ends.

## Decisions needed from you

1. Is the default question mode **everyone, queued** or **host only**?
2. Is the agent in **TypeScript** (one language across the repo) or **Python** (LiveKit's most mature
   Agents SDK)?
3. Is the first real-world test **free-roam** (discover as you go) or a **pre-planned route**?
