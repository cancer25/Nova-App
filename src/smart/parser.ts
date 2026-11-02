import type { Category, Priority } from "@/src/store/types";
import { addDays } from "@/src/utils/date";

export interface ParsedItem {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  detected: {
    priority: boolean;
    category: boolean;
    dueDate: boolean;
  };
}

export interface SmartParser {
  parse(input: string): Promise<ParsedItem[]>;
}

// ---------- Helpers ----------

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const HIGH_WORDS = [
  "urgent",
  "asap",
  "important",
  "critical",
  "high priority",
  "high-priority",
  "must",
  "immediately",
];
const LOW_WORDS = ["low priority", "low-priority", "whenever", "someday", "sometime", "eventually"];

const CATEGORY_KEYWORDS: Record<Exclude<Category, "other" | "personal">, string[]> = {
  work: [
    "meeting",
    "client",
    "email",
    "report",
    "presentation",
    "standup",
    "slack",
    "boss",
    "office",
    "deadline",
    "project",
    "invoice",
    "colleague",
    "manager",
    "team",
    "1:1",
    "call with",
  ],
  study: [
    "study",
    "exam",
    "homework",
    "assignment",
    "class",
    "lecture",
    "read chapter",
    "essay",
    "math",
    "physics",
    "chemistry",
    "biology",
    "history",
    "test",
    "quiz",
    "revise",
    "review notes",
    "flashcards",
  ],
  health: [
    "gym",
    "workout",
    "run",
    "jog",
    "yoga",
    "doctor",
    "dentist",
    "meditation",
    "exercise",
    "walk",
    "hike",
    "swim",
    "sleep",
    "vitamins",
    "medication",
  ],
  shopping: [
    "buy",
    "groceries",
    "grocery",
    "shop",
    "order",
    "purchase",
    "amazon",
    "supermarket",
    "market",
    "milk",
    "bread",
    "eggs",
  ],
};

function nowStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextWeekday(target: number): Date {
  const now = nowStartOfDay();
  const diff = (target - now.getDay() + 7) % 7 || 7; // always in the future
  return addDays(now, diff);
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Split into candidate items ----------

function splitIntoItems(input: string): string[] {
  // Prefer line-based splitting first. If single line, try smart connectors.
  const lines = input
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter((l) => l.length > 0);

  if (lines.length > 1) return lines;

  const single = lines[0] ?? "";
  if (!single) return [];

  // Split on ", and ", " then ", " and also ", "; " when they clearly separate imperatives.
  const parts = single
    .split(/\s*(?:;|,\s*and\s+|\s+then\s+|\s+and also\s+|\s+&\s+)\s*/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);

  return parts.length > 1 ? parts : [single];
}

// ---------- Extract due date ----------

function extractTime(text: string): { hours: number; minutes: number; matched: RegExp } | null {
  const lower = text.toLowerCase();
  // 12-hour: at 3:30 pm, 3pm, at 8 am
  const match1 = lower.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match1) {
    let hours = parseInt(match1[1], 10);
    const minutes = match1[2] ? parseInt(match1[2], 10) : 0;
    const isPm = match1[3].toLowerCase() === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    return { hours, minutes, matched: /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i };
  }

  // 24-hour: at 14:30
  const match2 = lower.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);
  if (match2) {
    const hours = parseInt(match2[1], 10);
    const minutes = parseInt(match2[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes, matched: /\bat\s+\d{1,2}:\d{2}\b/i };
    }
  }

  return null;
}

