# دستور مشروع نظام إدارة الموارد البشرية (HRMS PWA)

> **هذا الملف هو المرجع الأول والأخير لأي ذكاء اصطناعي يعمل على هذا المشروع.**
> قبل كتابة أي سطر كود، اقرأ هذا الملف كاملاً والتزم بكل ما فيه.

---

## 1. نظرة عامة على المشروع

| البند | التفصيل |
|---|---|
| **اسم المشروع** | نظام إدارة الموارد البشرية — HRMS PWA |
| **نوع التطبيق** | Progressive Web App (PWA) — متعدد المستخدمين |
| **الهدف** | تسجيل حضور وانصراف الموظفين بالموقع الجغرافي مع لوحة تحكم للمدير |
| **المعمارية** | Client-Server — ملفات على Hostinger + Backend على Supabase |
| **التكلفة المستهدفة** | مجانية بالكامل (Hostinger المشترك + Supabase Free Tier) |
| **المدة الإجمالية** | 15 يوم عمل |

---

## 2. المعمارية التقنية (Architecture)

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│        HOSTINGER            │         │          SUPABASE            │
│    (استضافة عادية مشتركة)   │◄───────►│      (سحابة مستقلة مجانية)  │
│                             │  HTTPS  │                              │
│  • index.html               │  API    │  • PostgreSQL Database       │
│  • login.html               │  Calls  │  • Authentication (JWT)      │
│  • employee.html            │         │  • Row Level Security (RLS)  │
│  • admin.html               │         │  • REST API (تلقائية)        │
│  • manifest.json            │         │  • Edge Functions            │
│  • sw.js (Service Worker)   │         │  • pg_cron (نسخ تلقائي)      │
│  • js/ css/ assets/         │         │  • Supabase Storage          │
└─────────────────────────────┘         └──────────────────────────────┘
```

### قرارات معمارية ثابتة — لا تناقَش

- **Hostinger = ملفات ثابتة فقط.** لا PHP، لا Node.js، لا Cron Job على Hostinger.
- **Supabase = كل الـ Backend.** قاعدة البيانات، المصادقة، الـ API، النسخ الاحتياطي التلقائي.
- **لا VPS، لا خادم مخصص.** كل شيء يعمل على الخطة المجانية.
- **Vanilla JS فقط (ES6+).** لا React، لا Vue، لا أي Framework.
- **لا يُخزَّن أي بيانات حساسة في localStorage.** يُستخدَم `sessionStorage` أو ذاكرة الجلسة فقط.

---

## 3. هيكل الملفات (Directory Structure)

```
my-hr-app/                          ← الجذر — يُرفع على public_html في Hostinger
│
├── index.html                      ← redirect تلقائي حسب الـ role
├── login.html                      ← شاشة تسجيل الدخول
├── employee.html                   ← لوحة تحكم الموظف
├── admin.html                      ← لوحة تحكم المدير
│
├── manifest.json                   ← إعدادات PWA (اسم، أيقونة، ألوان)
├── sw.js                           ← Service Worker (cache + offline)
│
├── css/
│   ├── main.css                    ← المتغيرات العامة والـ reset
│   ├── components.css              ← مكونات مشتركة (بطاقات، أزرار، جداول)
│   ├── employee.css                ← تنسيقات خاصة بواجهة الموظف
│   └── admin.css                   ← تنسيقات خاصة بواجهة المدير
│
├── js/
│   ├── config.js                   ← Supabase URL + anon key (القيم الثابتة فقط)
│   │
│   ├── core/
│   │   ├── auth.js                 ← login / logout / getRole / routeGuard
│   │   ├── geofence.js             ← حساب المسافة والتحقق من النطاق الجغرافي
│   │   └── shifts.js               ← حسابات الورديات وساعات العمل
│   │
│   ├── api/
│   │   ├── client.js               ← fetch wrapper مع JWT header تلقائي
│   │   └── hr_api.js               ← checkIn / checkOut / getAttendance
│   │
│   └── admin/
│       ├── users.js                ← CRUD حسابات الموظفين
│       └── backup.js               ← تصدير CSV + Google Drive API
│
└── assets/
    └── icons/                      ← أيقونات PWA (192x192, 512x512)
