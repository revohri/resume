export interface LatLng {
  lat: number;
  lng: number;
}

/** A place the guide can talk about. */
export interface Place {
  id: string;
  name: string;
  /** Native-script name, e.g. kanji. Fed to TTS / used for JA Wikipedia lookup. */
  nativeName?: string;
  /** Pronunciation hint for TTS, e.g. "kee-YOH-mee-zoo DEH-rah". */
  pronunciation?: string;
  location: LatLng;
  /** Distance (m) at which narration should trigger. */
  triggerRadiusM: number;
  wikipedia?: { en?: string; ja?: string };
}

/** A curated stop that always gets full narration. */
export interface AnchorStop extends Place {
  /** Story beats the guide should hit; grounding hints, not a script. */
  talkingPoints: string[];
  /** Etiquette or safety notes to deliver before arriving. */
  headsUp?: string[];
}

export interface RouteLeg {
  from: string;
  to: string;
  mode: "walk" | "transit";
  note?: string;
}

export interface CuratedRoute {
  id: string;
  title: string;
  city: string;
  /** IANA time zone, used for seasonal / time-of-day hooks. */
  timeZone: string;
  stops: AnchorStop[];
  legs: RouteLeg[];
}

export type QuestionStatus = "queued" | "answering" | "answered" | "rejected";

export interface QueuedQuestion {
  id: string;
  askedBy: { id: string; name: string };
  /** Present for typed questions, or after STT for voice clips. */
  text?: string;
  audioClipUrl?: string;
  status: QuestionStatus;
  createdAt: number;
}

export type GuideActivity =
  | { kind: "idle" }
  | { kind: "narrating"; placeId: string }
  | { kind: "answering"; questionId: string };

/** Events broadcast to every participant over the room data channel. */
export type TourEvent =
  | { type: "activity"; activity: GuideActivity }
  | { type: "transcript"; text: string; final: boolean }
  | { type: "queue"; questions: QueuedQuestion[] }
  | { type: "host-location"; location: LatLng; at: number };
