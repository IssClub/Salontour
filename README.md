# סלון תור 💇

אפליקציית ניהול תורים לסלון יופי — React + Vite + Supabase.

---

## מבנה הפרויקט

```
salontour/
├── src/
│   ├── main.jsx              # נקודת כניסה
│   ├── App.jsx               # רכיב ראשי + routing
│   ├── lib/
│   │   ├── supabase.js       # חיבור Supabase
│   │   └── helpers.js        # פונקציות עזר (תאריכים, זמנים)
│   ├── hooks/
│   │   └── useData.js        # React hook לכל הנתונים + real-time
│   └── components/
│       ├── Topbar.jsx
│       ├── DateStrip.jsx
│       ├── DayView.jsx       # לוח יומי
│       ├── FreeView.jsx      # חלונות פנויים
│       ├── MonthView.jsx     # מבט חודשי
│       ├── ApptModal.jsx     # הוספה/עריכת תור
│       ├── DetailModal.jsx   # פרטי תור
│       ├── ClientPanel.jsx   # כרטיס לקוח
│       ├── SettingsPanel.jsx # הגדרות
│       └── PinLock.jsx       # נעילת PIN
├── public/
├── index.html
├── package.json
├── vite.config.js
├── .env.example              # משתני סביבה לדוגמה
└── supabase/
    └── schema.sql            # סכמת בסיס הנתונים
```

---

## התקנה

### 1. התקן תלויות
```bash
npm install
```

### 2. הגדר Supabase

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. ב-SQL Editor הרץ את `supabase/schema.sql`
3. העתק את ה-URL וה-anon key מ-Settings → API

### 3. הגדר משתני סביבה
```bash
cp .env.example .env
```
ערוך את `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. הפעל
```bash
npm run dev
```

---

## פריסה (Netlify / Vercel)

```bash
npm run build
# העלה את תיקיית dist/
```

הוסף את משתני הסביבה גם בפלטפורמת הפריסה.

---

## טבלאות Supabase

| טבלה | תיאור |
|------|--------|
| `settings` | הגדרות סלון (שעות, PIN, שם) |
| `providers` | מטפלים |
| `appointments` | תורים |
| `clients` | לקוחות |
| `vacations` | חופשות עובדים |

---

## אבטחה

- כל הטבלאות מוגנות ב-Row Level Security (RLS)
- PIN מוצפן ב-localStorage בלבד (לא נשמר ב-Supabase)
- מספרי טלפון של לקוחות **לא** חשופים ב-API ללא auth
