# Milestones — Architectural Weekly Planner 🏛️

A minimalist, high-productivity weekly planner and habit tracker inspired by luxury editorial aesthetics and architectural order. Designed to help you structure your commitments with intention across natural 7-day cycles (Monday to Sunday).

![Milestones Planner Header](public/spiderman-icon.png)

---

## ✨ Features

- **Natural 7-Day Rhythm:** Dedicated daily focus workspaces from Monday morning to Sunday evening.
- **Weekly Master Bucket:** Organize overarching, non-daily projects and themes for the whole week.
- **Time Budgeting & Energy Tagging:** Assign realistic durations (15m, 30m, 1h, 2h) to balance your daily cognitive workload.
- **Smart Recurring Habits:** Automatically repeat tasks forward across days, with safe options to delete a single day or all future instances.
- **Sunday Ritual & Retrospective:** Dedicated reflections scratchpad with one-click **Carry Forward** for unfinished milestones.
- **12-Month Analytics & Consistency:** Track all-time completion trends, monthly rates, and consistency charts.
- **Executive Reports:** Generate printable PDF summaries or export clean CSV spreadsheets for any week, month, or full year.
- **Interactive Onboarding Tour:** Built-in multi-step walkthrough to get up and running quickly.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Icons & Typography:** Lucide React, Google Fonts (*Playfair Display*, *Plus Jakarta Sans*, *JetBrains Mono*)
- **Backend & Auth:** Supabase (Auth + PostgreSQL with Row-Level Security)
- **Deployment:** Vercel / Netlify with SPA routing rewrites

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Artifact19/milestones-planner.git
cd milestones-planner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start local development
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 🔒 Security & Privacy

- **Row-Level Security (RLS):** All milestones and weekly notes are isolated per user (`auth.uid() = user_id`). Unauthenticated or unauthorized queries return 0 rows.
- **Zero Secret Exposure:** Only the public Supabase Anon key is used on the client; the database `service_role` key is strictly kept server-side.
