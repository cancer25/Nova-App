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
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  start(handlers: {
    onResult: (r: SpeechResult) => void;
    onError: (e: SpeechError) => void;
    onEnd: () => void;
  }): Promise<void>;
  stop(): Promise<void>;
}

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

let cached: SpeechService | null = null;

export function getSpeechService(): SpeechService {
  if (cached) return cached;
  cached = new WebSpeechService();
  return cached;
}