```

---

## 4. قاعدة البيانات (Database Schema)

### جدول `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  work_lat    DOUBLE PRECISION,   -- خط العرض لموقع العمل
  work_lng    DOUBLE PRECISION,   -- خط الطول لموقع العمل
  work_radius INTEGER DEFAULT 100, -- النطاق المسموح به بالمتر
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### جدول `attendance`
```sql
CREATE TABLE attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  check_in     TIMESTAMPTZ NOT NULL,
  check_out    TIMESTAMPTZ,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION,
  status       TEXT DEFAULT 'present' CHECK (status IN ('present','late','absent')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### سياسات الصلاحيات (Row Level Security)

```sql
-- تفعيل RLS على الجدولين
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- الموظف: يرى ويعدّل سجله الشخصي فقط
CREATE POLICY "employee_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "employee_own_attendance"
  ON attendance FOR ALL
  USING (auth.uid() = user_id);

-- المدير: صلاحية كاملة على كل السجلات
CREATE POLICY "admin_full_access_profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_full_access_attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 5. نظام المصادقة والصلاحيات

### تدفق تسجيل الدخول
```
المستخدم يفتح التطبيق
        │
        ▼
  index.html → routeGuard()
        │
   هل توجد جلسة؟
   ┌────┴────┐
  لا        نعم
   │         │
   ▼         ▼ جلب الـ role من profiles
login.html    │
              ├── admin    → admin.html
              └── employee → employee.html
```

### قواعد الصلاحيات

| الإجراء | موظف | مدير |
|---|:---:|:---:|
| تسجيل حضوره الشخصي | ✅ | ✅ |
| رؤية سجلاته فقط | ✅ | ✅ |
| رؤية سجلات كل الموظفين | ❌ | ✅ |
| إضافة / تعطيل حساب موظف | ❌ | ✅ |
| تعديل موقع العمل الجغرافي | ❌ | ✅ |
| تصدير النسخة الاحتياطية | ❌ | ✅ |

---

## 6. المنطق البرمجي الأساسي

### 6.1 — `js/config.js`
```javascript
export const SUPABASE_URL  = 'https://xxxx.supabase.co';
export const SUPABASE_KEY  = 'your-anon-key';
export const WORK_RADIUS_M = 100; // النطاق الجغرافي الافتراضي بالمتر
```

### 6.2 — `js/core/auth.js`
```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// تسجيل الدخول
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// تسجيل الخروج
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

// جلب دور المستخدم الحالي
export async function getRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return data?.role;
}

// حارس المسارات — يُستدعى في بداية كل صفحة
export async function routeGuard(requiredRole = null) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = '/login.html'; return; }
  if (requiredRole) {
    const role = await getRole();
    if (role !== requiredRole) { window.location.href = '/login.html'; }
  }
}
```

### 6.3 — `js/core/geofence.js`
```javascript
// حساب المسافة بين نقطتين بالمتر (Haversine Formula)
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// التحقق من وجود الموظف داخل النطاق
export function isInsideGeofence(empLat, empLng, workLat, workLng, radiusM) {
  return getDistance(empLat, empLng, workLat, workLng) <= radiusM;
}
```

### 6.4 — `js/api/client.js`
```javascript
import { supabase } from '../core/auth.js';

// fetch wrapper يُضيف JWT تلقائياً
export async function apiFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}
```

