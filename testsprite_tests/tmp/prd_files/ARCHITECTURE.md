# ShiftPro — Architecture Reference

> **Audience:** any human or AI agent modifying code in this repo.
> **Authoritative scope:** module layout, allowed couplings, public interfaces, extension points.
> **For product rules, deployment, and policy see:** `PROJECT_CONSTITUTION.md`.
> **Status:** Phase 0 draft. To be appended with the refactor log after Phase 10.

---

## 1. Purpose & scope

This document is the single source of truth for *where code lives* and *how modules are allowed to talk to each other*. If a rule here conflicts with a rule in `PROJECT_CONSTITUTION.md`, the Constitution wins on **product/policy** matters (auth, deployment, data sensitivity) and this doc wins on **code organization** matters (folders, imports, public surfaces).

What this doc covers:
- Module map and import rules
- Public interfaces of every port (the seams where adapters plug in)
- Registries: storage keys, event-bus topics
- Recipes: how to add a feature, how to add Supabase later

What this doc does **not** cover:
- HRMS business rules (see Constitution §4, §5)
- Visual design, CSS classes, i18n strings (see `css/style.css`, `js/i18n.js`)
- Deployment pipeline (see Constitution §8)

---

## 2. Module map

```
js/
├── shared/                        ← cross-cutting, zero domain knowledge
│   ├── eventBus.js                ← pub/sub
│   ├── dom.js                     ← query helpers
│   ├── router.js                  ← section → feature binding
│   └── config.js                  ← constants, defaults, feature flags
│
├── core/                          ← PURE domain (no DOM, no storage, no globals)
│   ├── shifts.js                  ← shift detection, requires labels as input
│   ├── geofence.js                ← haversine, isInside, distanceText
│   ├── time.js                    ← formatDuration, formatDurationSec, formatTime, nowIso
│   └── clock.js                   ← pure state machine: idle ⇄ clocked-in
│
├── application/                   ← use cases (orchestrate core + infrastructure)
│   ├── clockService.js
│   ├── attendanceService.js
│   └── settingsService.js
│
├── infrastructure/                ← adapters (implement ports; swap-friendly)
│   ├── storage/
│   │   ├── localStore.js          ← localStorage façade
│   │   └── eventStore.js          ← IndexedDB events store
│   ├── notifications/
│   │   └── notifier.js            ← Notification API
│   ├── geolocation/
│   │   └── browserGeo.js          ← navigator.geolocation
│   ├── i18n/
│   │   └── index.js               ← dictionary + applyLocale
│   └── auth/
│       ├── anon.js                ← returns { userId:'local', role:'employee' }
│       └── index.js               ← port: getSession, getUser, getRole, onAuthChange
│
├── features/                      ← INDEPENDENT feature modules
│   ├── clock/        { controller.js, view.js, index.js }
│   ├── dashboard/    { controller.js, view.js, index.js }
│   ├── settings/     { controller.js, view.js, index.js }
│   ├── logs/         { controller.js, view.js, index.js }
│   ├── quickLog/     { controller.js, view.js, index.js }
│   ├── theme/        { controller.js, view.js, index.js }
│   ├── locale/       { controller.js, view.js, index.js }
│   └── navigation/   { controller.js, view.js, index.js }
│
└── app.js                         ← composition root ONLY (~50 LOC)
```

Each `features/<name>/index.js` exports `{ mount(rootEl), unmount() }` — this is the **only** contract the rest of the app knows.

---

## 3. Allowed import matrix (the enforceable rule)

| Importer → / Importer ↓ | `shared` | `core` | `application` | `infrastructure` | `features` (self) | `features` (other) | `app.js` |
|---|:---:|:---:|::---:|:---:|:---:|:---:|:---:|
| `shared`              | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `core`                | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `application`         | ✅ | ✅ | ✅ | ✅ (ports) | ❌ | ❌ | ❌ |
| `infrastructure`      | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `features/<x>/view`   | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `features/<x>/controller` | ✅ | ✅ | ✅ | ✅ (ports) | ✅ | ❌ | ❌ |
| `features/<x>/index`  | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `app.js`              | ✅ | ❌ | ✅ | ✅ (port) | ✅ (`mount` only) | ✅ (`mount` only) | — |

