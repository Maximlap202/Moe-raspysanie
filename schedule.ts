export const DAY_IDS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayId = (typeof DAY_IDS)[number];
export const DAY_SHORT: Record<DayId, string> = { mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Вс" };
export const DAY_WHEN: Record<DayId, string> = { mon: "В понедельник", tue: "Во вторник", wed: "В среду", thu: "В четверг", fri: "В пятницу", sat: "В субботу", sun: "В воскресенье" };
const JS_DAY: DayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export type SceneId = "night" | "aurora" | "rain" | "ember" | "ocean" | "library" | "neon" | "geometry";
export const SCENES: { id: SceneId; name: string; gradient: string; kind: string }[] = [
  { id: "night", name: "Ночной лес", gradient: "linear-gradient(135deg,#1a1030 0%,#2d1b4e 40%,#0a0612 100%)", kind: "snow" },
  { id: "aurora", name: "Сияние", gradient: "linear-gradient(160deg,#061820 0%,#0d3b2e 45%,#1a1040 100%)", kind: "stars" },
  { id: "rain", name: "Дождь", gradient: "linear-gradient(180deg,#0c1220 0%,#1a2744 50%,#0a0e18 100%)", kind: "rain" },
  { id: "ember", name: "Угли", gradient: "linear-gradient(145deg,#1a0a08 0%,#3d1810 40%,#120806 100%)", kind: "embers" },
  { id: "ocean", name: "Океан", gradient: "linear-gradient(180deg,#020b18 0%,#0a2a4a 50%,#041018 100%)", kind: "bubbles" },
  { id: "library", name: "Библиотека", gradient: "linear-gradient(135deg,#1c120c 0%,#3d2818 40%,#120c08 100%)", kind: "dust" },
  { id: "neon", name: "Неон", gradient: "linear-gradient(160deg,#0a0614 0%,#1a0a30 40%,#2a0840 100%)", kind: "stars" },
  { id: "geometry", name: "Чертёж", gradient: "linear-gradient(180deg,#0c1020 0%,#141a30 50%,#080a12 100%)", kind: "dust" },
];
export type Lesson = { id: string; subject: string; teacher: string; room: string; start: string; end: string; scene: SceneId };
export type WidgetSize = "s" | "m" | "l";
export type FontId = "sans" | "display" | "serif";
export type BgMode = "subject" | "unified";
export type DisplayFlags = { title: boolean; time: boolean; room: boolean; teacher: boolean; number: boolean };
export type Phase =
  | { type: "now"; lesson: Lesson; day: DayId; minsLeft: number }
  | { type: "first-today"; lesson: Lesson; day: DayId; minsUntil: number }
  | { type: "next-today"; lesson: Lesson; day: DayId; minsUntil: number }
  | { type: "tomorrow"; lesson: Lesson; day: DayId }
  | { type: "later"; lesson: Lesson; day: DayId }
  | { type: "empty" };
export const BELLS: Array<[string, string]> = [
  ["08:00", "08:40"], ["08:45", "09:25"], ["09:35", "10:15"], ["10:30", "11:10"],
  ["11:25", "12:05"], ["12:20", "13:00"], ["13:15", "13:55"], ["14:05", "14:45"],
];
const CATALOG: Record<string, { subject: string; teacher: string; room: string; scene: SceneId }> = {
  algebra: { subject: "Алгебра", teacher: "Иванова А. С.", room: "214", scene: "night" },
  russian: { subject: "Русский язык", teacher: "Петрова М. И.", room: "105", scene: "library" },
  physics: { subject: "Физика", teacher: "Соколов Д. В.", room: "301", scene: "ember" },
  history: { subject: "История", teacher: "Кузнецова Е. П.", room: "208", scene: "geometry" },
  english: { subject: "Английский язык", teacher: "Смирнова О. А.", room: "112", scene: "ocean" },
  bio: { subject: "Биология", teacher: "Орлов П. Н.", room: "220", scene: "aurora" },
  geo: { subject: "География", teacher: "Белова Н. В.", room: "118", scene: "rain" },
  lit: { subject: "Литература", teacher: "Морозова Т. К.", room: "105", scene: "library" },
  chem: { subject: "Химия", teacher: "Лебедева К. О.", room: "316", scene: "ember" },
  pe: { subject: "Физкультура", teacher: "Волков И. Р.", room: "зал", scene: "neon" },
  cs: { subject: "Информатика", teacher: "Новиков А. Е.", room: "404", scene: "neon" },
};
export function getScene(id: SceneId) { return SCENES.find((s) => s.id === id) ?? SCENES[0]!; }
export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}
export function fromMin(min: number): string {
  const c = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
}
export function sortLessons(list: Lesson[]): Lesson[] {
  return list.slice().sort((a, b) => toMin(a.start) - toMin(b.start) || a.id.localeCompare(b.id));
}
function row(day: DayId, index: number, key: keyof typeof CATALOG): Lesson {
  const spec = CATALOG[key]!;
  const [start, end] = BELLS[index] ?? ["15:00", "15:40"];
  return { id: `${day}-${index}`, subject: spec.subject, teacher: spec.teacher, room: spec.room, start, end, scene: spec.scene };
}
function dayOf(day: DayId, keys: Array<keyof typeof CATALOG>): Lesson[] {
  return keys.map((key, i) => row(day, i, key));
}
export function createSeed(): Record<DayId, Lesson[]> {
  return {
    mon: dayOf("mon", ["algebra", "russian", "physics", "history", "english", "bio", "geo", "lit"]),
    tue: dayOf("tue", ["chem", "algebra", "russian", "history", "english", "pe", "geo", "lit"]),
    wed: dayOf("wed", ["algebra", "russian", "physics", "english", "history", "geo", "bio", "lit"]),
    thu: dayOf("thu", ["physics", "algebra", "english", "history", "russian", "bio", "cs", "lit"]),
    fri: dayOf("fri", ["algebra", "russian", "chem", "history", "english", "geo", "lit", "pe"]),
    sat: dayOf("sat", ["algebra", "russian", "english", "history"]),
    sun: [],
  };
}
export function dayFromDate(date: Date): DayId { return JS_DAY[date.getDay()] ?? "mon"; }
export function nextSlot(list: Lesson[]): [string, string] {
  const sorted = sortLessons(list);
  if (sorted.length < BELLS.length) return BELLS[sorted.length] ?? ["15:00", "15:40"];
  const last = sorted[sorted.length - 1];
  if (!last) return ["15:00", "15:40"];
  const start = toMin(last.end) + 10;
  return [fromMin(start), fromMin(start + 40)];
}
export function resolvePhase(now: Date, days: Record<DayId, Lesson[]>): Phase {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = dayFromDate(now);
  const todayLessons = sortLessons(days[today] ?? []);
  for (const lesson of todayLessons) {
    const a = toMin(lesson.start), b = toMin(lesson.end);
    if (nowMin >= a && nowMin < b) return { type: "now", lesson, day: today, minsLeft: Math.max(1, b - nowMin) };
  }
  const upcoming = todayLessons.find((l) => toMin(l.start) > nowMin);
  if (upcoming) {
    const minsUntil = toMin(upcoming.start) - nowMin;
    if (todayLessons[0]?.id === upcoming.id) return { type: "first-today", lesson: upcoming, day: today, minsUntil };
    return { type: "next-today", lesson: upcoming, day: today, minsUntil };
  }
  for (let hop = 1; hop <= 7; hop++) {
    const day = JS_DAY[(now.getDay() + hop) % 7] ?? "mon";
    const list = sortLessons(days[day] ?? []);
    if (list[0]) return hop === 1 ? { type: "tomorrow", lesson: list[0], day } : { type: "later", lesson: list[0], day };
  }
  return { type: "empty" };
}
export function findLesson(days: Record<DayId, Lesson[]>, id: string | null): Lesson | null {
  if (!id) return null;
  for (const day of DAY_IDS) {
    const hit = days[day]?.find((l) => l.id === id);
    if (hit) return hit;
  }
  return null;
}
function pretty(v: string) { return v.replace(/^0/, ""); }
function formatMins(m: number) {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60), r = m % 60;
  return r === 0 ? `${h} ч` : `${h} ч ${r} мин`;
}
export type BannerCopy = { title: string; text: string };
export function bannerCopy(phase: Phase, display: DisplayFlags, preview: Lesson | null): BannerCopy {
  if (preview) {
    const bits = [
      display.time ? `${pretty(preview.start)}–${pretty(preview.end)}` : "",
      display.teacher ? preview.teacher.trim() : "",
      display.room && preview.room.trim() ? `каб. ${preview.room.trim()}` : "",
    ].filter(Boolean);
    return { title: display.title ? preview.subject.trim() || "Название урока" : "Урок", text: bits.join(" · ") || "Фон этого предмета" };
  }
  if (phase.type === "empty") return { title: "Нет уроков", text: "Добавь предмет — виджет покажет, что дальше" };
  const { lesson } = phase;
  const subject = lesson.subject.trim() || "твой первый урок";
  const duration = display.time ? `Он длится с ${pretty(lesson.start)} до ${pretty(lesson.end)}` : "";
  const teacher = display.teacher && lesson.teacher.trim() ? `· ${lesson.teacher.trim()}` : "";
  const room = display.room && lesson.room.trim() ? `каб. ${lesson.room.trim()}` : "";
  if (phase.type === "now") {
    return {
      title: display.title ? "Сейчас идёт урок" : lesson.subject.trim() || "Урок",
      text: [display.title ? lesson.subject.trim() || "Урок" : "", display.teacher ? lesson.teacher.trim() : "", room, display.time ? `ещё ${formatMins(phase.minsLeft)}` : ""].filter(Boolean).join(" · "),
    };
  }
  if (phase.type === "first-today") {
    return { title: display.title ? "Твой первый урок" : lesson.subject.trim() || "Урок", text: [`Сегодня — ${subject}.`, duration, teacher].filter(Boolean).join(" ") };
  }
  if (phase.type === "next-today") {
    return {
      title: display.title ? "Следующий урок" : lesson.subject.trim() || "Урок",
      text: [lesson.subject.trim() || "Урок", display.time ? `${pretty(lesson.start)}–${pretty(lesson.end)}` : "", `через ${formatMins(phase.minsUntil)}`, display.teacher ? lesson.teacher.trim() : "", room].filter(Boolean).join(" · "),
    };
  }
  if (phase.type === "tomorrow") {
    return { title: display.title ? "Твой первый урок" : lesson.subject.trim() || "Урок", text: [`Завтра — ${subject}.`, duration, teacher].filter(Boolean).join(" ") };
  }
  return { title: display.title ? "Твой первый урок" : lesson.subject.trim() || "Урок", text: [`${DAY_WHEN[phase.day]} — ${subject}.`, duration, teacher].filter(Boolean).join(" ") };
}
export function sceneForLesson(lesson: Lesson | null, mode: BgMode, unified: SceneId): SceneId {
  if (mode === "unified") return unified;
  return lesson?.scene ?? unified;
}
export function widgetLimit(size: WidgetSize, count: number): number {
  if (size === "s") return 0;
  if (size === "m") return Math.min(4, count);
  return count;
}
export const SIZE_META: Record<WidgetSize, { name: string; hint: string }> = {
  s: { name: "Маленький", hint: "Только карточка ближайшего урока" },
  m: { name: "Средний", hint: "Карточка и четыре урока" },
  l: { name: "Большой", hint: "Карточка и весь день" },
};
export const FONT_META: Record<FontId, { name: string; hint: string }> = {
  sans: { name: "Гротеск", hint: "Как на макете" },
  display: { name: "Плакат", hint: "Крупные буквы" },
  serif: { name: "Классика", hint: "С засечками" },
};
export function clock(value: string): string { return value.replace(/^0/, ""); }