### 6.5 — `js/api/hr_api.js`
```javascript
import { supabase } from '../core/auth.js';

export async function checkIn(userId, lat, lng) {
  const { data, error } = await supabase.from('attendance').insert({
    user_id: userId, check_in: new Date().toISOString(),
    check_in_lat: lat, check_in_lng: lng, status: 'present'
  }).select().single();
  if (error) throw error;
  return data;
}

export async function checkOut(attendanceId) {
  const { error } = await supabase.from('attendance')
    .update({ check_out: new Date().toISOString() })
    .eq('id', attendanceId);
  if (error) throw error;
}

export async function getMyAttendance(userId, year, month) {
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month).padStart(2,'0')}-31`;
  const { data, error } = await supabase.from('attendance')
    .select('*').eq('user_id', userId)
    .gte('check_in', start).lte('check_in', end).order('check_in', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllAttendance(year, month) {
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month).padStart(2,'0')}-31`;
  const { data, error } = await supabase.from('attendance')
    .select('*, profiles(full_name)')
    .gte('check_in', start).lte('check_in', end).order('check_in', { ascending: false });
  if (error) throw error;
  return data;
}
```

### 6.6 — `js/admin/backup.js`
```javascript
import { supabase } from '../core/auth.js';

// تصدير CSV محلي
export async function downloadCSV() {
  const { data, error } = await supabase
    .from('attendance').select('*, profiles(full_name)');
  if (error) throw error;

  const headers = ['الاسم', 'وقت الحضور', 'وقت الانصراف', 'الحالة'];
  const rows = data.map(r => [
    r.profiles?.full_name ?? '',
    r.check_in  ? new Date(r.check_in).toLocaleString('ar-EG')  : '',
    r.check_out ? new Date(r.check_out).toLocaleString('ar-EG') : '',
    r.status ?? ''
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `backup-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 6.7 — قائمة الانتظار Offline (في `sw.js`)
```javascript
// حفظ عملية الحضور في IndexedDB عند انقطاع الإنترنت
// عند عودة الاتصال: مزامنة تلقائية مع Supabase
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});
```

---

## 7. النسخ الاحتياطي الثلاثي

| المستوى | الآلية | التكرار | المسؤول |
|---|---|---|---|
| **محلي** | تحميل CSV على الجهاز | يدوي (بضغطة زر) | المدير |
| **Google Drive** | OAuth 2.0 + Drive API | يدوي (بضغطة زر) | المدير |
| **Supabase Storage** | `pg_cron` + Edge Function | تلقائي كل 24 ساعة | النظام |

### إعداد Cron Job في Supabase
```sql
-- تشغيل من Supabase SQL Editor
SELECT cron.schedule(
  'daily-backup',
  '0 2 * * *',   -- كل يوم الساعة 2 صباحاً
  $$ SELECT net.http_post(
    url := 'https://xxxx.supabase.co/functions/v1/backup',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  ) $$
);
```

---

## 8. مراحل التنفيذ

### المرحلة 1 — إعداد Supabase `(اليوم 1–2)`
- [ ] إنشاء مشروع Supabase واستخراج URL والـ anon key
- [ ] تنفيذ SQL Schema (جدولي profiles وattendance)
- [ ] إعداد سياسات RLS
- [ ] اختبار الصلاحيات من SQL Editor

### المرحلة 2 — نظام المصادقة `(اليوم 3–4)`
- [ ] كتابة `js/core/auth.js` كاملاً
- [ ] بناء `login.html` مع منطق التوجيه حسب الدور
- [ ] إضافة `routeGuard()` في بداية كل صفحة
- [ ] اختبار: دخول موظف ومدير والتأكد من التوجيه الصحيح

### المرحلة 3 — تصميم الواجهات `(اليوم 5–7)`
- [ ] `employee.html` — بطاقة حضور + جدول السجلات الشخصية
- [ ] `admin.html` — 3 تبويبات (ملخص / موظفون / سجلات / نسخ احتياطي)
- [ ] تطبيق Material 3 Design System
- [ ] لون مميز للشريط العلوي في واجهة المدير
- [ ] اختبار التجاوب على موبايل وسطح مكتب

### المرحلة 4 — طبقة الشبكة والمزامنة `(اليوم 8–10)`
- [ ] كتابة `js/api/client.js` (fetch wrapper)
- [ ] كتابة `js/api/hr_api.js` (checkIn / checkOut / getAttendance)
- [ ] تطبيق `js/core/geofence.js` وربطه بزر الحضور
- [ ] بناء Offline Queue في IndexedDB
- [ ] اختبار: إيقاف الإنترنت → تسجيل حضور → إعادة الاتصال والمزامنة

