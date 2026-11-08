import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Moon, MoreVertical, Plus, Sun, X } from "lucide-react";
import { cn } from "./lib/cn";
import {
  bannerCopy, clock, DAY_IDS, DAY_SHORT, dayFromDate, findLesson, FONT_META, getScene,
  resolvePhase, sceneForLesson, SCENES, SIZE_META, sortLessons, toMin, widgetLimit,
  type DayId, type DisplayFlags, type FontId, type Lesson, type Phase, type SceneId, type WidgetSize,
} from "./lib/schedule";
import { useSchedule } from "./lib/store";

const BANNER_H: Record<WidgetSize, string> = { s: "min-h-40", m: "min-h-48", l: "min-h-56" };

function SceneBackdrop({ sceneId, live = true }: { sceneId: SceneId; live?: boolean }) {
  const scene = getScene(sceneId);
  const count = scene.kind === "rain" ? 20 : 14;
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="scene-pan" style={{ backgroundImage: scene.gradient }} />
      {live ? (
        <div className={`particles particles-${scene.kind}`}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="particle" style={{
              left: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 7) * 0.65}s`,
              animationDuration: `${scene.kind === "rain" ? 1.5 + (i % 4) * 0.25 : 8 + (i % 6)}s`,
            }} />
          ))}
        </div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-scrim/80 via-scrim/35 to-scrim/5" />
    </div>
  );
}

export default function App() {
  const tone = useSchedule((s) => s.tone);
  const size = useSchedule((s) => s.size);
  const font = useSchedule((s) => s.font);
  const bgMode = useSchedule((s) => s.bgMode);
  const unifiedScene = useSchedule((s) => s.unifiedScene);
  const display = useSchedule((s) => s.display);
  const days = useSchedule((s) => s.days);
  const selectedDay = useSchedule((s) => s.selectedDay);
  const previewId = useSchedule((s) => s.previewId);
  const setTone = useSchedule((s) => s.setTone);
  const setSelectedDay = useSchedule((s) => s.setSelectedDay);
  const setPreviewId = useSchedule((s) => s.setPreviewId);
  const addLesson = useSchedule((s) => s.addLesson);

  const [now, setNow] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.tone = tone;
  }, [tone]);

  const lessons = useMemo(() => sortLessons(days[selectedDay] ?? []), [days, selectedDay]);
  const phase: Phase | null = now ? resolvePhase(now, days) : null;
  const preview = findLesson(days, previewId);
  const focus = preview ?? (phase && phase.type !== "empty" ? phase.lesson : lessons[0] ?? null);
  const copy = phase
    ? bannerCopy(phase, display, preview)
    : { title: focus?.subject.trim() || "Твой первый урок", text: focus ? `${clock(focus.start)}–${clock(focus.end)}` : "Добавь первый урок" };
  const sceneId = sceneForLesson(focus, bgMode, unifiedScene);
  const limit = widgetLimit(size, lessons.length);
  const activeId = preview?.id ?? (phase && phase.type !== "empty" && phase.day === selectedDay ? phase.lesson.id : null);
  const editing = editorId ? findLesson(days, editorId) : null;
  const editingIndex = editing ? lessons.findIndex((l) => l.id === editing.id) : -1;
  const fontClass = font === "display" ? "font-semibold tracking-wide" : font === "serif" ? "font-serif" : "";

  return (
    <main className={cn("min-h-dvh bg-bg text-fg", fontClass)}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
        <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center pt-3">
          <button type="button" className="grid size-11 place-items-center rounded-full" aria-label="Настройки" onClick={() => setSettingsOpen(true)}>
            <MoreVertical className="size-6" />
          </button>
          <h1 className="text-center text-xl font-extrabold tracking-tight">Моё расписание</h1>
          <button type="button" className="grid size-11 place-items-center rounded-full" aria-label={tone === "night" ? "Светлая тема" : "Тёмная тема"} onClick={() => setTone(tone === "night" ? "day" : "night")}>
            {tone === "night" ? <Sun className="size-6" /> : <Moon className="size-6" />}
          </button>
        </header>

        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-primary">{copy.title} · {copy.text}</p>

        <section className={cn("relative mt-4 overflow-hidden rounded-[1.75rem]", BANNER_H[size])} aria-label="Виджет">
          <SceneBackdrop sceneId={sceneId} />
          <div className="relative z-10 flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold leading-tight text-on-scrim">{copy.title}</h2>
              {preview ? (
                <button type="button" className="shrink-0 rounded-full bg-scrim/55 px-3 py-1.5 text-xs font-semibold text-on-scrim" onClick={() => setPreviewId(null)}>
                  К ближайшему
                </button>
              ) : null}
            </div>
            <p className="mt-2 max-w-xs text-sm leading-snug text-on-scrim/85">{copy.text}</p>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-7 gap-1" role="tablist" aria-label="День недели">
          {DAY_IDS.map((day) => {
            const selected = day === selectedDay;
            const isToday = now ? dayFromDate(now) === day : false;
            return (
              <button key={day} type="button" role="tab" aria-selected={selected}
                className={cn("relative h-11 rounded-full text-sm font-semibold", selected ? "bg-primary text-primary-fg" : "bg-surface text-muted")}
                onClick={() => setSelectedDay(day)}>
                {DAY_SHORT[day]}
                {isToday ? <span className={cn("absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full", selected ? "bg-primary-fg" : "bg-primary")} /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="text-sm text-muted">Уроки</h3>
          <p className="text-xs text-muted">{SIZE_META[size].name} виджет</p>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {lessons.length === 0 ? (
            <div className="rounded-3xl bg-surface px-4 py-8 text-center">
              <p className="font-semibold">В этот день тихо</p>
              <p className="mt-1 text-sm text-muted">Добавь урок или оставь выходной.</p>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div key={lesson.id} className="contents">
                {index === limit && limit < lessons.length ? (
                  <p className="px-1 pt-1 text-xs text-muted">Ниже не входит в виджет — только в приложении</p>
                ) : null}
                <LessonRow lesson={lesson} index={index} display={display}
                  dim={limit < lessons.length && index >= limit} active={lesson.id === activeId}
                  onOpen={() => { setPreviewId(lesson.id); setEditorId(lesson.id); }} />
              </div>
            ))
          )}
          <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-3xl bg-surface text-sm font-semibold text-primary"
            onClick={() => setEditorId(addLesson(selectedDay))}>
            <Plus className="size-4" /> Добавить урок
          </button>
        </div>

        <div className="pb-safe mt-auto pt-6">
          <button type="button" className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-fg" onClick={() => setInstallOpen(true)}>
            Добавить виджет
          </button>
          <p className="mt-3 text-sm leading-snug text-muted">Зажми пустое место на экране → Виджеты → Моё расписание.</p>
        </div>
      </div>

      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
      {installOpen ? <InstallDialog onClose={() => setInstallOpen(false)} /> : null}
      {editing ? (
        <LessonEditor key={editing.id} lesson={editing} day={selectedDay} index={editingIndex} total={lessons.length} onClose={() => setEditorId(null)} />
      ) : null}
    </main>
  );
}

function LessonRow({ lesson, index, display, dim, active, onOpen }: {
  lesson: Lesson; index: number; display: DisplayFlags; dim: boolean; active: boolean; onOpen: () => void;
}) {
  const scene = getScene(lesson.scene);
  const subject = lesson.subject.trim();
  const room = lesson.room.trim();
  return (
    <button type="button" onClick={onOpen}
      className={cn("flex w-full items-center gap-3 rounded-3xl bg-surface px-3 py-3 text-left", active && "ring-2 ring-primary", dim && "opacity-60")}>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-xl" style={{ backgroundImage: scene.gradient }} aria-hidden>
        {display.number ? <span className="absolute inset-0 grid place-items-center text-sm font-extrabold text-on-scrim drop-shadow">{index + 1}</span> : null}
      </span>
      {display.time ? <span className="shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums tracking-tight">{clock(lesson.start)}–{clock(lesson.end)}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm", subject ? "font-medium" : "text-muted")}>{subject || "Название урока"}</span>
        {display.teacher && lesson.teacher.trim() ? <span className="block truncate text-xs text-muted">{lesson.teacher.trim()}</span> : null}
      </span>
      {display.room ? (
        <span className="shrink-0 text-sm font-bold whitespace-nowrap">
          каб. <span className={cn("font-semibold", room ? "text-fg" : "text-danger")}>{room || "—"}</span>
        </span>
      ) : null}
    </button>
  );
}

function LessonEditor({ lesson, day, index, total, onClose }: {
  lesson: Lesson; day: DayId; index: number; total: number; onClose: () => void;
}) {
  const saveLesson = useSchedule((s) => s.saveLesson);
  const removeLesson = useSchedule((s) => s.removeLesson);
  const moveLesson = useSchedule((s) => s.moveLesson);
  const [draft, setDraft] = useState(lesson);
  const [applyAll, setApplyAll] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const flush = (next: Lesson = draft) => {
    saveLesson(day, lesson.id, {
      subject: next.subject.trim(), teacher: next.teacher.trim(), room: next.room.trim(),
      start: next.start, end: next.end, scene: next.scene,
    }, applyAll && next.subject.trim().length > 0);
  };
  const shift = (dir: -1 | 1) => {
    if (toMin(draft.end) <= toMin(draft.start)) { setError("Конец урока должен быть позже начала"); return; }
    flush();
    const list = sortLessons(useSchedule.getState().days[day] ?? []);
    const at = list.findIndex((item) => item.id === lesson.id);
    moveLesson(day, at, dir);
    const fresh = findLesson(useSchedule.getState().days, lesson.id);
    if (fresh) setDraft(fresh);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/70" onClick={onClose}>
      <form className="sheet-scroll w-full max-w-md rounded-t-[1.75rem] bg-bg p-4" onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (toMin(draft.end) <= toMin(draft.start)) { setError("Конец урока должен быть позже начала"); return; }
          flush(); onClose();
        }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Урок {index >= 0 ? index + 1 : ""}</h2>
          <button type="button" className="grid size-10 place-items-center rounded-full bg-surface" aria-label="Закрыть" onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="relative mb-4 h-28 overflow-hidden rounded-3xl">
          <SceneBackdrop sceneId={draft.scene} />
          <p className="relative z-10 p-4 text-xl font-extrabold text-on-scrim">{draft.subject.trim() || "Название урока"}</p>
        </div>
        <Field label="Предмет" value={draft.subject} placeholder="Алгебра" onChange={(subject) => setDraft({ ...draft, subject })} />
        <Field label="Педагог" value={draft.teacher} placeholder="Иванова А. С." onChange={(teacher) => setDraft({ ...draft, teacher })} />
        <Field label="Кабинет" value={draft.room} placeholder="214" onChange={(room) => setDraft({ ...draft, room })} />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Начало</span>
            <input type="time" required value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              className="h-12 w-full rounded-2xl bg-surface px-3 text-base outline-none ring-1 ring-line focus:ring-primary" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Конец</span>
            <input type="time" required value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              className="h-12 w-full rounded-2xl bg-surface px-3 text-base outline-none ring-1 ring-line focus:ring-primary" />
          </label>
        </div>
        <p className="mb-2 text-sm text-muted">Фон предмета</p>
        <SceneGrid value={draft.scene} onChange={(scene) => setDraft({ ...draft, scene })} />
        <button type="button" role="checkbox" aria-checked={applyAll} className="mt-3 flex w-full items-center gap-3 text-left text-sm" onClick={() => setApplyAll((v) => !v)}>
          <span className={cn("grid size-5 place-items-center rounded-md ring-1", applyAll ? "bg-primary text-primary-fg ring-primary" : "ring-line")}>{applyAll ? "✓" : ""}</span>
          Такой фон у всех уроков с этим названием
        </button>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-semibold disabled:opacity-40" disabled={index <= 0} onClick={() => shift(-1)}>
            <ArrowUp className="size-4" /> Выше
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-semibold disabled:opacity-40" disabled={index < 0 || index >= total - 1} onClick={() => shift(1)}>
            <ArrowDown className="size-4" /> Ниже
          </button>
        </div>
        {confirmDelete ? (
          <div className="mt-3 flex gap-2">
            <button type="button" className="h-11 flex-1 rounded-2xl bg-danger text-sm font-bold text-on-scrim" onClick={() => { removeLesson(day, lesson.id); onClose(); }}>Удалить урок</button>
            <button type="button" className="h-11 flex-1 rounded-2xl bg-surface text-sm font-semibold" onClick={() => setConfirmDelete(false)}>Оставить</button>
          </div>
        ) : (
          <button type="button" className="mt-3 h-11 w-full rounded-2xl text-sm font-semibold text-danger" onClick={() => setConfirmDelete(true)}>Удалить</button>
        )}
        <button type="submit" className="mt-3 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-fg">Сохранить</button>
      </form>
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl bg-surface px-4 text-base outline-none ring-1 ring-line placeholder:text-muted focus:ring-primary" />
    </label>
  );
}

function SceneGrid({ value, onChange }: { value: SceneId; onChange: (s: SceneId) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SCENES.map((scene) => {
        const selected = scene.id === value;
        return (
          <button key={scene.id} type="button" aria-pressed={selected} onClick={() => onChange(scene.id)}
            className={cn("overflow-hidden rounded-2xl text-left ring-2", selected ? "ring-primary" : "ring-transparent")}>
            <span className="block h-14 w-full" style={{ backgroundImage: scene.gradient }} />
            <span className="block truncate bg-surface px-1.5 py-1 text-xs font-medium">{scene.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<"menu" | "size" | "show" | "bg" | "font">("menu");
  const size = useSchedule((s) => s.size);
  const font = useSchedule((s) => s.font);
  const bgMode = useSchedule((s) => s.bgMode);
  const unifiedScene = useSchedule((s) => s.unifiedScene);
  const display = useSchedule((s) => s.display);
  const setSize = useSchedule((s) => s.setSize);
  const setFont = useSchedule((s) => s.setFont);
  const setBgMode = useSchedule((s) => s.setBgMode);
  const setUnifiedScene = useSchedule((s) => s.setUnifiedScene);
  const toggleDisplay = useSchedule((s) => s.toggleDisplay);
  const title = page === "menu" ? "Настройки" : page === "size" ? "Размер виджета" : page === "show" ? "Что показывать" : page === "bg" ? "Фон виджета" : "Шрифт";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/70 p-4" onClick={onClose}>
      <div className="sheet-scroll w-full max-w-sm rounded-[1.75rem] bg-surface-2 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {page !== "menu" ? (
            <button type="button" className="grid size-10 place-items-center rounded-full" aria-label="Назад" onClick={() => setPage("menu")}><ChevronLeft className="size-5" /></button>
          ) : null}
          <h2 className="flex-1 text-2xl font-extrabold">{title}</h2>
          <button type="button" className="grid size-10 place-items-center rounded-full" aria-label="Закрыть" onClick={onClose}><X className="size-5" /></button>
        </div>
        {page === "menu" ? (
          <div className="mt-6 flex flex-col">
            {([["size", "Размер виджета"], ["show", "Что показывать в виджете"], ["bg", "Фон виджета"], ["font", "Шрифт"]] as const).map(([id, label]) => (
              <button key={id} type="button" className="flex h-14 items-center justify-between text-left text-lg font-semibold" onClick={() => setPage(id)}>
                {label}<ChevronRight className="size-5 text-muted" />
              </button>
            ))}
          </div>
        ) : null}
        {page === "size" ? (
          <div className="mt-5 grid gap-2">
            {(Object.keys(SIZE_META) as WidgetSize[]).map((id) => (
              <button key={id} type="button" aria-pressed={size === id} onClick={() => setSize(id)}
                className={cn("rounded-2xl px-4 py-3 text-left ring-1", size === id ? "bg-primary text-primary-fg ring-primary" : "bg-surface ring-line")}>
                <span className="block font-bold">{SIZE_META[id].name}</span>
                <span className={cn("mt-0.5 block text-sm", size === id ? "text-primary-fg/80" : "text-muted")}>{SIZE_META[id].hint}</span>
              </button>
            ))}
          </div>
        ) : null}
        {page === "show" ? (
          <div className="mt-5 flex flex-col gap-2">
            {([["title", "Заголовок карточки"], ["number", "Номер урока"], ["time", "Время"], ["room", "Кабинет"], ["teacher", "Имя педагога"]] as const).map(([key, label]) => (
              <button key={key} type="button" role="switch" aria-checked={display[key]} onClick={() => toggleDisplay(key)}
                className="flex min-h-12 w-full items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-left">
                <span className="text-base font-medium">{label}</span>
                <span className={cn("relative h-7 w-12 shrink-0 rounded-full", display[key] ? "bg-primary" : "bg-line")}>
                  <span className={cn("absolute top-0.5 size-6 rounded-full bg-on-scrim", display[key] ? "translate-x-5" : "translate-x-0.5")} />
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {page === "bg" ? (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={bgMode === "subject"} onClick={() => setBgMode("subject")}
                className={cn("rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1", bgMode === "subject" ? "bg-primary text-primary-fg ring-primary" : "bg-surface ring-line")}>
                Свой у предмета
              </button>
              <button type="button" aria-pressed={bgMode === "unified"} onClick={() => setBgMode("unified")}
                className={cn("rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1", bgMode === "unified" ? "bg-primary text-primary-fg ring-primary" : "bg-surface ring-line")}>
                Один на виджет
              </button>
            </div>
            <p className="mt-3 text-sm leading-snug text-muted">
              {bgMode === "subject" ? "Открой урок и выбери живой фон." : "Один фон на всю карточку."}
            </p>
            {bgMode === "unified" ? <div className="mt-3"><SceneGrid value={unifiedScene} onChange={setUnifiedScene} /></div> : null}
          </div>
        ) : null}
        {page === "font" ? (
          <div className="mt-5 grid gap-2">
            {(Object.keys(FONT_META) as FontId[]).map((id) => (
              <button key={id} type="button" aria-pressed={font === id} onClick={() => setFont(id)}
                className={cn("rounded-2xl px-4 py-3 text-left ring-1", font === id ? "bg-primary ring-primary" : "bg-surface ring-line")}>
                <span className={cn("block text-lg font-semibold", id === "serif" && "font-serif", font === id && "text-primary-fg")}>Моё расписание</span>
                <span className={cn("mt-0.5 block text-sm", font === id ? "text-primary-fg/80" : "text-muted")}>{FONT_META[id].name} · {FONT_META[id].hint}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InstallDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/70" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[1.75rem] bg-surface-2 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold">Виджет на экран</h2>
        <p className="mt-2 text-sm leading-snug text-muted">Карточка сверху — это виджет. Фон каждого предмета, имя педагога и размер уже в нём.</p>
        <ol className="mt-4 flex flex-col gap-3 text-base">
          <li>1. Зажми пустое место на главном экране</li>
          <li>2. Открой «Виджеты»</li>
          <li>3. Выбери «Моё расписание» и вытяни на экран</li>
        </ol>
        <p className="mt-4 text-sm leading-snug text-muted">В приложении фон живой. Размер виджета меняется в настройках.</p>
        <button type="button" className="mt-5 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-fg" onClick={onClose}>Понятно</button>
      </div>
    </div>
  );
}