**Hard rules:**
1. `features/*/X` must **never** import from `features/*/Y`. Cross-feature signaling is via `shared/eventBus` only.
2. `core/*` must **never** import from `infrastructure/*` or `application/*`. Core is pure.
3. `infrastructure/*` must **never** import from `application/*` or `features/*`. Adapters are passive.
4. `application/*` may import infrastructure **ports only**, not concrete adapter files. (Example: `clockService` imports `infrastructure/storage/localStore.js` because localStore is itself the port-implementing module — when Supabase lands, the port surface stays the same and only the module identity changes.)
5. `app.js` is the only file allowed to know about every feature and wire it together.

---

## 4. Public interfaces (ports)

All functions are `async` unless suffixed `Sync`. JSDoc lives next to each implementation; this is the **shape contract** every adapter must satisfy.

### 4.1 `infrastructure/storage/localStore.js`
```js
// Single façade over window.localStorage. All keys live in shared/config.js.
get(key)              // → unknown (parsed JSON if value is JSON, else string)
set(key, value)       // serializes objects as JSON
remove(key)           // → void
has(key)              // → boolean
keys()                // → string[]  (for migration / debug)
```

### 4.2 `infrastructure/storage/eventStore.js`
```js
addEvent(event)       // → Promise<id>; event: { userId, type, date, time, shift, durationMinutes?, timestamp }
getEvents(filter)     // filter: { userId?, date?, type?, month? }  → Promise<Event[]>
getMonthStats({ userId, yearMonth })   // → Promise<{ totalMinutes, daysWorked, vacationUsed, sickDays, events }>
getVacationBalance({ userId })         // → Promise<{ total, used, remaining }>
```

### 4.3 `infrastructure/notifications/notifier.js`
```js
requestPermission()   // → Promise<NotificationPermission>
notify({ title, body, tag, icon? })  // → void  (no-op if permission != 'granted')
vibrate(pattern)      // → void  (no-op if unsupported)
```

### 4.4 `infrastructure/geolocation/browserGeo.js`
```js
getCurrentPosition()  // → Promise<{ lat:number, lng:number }>
```

### 4.5 `infrastructure/i18n/index.js`
```js
detectInitialLocale() // → 'en' | 'ar'
getLocale()           // → 'en' | 'ar'
setLocale(lang)       // applies lang/dir on <html>, dispatches 'locale:changed'
toggleLocale()        // → 'en' | 'ar'
t(key)                // → string  (translation lookup with fallback)
STRINGS               // exported dictionary object (en + ar)
```

### 4.6 `infrastructure/auth/index.js`  ← **Supabase seam**
```js
getSession()          // → Promise<{ userId, role, displayName, expiresAt? } | null>
getUser()             // → Promise<{ id, displayName } | null>
getRole()             // → Promise<'admin' | 'employee' | null>
onAuthChange(cb)      // → unsubscribe()   (called when session changes)
```

`anon.js` implements this port today; `supabaseAuth.js` will replace it.

### 4.7 `shared/eventBus.js`
```js
publish(topic, payload)   // → void
subscribe(topic, cb)      // → unsubscribe()
```

### 4.8 `shared/router.js`
```js
register(sectionId, mountFn)   // mountFn receives (rootEl)
start(initialSectionId)        // activates section, mounts the feature
go(sectionId)                  // programmatic navigation
onChange(cb)                   // subscribe to section changes
```

---

## 5. Event bus topic registry

| Topic | Payload | Producer(s) | Consumer(s) (examples) |
|---|---|---|---|
| `clock:started`     | `{ userId, shift, timestamp }`        | `features/clock`        | `features/dashboard` (timer), `application/attendanceService` (start tracking) |
| `clock:stopped`     | `{ userId, durationMinutes, timestamp }` | `features/clock`      | `features/dashboard` (reset timer), `features/logs` (refresh) |
| `attendance:logged` | `{ userId, type, date }`              | `features/quickLog`     | `features/logs` (refresh stats), `application/attendanceService` |
| `shift:changed`     | `{ from, to, label }`                 | `application/clockService.periodicStatusCheck` | `features/dashboard` (badge), `notifier` |
| `geo:changed`       | `{ inside: boolean, distance, position }` | `application/clockService.periodicStatusCheck` | `features/dashboard` (status card) |
| `absence:detected`  | `{ userId, date }`                    | `application/attendanceService.checkAbsence` | `notifier` |
| `locale:changed`    | `{ from, to }`                        | `features/locale`, `infrastructure/i18n` | `features/dashboard`, `features/logs` (re-render) |
| `theme:changed`     | `{ theme }`                           | `features/theme`        | `app.js` (sets `<html data-theme>`) |
| `section:changed`   | `{ from, to }`                        | `shared/router`         | `features/logs` (refresh on enter) |
| `settings:saved`    | `{ kind: 'geo'\|'thresholds'\|'prefs' }` | `features/settings`  | `features/dashboard` (apply new thresholds) |
| `storage:quota-warn` | `{ usageBytes, quotaBytes }`         | `infrastructure/storage/localStore` | `notifier` (future) |