### المرحلة 5 — النسخ الاحتياطي الثلاثي `(اليوم 11–13)`
- [ ] كتابة `js/admin/backup.js` (تصدير CSV)
- [ ] إعداد Google Cloud Console وتفعيل Drive API
- [ ] كتابة منطق رفع الملف على Google Drive (OAuth 2.0)
- [ ] إعداد `pg_cron` وEdge Function للنسخ التلقائي على Supabase Storage
- [ ] اختبار: تصدير CSV + رفع على Drive + التحقق من Supabase Storage

### المرحلة 6 — الاختبار والنشر على Hostinger `(اليوم 14–15)`
- [ ] تشغيل كل سيناريوهات الاختبار (انظر القسم 9)
- [ ] رفع الملفات على `public_html` في Hostinger عبر File Manager أو FTP
- [ ] التحقق من تفعيل HTTPS التلقائي من Hostinger
- [ ] اختبار Service Worker وملف `manifest.json`
- [ ] اختبار تثبيت التطبيق على Android وiPhone

---

## 9. سيناريوهات الاختبار الإلزامية

قبل اعتبار أي مرحلة منتهية، يجب اجتياز هذه الاختبارات:

| # | السيناريو | النتيجة المتوقعة |
|---|---|---|
| 1 | دخول موظف بصلاحيات admin | ❌ يُرفض — يُحوَّل لـ login |
| 2 | دخول موظف بحساب صحيح | ✅ employee.html |
| 3 | دخول مدير بحساب صحيح | ✅ admin.html |
| 4 | تسجيل حضور داخل النطاق | ✅ يُسجَّل في Supabase |
| 5 | تسجيل حضور خارج النطاق | ❌ رسالة خطأ واضحة |
| 6 | قطع الإنترنت ثم تسجيل حضور | ✅ يُحفظ في IndexedDB |
| 7 | إعادة الإنترنت بعد السيناريو 6 | ✅ مزامنة تلقائية |
| 8 | موظف يحاول رؤية بيانات زميله | ❌ RLS ترفض الطلب |
| 9 | تصدير CSV من لوحة المدير | ✅ ملف يُحمَّل على الجهاز |
| 10 | رفع نسخة على Google Drive | ✅ ملف يظهر في Drive |

---

## 10. قواعد الكود الثابتة

يجب أن يلتزم أي كود يُكتب في هذا المشروع بهذه القواعد دون استثناء:

```
✅ يجب دائماً:
   - Vanilla JavaScript ES6+ فقط (import/export، async/await، arrow functions)
   - معالجة كل الأخطاء بـ try/catch مع رسالة للمستخدم
   - التعليقات بالعربية داخل الكود
   - التحقق من صلاحية المستخدم قبل أي عملية حساسة
   - استخدام HTTPS دائماً (مطلوب لـ Geolocation وPWA)

❌ يُحظر تماماً:
   - تخزين JWT أو كلمات مرور في localStorage
   - كتابة أي Backend كود على Hostinger
   - استخدام أي Framework (React, Vue, Angular...)
   - تجاهل أخطاء الشبكة بدون معالجة
   - تخزين Service Role Key في أي ملف Frontend
```

---

## 11. المتغيرات الحساسة

| المتغير | مكان التخزين | ملاحظة |
|---|---|---|
| `SUPABASE_URL` | `js/config.js` | عام — مقبول في Frontend |
| `SUPABASE_ANON_KEY` | `js/config.js` | عام — محمي بـ RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Functions فقط | **سري — لا يُكتب في Frontend أبداً** |
| `GOOGLE_OAUTH_CLIENT_ID` | `js/admin/backup.js` | عام — مقبول في Frontend |

---

## 12. المراجع التقنية

- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Supabase pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- Google Drive API: https://developers.google.com/drive/api/guides/manage-uploads
- PWA Guide (MDN): https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

---

*آخر تحديث: يونيو 2025 — أي تعارض بين هذا الملف وأي تعليمات أخرى، يُقدَّم هذا الملف.*
