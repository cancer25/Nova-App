import { Platform } from "react-native";

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

export type SpeechErrorCode =
  | "permission-denied"
  | "not-available"
  | "no-speech"
  | "network"
  | "aborted"
  | "unknown";

export interface SpeechError {
  code: SpeechErrorCode;
  message: string;
}

export interface SpeechService {
  /** Returns true if this device/build can actually run speech recognition. */
  isAvailable(): Promise<boolean>;
  /** Requests permission. Returns granted flag. */
  requestPermission(): Promise<boolean>;
  /** Begins listening. Callbacks fire while speech comes in. */
  start(handlers: {
    onResult: (r: SpeechResult) => void;
    onError: (e: SpeechError) => void;
    onEnd: () => void;
  }): Promise<void>;
  /** Stops listening. Safe to call multiple times. */
  stop(): Promise<void>;
}

// ---------- Web Speech API implementation ----------

class WebSpeechService implements SpeechService {
  private recognition: any = null;
  private active = false;

  private getCtor() {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }

  async isAvailable() {
    return !!this.getCtor();
  }

  async requestPermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  async start(handlers: {
    onResult: (r: SpeechResult) => void;
    onError: (e: SpeechError) => void;
    onEnd: () => void;
  }): Promise<void> {
    const Ctor = this.getCtor();
    if (!Ctor) {
      handlers.onError({ code: "not-available", message: "Speech recognition is not supported in this browser." });
      handlers.onEnd();
      return;
    }
    const rec = new Ctor();
    rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      handlers.onResult({ transcript: (final + interim).trim(), isFinal: !!final && !interim });
    };
    rec.onerror = (e: any) => {
      const code: SpeechErrorCode =
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "permission-denied"
          : e.error === "no-speech"
            ? "no-speech"
            : e.error === "network"
              ? "network"
              : e.error === "aborted"
                ? "aborted"
                : "unknown";
      handlers.onError({ code, message: String(e.error || "Speech recognition failed") });
    };
    rec.onend = () => {
      this.active = false;
      handlers.onEnd();
    };

    this.recognition = rec;
    this.active = true;
    try {
      rec.start();
    } catch (e: any) {
      this.active = false;
      handlers.onError({ code: "unknown", message: e?.message ?? "Could not start" });
      handlers.onEnd();
    }
  }

  async stop(): Promise<void> {
    if (this.recognition && this.active) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

// ---------- Native (expo-speech-recognition) implementation ----------

class NativeSpeechService implements SpeechService {
  private mod: any = null;
  private subs: any[] = [];
  private loaded = false;
  private loadFailed = false;

  private load(): any {
    if (this.loaded) return this.mod;
    if (this.loadFailed) return null;
    try {
      // Dynamic require so Metro/Expo Go doesn't crash if the native module isn't present
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const m = require("expo-speech-recognition");
      this.mod = m?.ExpoSpeechRecognitionModule ?? null;
      // Also grab the addSpeechRecognitionListener helper
      this.listen = m?.addSpeechRecognitionListener ?? null;
      this.loaded = !!this.mod;
      if (!this.loaded) this.loadFailed = true;
      return this.mod;
    } catch {
      this.loadFailed = true;
      return null;
    }
  }

  private listen: ((event: string, cb: (payload: any) => void) => { remove: () => void }) | null = null;

  async isAvailable(): Promise<boolean> {
    const m = this.load();
    if (!m) return false;
    try {
      const res = await m.getStateAsync?.();
      // If we get any answer, module works
      return res !== undefined ? true : true;
    } catch {
      return true; // module exists; state may not be queryable while idle
    }
  }

  async requestPermission(): Promise<boolean> {
    const m = this.load();
    if (!m) return false;
    try {
      const res = await m.requestPermissionsAsync();
      return !!res?.granted;
    } catch {
      return false;
    }
  }

  async start(handlers: {
    onResult: (r: SpeechResult) => void;
    onError: (e: SpeechError) => void;
    onEnd: () => void;
  }): Promise<void> {
    const m = this.load();
    if (!m || !this.listen) {
      handlers.onError({ code: "not-available", message: "Speech recognition is not available in this build." });
      handlers.onEnd();
      return;
    }

    // Clean up any previous subs
    this.subs.forEach((s) => s?.remove?.());
    this.subs = [];

    this.subs.push(
      this.listen("result", (evt: any) => {
        const first = evt?.results?.[0];
        if (!first) return;
        handlers.onResult({ transcript: String(first.transcript ?? ""), isFinal: !!evt.isFinal });
      }),
      this.listen("error", (evt: any) => {
        const raw: string = String(evt?.error ?? "unknown");
        const code: SpeechErrorCode =
          raw.includes("permission") || raw === "not-allowed"
            ? "permission-denied"
            : raw === "no-speech" || raw === "no-match"
              ? "no-speech"
              : raw === "network"
                ? "network"
                : raw === "aborted"
                  ? "aborted"
                  : "unknown";
        handlers.onError({ code, message: evt?.message ?? raw });
      }),
      this.listen("end", () => {
        this.subs.forEach((s) => s?.remove?.());
        this.subs = [];
        handlers.onEnd();
      }),
    );

    try {
      await m.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
      });
    } catch (e: any) {
      this.subs.forEach((s) => s?.remove?.());
      this.subs = [];
      handlers.onError({ code: "unknown", message: e?.message ?? "Could not start" });
      handlers.onEnd();
    }
  }

  async stop(): Promise<void> {
    const m = this.load();
    if (!m) return;
    try {
      await m.stop();
    } catch {}
  }
}

// ---------- Factory ----------

let cached: SpeechService | null = null;

export function getSpeechService(): SpeechService {
  if (cached) return cached;
  cached = Platform.OS === "web" ? new WebSpeechService() : new NativeSpeechService();
  return cached;
}