**Topic naming convention:** `<domain>:<verb-past-tense>`. Never reuse a topic with a different payload shape.

---

## 6. Storage key registry

All keys live in `shared/config.js` as `STORAGE_KEYS`. No string literal key may appear in any other file.

### 6.1 `localStorage` keys (current)

| Key | Type | Default | Owner | Purpose |
|---|---|---|---|---|
| `shiftpulse-locale`      | `'en' \| 'ar'`           | browser nav | `features/locale`        | UI language |
| `shiftpulse-theme`       | `'light' \| 'dark'`      | `'dark'`    | `features/theme`         | UI theme |
| `shiftpulse-preferences` | `{ autoLocate, notify, vibrate }` | `{ true, true, true }` | `features/settings` | user toggles |
| `shiftpulse-geofence`    | `{ lat, lng, radius }`   | `{ 25.2048, 55.2708, 150 }` | `features/settings`, `core/geofence` | work location |
| `shiftpulse-thresholds`  | `{ morning:{start,end}, evening:{...}, night:{...} }` | `06-14, 14-22, 22-06` | `features/settings`, `core/shifts` | shift windows |
| `shiftpulse-vacation`    | `number` (days/year)     | `30`        | `features/settings`      | vacation allowance |
| `shiftpulse-clocked`     | `'true' \| null`         | `null`      | `application/clockService` (transient) | clocked-in flag |
| `shiftpulse-clockin`     | ISO string \| null       | `null`      | `application/clockService` (transient) | clock-in timestamp |

> **Privacy note:** `shiftpulse-clocked` and `shiftpulse-clockin` are *transient runtime state*. They may move to `sessionStorage` or in-memory only when the offline-sync / Supabase work lands; document any such change in this table.

### 6.2 IndexedDB (current)

| Property | Value |
|---|---|
| Database name | `ShiftProDB` |
| Version | `1` |
| Object store | `events` (keyPath: `id`, autoIncrement) |
| Indexes | `date` (non-unique), `type` (non-unique) |

### 6.3 Records of `events` store
```ts
type EventRecord = {
  id?: number;                  // assigned by IndexedDB
  userId: string;               // auth.getUser().id  (today: 'local')
  type: 'clock-in' | 'clock-out' | 'sick' | 'vacation' | 'overtime' | 'remote';
  date: string;                 // 'YYYY-MM-DD' (user's local)
  time: string;                 // 'HH:MM'
  shift?: 'morning' | 'evening' | 'night';
  durationMinutes?: number;     // for clock-out
  timestamp: string;            // ISO 8601
  createdAt: string;            // ISO 8601, set by eventStore
};
```

---

## 7. Recipe — how to add a new feature

Five steps. Each step is its own commit/PR.

1. **Scaffold the folder**
   ```
   js/features/<name>/{ controller.js, view.js, index.js }
   ```
   `index.js` exports `{ mount(rootEl), unmount() }`. `view.js` is pure (no event listeners, no imports from `application` or `infrastructure`). `controller.js` wires DOM events and subscribes to topics.

2. **Pick a new event-bus topic** if needed. Add it to §5 here. Topic name follows `<domain>:<verb-past-tense>`.

3. **Add any new localStorage keys** to `shared/config.js` and to §6 here. Do not hardcode strings.

4. **Register the feature** in `js/app.js` (composition root) and in `js/shared/router.js` if the feature owns a section.

5. **Verify the import matrix** in §3 is respected. Specifically: no other `features/*` imports from yours; yours only imports from `shared`, `core`, `application`, `infrastructure`, and its own folder.

---

## 8. Recipe — how to add Supabase later (Constitution direction)

