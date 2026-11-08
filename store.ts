import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createSeed, nextSlot, sortLessons,
  type BgMode, type DayId, type DisplayFlags, type FontId, type Lesson, type SceneId, type WidgetSize,
} from "./schedule";

export type ScheduleData = {
  tone: "night" | "day";
  size: WidgetSize;
  font: FontId;
  bgMode: BgMode;
  unifiedScene: SceneId;
  display: DisplayFlags;
  days: Record<DayId, Lesson[]>;
  selectedDay: DayId;
  previewId: string | null;
};

type Store = ScheduleData & {
  setTone: (tone: "night" | "day") => void;
  setSize: (size: WidgetSize) => void;
  setFont: (font: FontId) => void;
  setBgMode: (mode: BgMode) => void;
  setUnifiedScene: (scene: SceneId) => void;
  setSelectedDay: (day: DayId) => void;
  setPreviewId: (id: string | null) => void;
  toggleDisplay: (key: keyof DisplayFlags) => void;
  saveLesson: (day: DayId, id: string, patch: Partial<Lesson>, applyScene: boolean) => void;
  addLesson: (day: DayId) => string;
  removeLesson: (day: DayId, id: string) => void;
  moveLesson: (day: DayId, index: number, dir: -1 | 1) => void;
};

const seed = createSeed();
const initial: ScheduleData = {
  tone: "night",
  size: "l",
  font: "sans",
  bgMode: "subject",
  unifiedScene: "night",
  display: { title: true, time: true, room: true, teacher: true, number: true },
  days: seed,
  selectedDay: "mon",
  previewId: null,
};

export const useSchedule = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      setTone: (tone) => set({ tone }),
      setSize: (size) => set({ size }),
      setFont: (font) => set({ font }),
      setBgMode: (bgMode) => set({ bgMode }),
      setUnifiedScene: (unifiedScene) => set({ unifiedScene }),
      setSelectedDay: (selectedDay) => set({ selectedDay, previewId: null }),
      setPreviewId: (previewId) => set({ previewId }),
      toggleDisplay: (key) => set((s) => ({ display: { ...s.display, [key]: !s.display[key] } })),
      saveLesson: (day, id, patch, applyScene) =>
        set((state) => {
          const current = state.days[day]?.find((l) => l.id === id);
          if (!current) return state;
          const next: Lesson = { ...current, ...patch, id: current.id };
          const key = next.subject.trim().toLowerCase();
          const sceneChanged = patch.scene !== undefined && patch.scene !== current.scene;
          const days = { ...state.days };
          for (const name of Object.keys(days) as DayId[]) {
            days[name] = sortLessons(
              (state.days[name] ?? []).map((lesson) => {
                if (name === day && lesson.id === id) return next;
                if (applyScene && sceneChanged && key && lesson.subject.trim().toLowerCase() === key) {
                  return { ...lesson, scene: next.scene };
                }
                return lesson;
              }),
            );
          }
          return { days, previewId: id };
        }),
      addLesson: (day) => {
        const [start, end] = nextSlot(get().days[day] ?? []);
        const id = `${day}-${Date.now()}`;
        const lesson: Lesson = {
          id, subject: "", teacher: "", room: "", start, end,
          scene: get().bgMode === "unified" ? get().unifiedScene : "night",
        };
        set((s) => ({
          days: { ...s.days, [day]: sortLessons([...(s.days[day] ?? []), lesson]) },
          previewId: id,
        }));
        return id;
      },
      removeLesson: (day, id) =>
        set((s) => ({
          days: { ...s.days, [day]: (s.days[day] ?? []).filter((l) => l.id !== id) },
          previewId: s.previewId === id ? null : s.previewId,
        })),
      moveLesson: (day, index, dir) =>
        set((state) => {
          const list = sortLessons(state.days[day] ?? []);
          const j = index + dir;
          const a = list[index];
          const b = list[j];
          if (!a || !b) return state;
          const next = list.slice();
          next[index] = { ...b, start: a.start, end: a.end };
          next[j] = { ...a, start: b.start, end: b.end };
          return { days: { ...state.days, [day]: sortLessons(next) } };
        }),
    }),
    {
      name: "moe-raspisanie-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tone: s.tone, size: s.size, font: s.font, bgMode: s.bgMode,
        unifiedScene: s.unifiedScene, display: s.display, days: s.days, selectedDay: s.selectedDay,
      }),
    },
  ),
);