function extractDueDate(text: string): { date: Date | null; matched: RegExp[] } {
  const matched: RegExp[] = [];
  const lower = text.toLowerCase();
  const now = nowStartOfDay();

  // in N minutes
  const inMins = lower.match(/\bin\s+(\d+)\s*(min|mins|minute|minutes)\b/);
  if (inMins) {
    const mins = parseInt(inMins[1], 10);
    const target = new Date(Date.now() + mins * 60 * 1000);
    matched.push(/\bin\s+\d+\s*(?:min|mins|minute|minutes)\b/);
    return { date: target, matched };
  }

  // in N hours
  const inHours = lower.match(/\bin\s+(a|an|\d+)\s*(hour|hours|hr|hrs)\b/);
  if (inHours) {
    const hrs = inHours[1] === 'a' || inHours[1] === 'an' ? 1 : parseInt(inHours[1], 10);
    const target = new Date(Date.now() + hrs * 3600 * 1000);
    matched.push(/\bin\s+(?:a|an|\d+)\s*(?:hour|hours|hr|hrs)\b/);
    return { date: target, matched };
  }

  let baseDate: Date | null = null;

  // in N days / in a week
  const inDays = lower.match(/\bin\s+(a|an|\d+)\s+(day|days|week|weeks)\b/);
  if (inDays) {
    const n = inDays[1] === "a" || inDays[1] === "an" ? 1 : parseInt(inDays[1], 10);
    const mult = inDays[2].startsWith("week") ? 7 : 1;
    matched.push(/\bin\s+(a|an|\d+)\s+(day|days|week|weeks)\b/);
    baseDate = addDays(now, n * mult);
  } else if (/\b(today|tonight|this evening|this afternoon|this morning)\b/.test(lower)) {
    matched.push(/\b(today|tonight|this evening|this afternoon|this morning)\b/);
    baseDate = now;
  } else if (/\btomorrow\b/.test(lower)) {
    matched.push(/\btomorrow\b/);
    baseDate = addDays(now, 1);
  } else if (/\bnext week\b/.test(lower)) {
    matched.push(/\bnext week\b/);
    baseDate = addDays(now, 7);
  } else if (/\bthis weekend\b/.test(lower)) {
    matched.push(/\bthis weekend\b/);
    baseDate = nextWeekday(6);
  } else {
    // next/this <weekday>
    for (let i = 0; i < WEEKDAYS.length; i++) {
      const wd = WEEKDAYS[i];
      const re = new RegExp(`\\b(?:next|this|on|by)\\s+${wd}\\b`, "i");
      if (re.test(lower)) {
        matched.push(re);
        baseDate = nextWeekday(i);
        break;
      }
      const reBare = new RegExp(`\\b${wd}\\b`, "i");
      if (reBare.test(lower)) {
        matched.push(reBare);
        baseDate = nextWeekday(i);
        break;
      }
    }

    if (!baseDate) {
      // on Month Day
      for (let i = 0; i < MONTHS.length; i++) {
        const m = MONTHS[i];
        const re = new RegExp(`\\b(?:on\\s+)?${m}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i");
        const match = lower.match(re);
        if (match) {
          const day = parseInt(match[1], 10);
          const year = now.getFullYear();
          let target = new Date(year, i, day, 0, 0, 0, 0);
          if (target.getTime() < now.getTime()) {
            target = new Date(year + 1, i, day, 0, 0, 0, 0);
          }
          matched.push(re);
          baseDate = target;
          break;
        }
      }
    }
  }

  // Extract explicit local time of day if present
  const timeInfo = extractTime(text);
  if (timeInfo) {
    matched.push(timeInfo.matched);
    const target = baseDate ? new Date(baseDate) : new Date();
    target.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
    // If no date was specified and time has already passed today, assume tomorrow
    if (!baseDate && target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }
    return { date: target, matched };
  }

  if (baseDate) {
    return { date: baseDate, matched };
  }

  return { date: null, matched };
}

// ---------- Extract priority ----------

function extractPriority(text: string): { priority: Priority; matched: RegExp[] } {
  const lower = text.toLowerCase();
  const matched: RegExp[] = [];

  for (const w of HIGH_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) {
      matched.push(re);
      return { priority: "high", matched };
    }
  }
  if (/!{2,}/.test(text)) {
    matched.push(/!{2,}/);
    return { priority: "high", matched };
  }
  for (const w of LOW_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) {
      matched.push(re);
      return { priority: "low", matched };
    }
  }
  return { priority: "normal", matched };
}

// ---------- Extract category ----------

function extractCategory(text: string): { category: Category; matched: boolean } {
  const lower = text.toLowerCase();
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as (keyof typeof CATEGORY_KEYWORDS)[]) {
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      const re = new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (re.test(lower)) {
        return { category: cat, matched: true };
      }
    }
  }
  return { category: "personal", matched: false };
}

// ---------- Clean title ----------

const LEADING_STRIPS = [
  /^i\s+(?:need|want|have|should|must|would like|got)\s+to\s+/i,
  /^i'?ll\s+/i,
  /^i'?m\s+going\s+to\s+/i,
  /^let'?s\s+/i,
  /^remind\s+me\s+to\s+/i,
  /^remember\s+to\s+/i,
  /^need\s+to\s+/i,
  /^don'?t\s+forget\s+to\s+/i,
  /^please\s+/i,
  /^todo:?\s+/i,
  /^task:?\s+/i,
];

function stripLeading(text: string): string {
  let t = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of LEADING_STRIPS) {
      const before = t;
      t = t.replace(re, "");
      if (t !== before) changed = true;
    }
  }
  return t.trim();
}

function cleanTitle(text: string, removeRegexes: RegExp[]): string {
  let t = stripLeading(text);
  for (const re of removeRegexes) {
    t = t.replace(re, " ");
  }
  // Remove leading/trailing conjunctions and stray punctuation
  t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  // Strip trailing filler phrases left behind after removing meta keywords
  t = t
    .replace(/[,\s]+(?:it'?s|it is|please|please do|for me)\s*$/i, "")
    .replace(/[,\s]+(?:it'?s|it is)\s*[,]?\s*$/i, "");
  t = t.replace(/^[-–,;:!?.\s]+/, "").replace(/[-–,;:\s]+$/, "").trim();
  if (!t) return text.trim();
  // Capitalize first char
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------- Public API ----------

export const localParser: SmartParser = {
  async parse(input: string): Promise<ParsedItem[]> {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const segments = splitIntoItems(trimmed);

    return segments.map((seg) => {
      const { date, matched: dueMatches } = extractDueDate(seg);
      const { priority, matched: priorityMatches } = extractPriority(seg);
      const { category, matched: catMatched } = extractCategory(seg);

      const title = cleanTitle(seg, [...dueMatches, ...priorityMatches]);

      return {
        id: newId(),
        title: title || seg,
        priority,
        category,
        dueDate: date ? date.toISOString() : null,
        detected: {
          priority: priorityMatches.length > 0,
          category: catMatched,
          dueDate: dueMatches.length > 0,
        },
      };
    });
  },
};

// Default export lets the app swap parsers later (e.g. an LLM-backed one).
export const defaultParser: SmartParser = localParser;
