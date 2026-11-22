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
| **Everyone, queued** ✅ *chosen* | Any listener holds a button to record a clip (or types a question). It goes into a queue, and the AI answers it to the whole group with "Sam asked: …" | Low–medium. A clip is just an upload, with no live mixing. |
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

### Stack — TypeScript end to end ✅

Other apps in the monorepo can use whatever stack suits them. For this project, **TypeScript everywhere** fits best:

- The hardest part of this app is the **event protocol** between the host phone, listener phones, and the
  agent: tour state, question queue, "now narrating", transcript. Sharing one set of types across all three
  removes a whole class of bugs.
- Python's LiveKit Agents SDK is best at live, interruptible voice conversation (turn detection, barge-in).
  This design doesn't use that: questions arrive as uploaded clips, and the agent mostly *publishes* audio.
  The Node SDK covers that well.

| Piece | Choice | Notes |
| --- | --- | --- |
| Web app | Vite + React + TS PWA, `livekit-client` | One app with two roles: host and listener. |
| Server | Node + Hono | Tour sessions, question queue, POI lookup, Claude calls. Holds API keys, which must never be in the browser. |
| Agent worker | `@livekit/agents` (Node), in the same app as the server | Phase 2. Turns text into a live audio track in the room. |
| Shared | `packages/tour-shared` | Event/state types, POI schema, curated routes (Kyoto first). |
| Audio room | LiveKit Cloud (free tier to start) | |
| Speech-to-text | Deepgram (or Whisper) | Question clips only. |
| LLM | Claude via `@anthropic-ai/sdk`, `claude-opus-5-5` at low effort | Tool use: `get_nearby_places`, `get_place_details`, `get_route_context`. Haiku 5.5 if latency or cost bites. |
| Text-to-speech | ElevenLabs or Cartesia, streaming | Must say Japanese names well (see Kyoto). |
| Places data | Wikipedia GeoSearch (EN **and JA**) + OpenStreetMap Overpass | Japanese Wikipedia is far richer for Kyoto. Claude reads it and narrates in English. |
| Hosting | One Node service on Fly.io or Railway that also serves the built PWA | Needs a long-running process for the agent, so not serverless. One deploy. |

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

## First field test — Kyoto ✅

A **guided free-roam** walk. Curated "anchor" stops guarantee the highlights get rich narration. Between them,
the guide discovers smaller places as you go. Route data lives in
`packages/tour-shared/src/routes/kyoto-higashiyama.ts`.

### Route (~7 km of walking, 3–4 hours with stops)

| # | Stop | Why it's an anchor |
| --- | --- | --- |
| 1 | **Nijō Castle** (Nijō-jō) | Tokugawa power in imperial Kyoto. "Nightingale floors" that squeak to expose intruders. Where the shogunate handed power back to the emperor in 1867. |
| — | *Walk east along Oike / Sanjō (~2.5 km), or take the Tōzai line Nijōjō-mae → Kyoto Shiyakusho-mae* | The guide goes quiet when it detects train speed, and picks up again on arrival. |
| 2 | **Nishiki Market** | "Kyoto's kitchen": 400 years of food stalls. Lots of small things to discover. |
| 3 | **Pontochō** | A narrow lantern-lit alley of teahouses. Kamo River summer platforms (*kawayuka*). |
| 4 | **Shijō Ōhashi & Minami-za** | The birthplace of kabuki on the riverbank. Minami-za is the oldest kabuki theatre. |
| 5 | **Gion: Shirakawa & Hanamikōji** | Geiko and maiko culture, *ochaya* teahouses, Tatsumi Bridge. |
| 6 | **Yasaka Shrine & Maruyama Park** | Gion Matsuri's home shrine. The famous weeping cherry. |
| 7 | **Nene-no-michi & Kōdai-ji** | The widow of Toyotomi Hideyoshi, the man who unified Japan. |
| 8 | **Yasaka Pagoda, Ninenzaka & Sannenzaka** | Preserved Edo-period slopes. The "fall here and you'll have bad luck for three years" legend. |
| 9 | **Kiyomizu-dera** | The wooden stage built without nails, Otowa waterfall, "jumping off the stage at Kiyomizu". A finale at sunset. |

### Kyoto-specific requirements

- **Dense POIs in Higashiyama.** There's a shrine every 50m, so a naive geofence would talk nonstop. Use stricter
  scoring between anchors, a minimum gap between narrations, and short one-liners ("on your right, a tiny
  Jizō shrine…") for minor spots.
- **Japanese pronunciation.** Store each place with its kanji name, romaji, and a pronunciation hint, and feed
  these to the TTS. Test names like *Kiyomizu*, *Kōdai-ji*, and *Hanamikōji* before the trip.
- **Etiquette prompts.** Gion has banned photography on some private lanes, and harassing maiko is a real
  problem. The guide should give a gentle heads-up before entering, plus temple manners (quiet voices, no
  photos inside some halls).
- **Transit awareness.** At speeds above ~15 km/h, pause proactive narration. On arrival, give a short
  recap ("we've just come from…").
- **Connectivity.** Every listener needs mobile data (eSIM or pocket Wi-Fi). Pre-generate and cache the
  anchor narrations on the host phone, so the highlights work even in a dead zone. Listeners fall back to
  text with on-device speech if the audio stream drops.
- **Crowds.** Kiyomizu and Sannenzaka are packed. Headphones help, and a "where's the group?" map pin from
  the host's location stops anyone from getting lost.
- **Seasonal hooks.** The guide knows the date. It mentions the cherry blossoms, autumn leaves, or
  illuminations happening right then.

## Phases

### Phase 0 — Monorepo ✅
This repo is now a monorepo. The resume lives in `apps/resume`, and this app lives in `apps/tour-guide`.

### Phase 1 — Solo prototype (prove the content is good)
- Host PWA plus the Node server: location → POIs → Claude narration → TTS played on the host phone.
- Push-to-talk questions.
- A **simulated walk** mode that replays a GPS track of the Kyoto route at home, so timing and chattiness
  can be tuned before the trip.
- **Test:** a real walk locally, then the Kyoto simulation. Is it interesting? Is the timing right? Is it too chatty?
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

## Folder structure

```
apps/
  resume/            # existing Jekyll site
  tour-guide/        # Vite + React PWA (host + listener roles)
  tour-server/       # Node + Hono API, and the LiveKit agent worker from Phase 2
packages/
  tour-shared/       # shared types, event protocol, curated routes (Kyoto)
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

## Decisions log

| Decision | Choice |
| --- | --- |
| Shared audio | LiveKit room, the AI as the single speaker |
| Who can ask | Everyone, through a queue, with host moderation available |
| Location source | Host phone only |
| Stack | TypeScript end to end (Vite/React PWA, Node/Hono, LiveKit Node agent) |
| First field test | Kyoto: Nijō Castle → Gion → Kiyomizu-dera, guided free-roam |

## Still open

- Trip dates, which set the build deadline and the seasonal content.
- Group size, and whether everyone has their own mobile data.