When the multi-user HRMS rewrite is green-lit, the following are the only files that need to change or be added. Everything else (core, application, features) is **untouched**.

| Action | File |
|---|---|
| Add adapter | `infrastructure/auth/supabaseAuth.js` — implements the §4.6 port |
| Swap the auth import in composition root | `js/app.js` — change `import * as auth from './infrastructure/auth/index.js'` to load `supabaseAuth.js` instead of `anon.js` (via config flag in `shared/config.js`) |
| Add adapter | `infrastructure/storage/supabaseStore.js` — implements event store on Supabase Postgres |
| Add adapter | `infrastructure/sync/offlineQueue.js` — IndexedDB write-behind queue with `BackgroundSync` |
| Add page split | `login.html`, `employee.html`, `admin.html` — `shared/router.js` is upgraded to History-API page routing; `features/*` do not change |
| Add RLS-aware queries | `application/clockService.js` — calls `supabaseStore` instead of `eventStore`; no UI changes |
| Add admin-only features | `features/admin/*` — new feature folders; their `controller.js` checks `auth.getRole() === 'admin'` and renders nothing if false |

The `Storage` and `Auth` ports (§4.1, §4.6) are the **only** seams. If a future change requires editing a feature to add multi-user behavior, that is a **design smell** to flag — it means a port is missing.

---

## 9. Open questions / decisions log

| # | Question | Status | Owner |
|---|---|---|---|
| D1 | Rename `ShiftPro` → `ShiftPro` to match the directory | Done (Phase 11) | product |
| D2 | Move `shiftpulse-clocked` / `shiftpulse-clockin` from `localStorage` to in-memory only (Constitution §10 forbids sensitive data in `localStorage`) | Open | security |
| D3 | Page split timing (login / employee / admin) | Deferred to follow-up task | engineering |
| D4 | Introduce esbuild for minification + dead-code elimination | Optional; not required for refactor | engineering |
| D5 | Add TypeScript-style JSDoc + `// @ts-check` for IDE safety | Open; would not require a build step | engineering |
| D6 | Background Sync handler in `sw.js` for offline write-queue | Deferred to separate task | engineering |
| D7 | Whether `features/dashboard` and `features/clock` should be merged (they share the status card) | Open | design |

---

## 10. Refactor log

> *Populated at Phase 10. Each entry: date, phase, files moved, files created, files deleted, behavior change (must be "none" for refactor phases).*

| Date | Phase | Change |
|---|---|---|
| 2026-06-08 | 0     | Created `ARCHITECTURE.md` (this file) |
| 2026-06-08 | 1     | Created `js/shared/{eventBus,dom,config,router}.js` — shared utilities |
| 2026-06-08 | 2     | Created `js/infrastructure/storage/{localStore,eventStore}.js`, `js/infrastructure/notifications/notifier.js`, `js/infrastructure/geolocation/browserGeo.js`, `js/infrastructure/i18n/index.js` |
| 2026-06-08 | 3     | Rewrote `js/core/{clock,geofence,shifts,time}.js` (pure ESM, no globals); old files overwritten in place — browser temporarily broken |
| 2026-06-08 | 4     | Created `js/application/{clockService,attendanceService,settingsService}.js`; extended i18n with `getShiftLabels()`/`getBadgeLetters()`; fixed `localStore.get()` to only JSON-parse `{`/`[`/`"` prefixed values |
| 2026-06-08 | 5     | Created 24 files across `js/features/{navigation,theme,locale,quickLog,clock,dashboard,settings,logs}/` — mount/unmount contract per feature |
| 2026-06-08 | 6     | Created `js/infrastructure/auth/{anon,index}.js` — auth port with lazy adapter loading |
| 2026-06-08 | 7     | Rewrote `js/app.js` (44-line ESM composition root); fixed `clockService.stop()` to write IndexedDB event before saving localStorage state (crash-safe ordering) — no UI behavior change |
| 2026-06-08 | 8     | Updated `index.html`: replaced 5 `<script>` tags with single `<script type="module">`, stripped hardcoded mock totals and faux log rows. Deleted `js/data/db.js`, `js/i18n.js`, `js/data/` — UI now shows empty state until real data collected |
| 2026-06-08 | 9     | Updated `sw.js`: cache bumped to `shiftpulse-v2`, precache list expanded to all 49 JS modules |
