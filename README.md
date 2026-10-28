# Milestones Planner

A weekly planner designed around intentional 7-day cycles (Monday to Sunday). It helps you define high-level weekly goals, schedule daily tasks, maintain recurring routines, and review your progress without the clutter of heavyweight project management software.

<p align="center">
  <img src="public/favicon.png" alt="Milestones Planner Icon" width="700" style="image-rendering: pixelated; border-radius: 16px;" />
</p>

---

## Key Features

- **7-Day Weekly Rhythm**: Dedicated focused daily views from Monday to Sunday, plus a central **Weekly Master** view for high-level weekly priorities.
- **Drag & Drop Task Rearranging**: Hold any task capsule or its drag handle to reorder tasks upward or downward. Visual drop indicator lines clearly indicate insertion slots above or below other tasks. Also supports quick single-click chevron buttons (`▲` / `▼`), mobile touch gestures, and accessible keyboard shortcuts (<kbd>Alt</kbd> + <kbd>↑</kbd> / <kbd>Alt</kbd> + <kbd>↓</kbd>).
- **Double-Click Capsule Inline Editing**: Double-clicking anywhere on a task card immediately opens quick inline editing for title, duration presets or custom minute inputs, rest breaks, and category tags.
- **Weekly Master & Daily Subtasks**: Plan big weekly milestones, then break them down into actionable daily execution sessions across specific days with real-time subtask progress meters.
- **Flexible Recurring Routines**: Schedule repeating habits across any combination of days (e.g. Mon–Sat). Complete tasks individually or in batches, with safe deletion options (single session vs. remaining series).
- **Time Estimates & Break Budgeting**: Assign focus durations and smart break suggestions to keep daily workloads realistic, balanced, and sustainable.
- **Cross-Week Milestone Rollover**: Move or copy unfinished weekly milestones forward to any upcoming week in one click, with options to schedule execution across weekdays while preserving originating week history.
- **Sunday Review & Reflection**: Dedicated Sunday retrospective space to write weekly notes, review completion metrics, and reflect on accomplishments before the next cycle starts.
- **Analytics & Executive Reports**: Track completion rates, total focus hours, and category distributions over time. Export summaries as structured CSVs or printable executive PDF review sheets.
- **Guided Onboarding Tour**: Built-in visual walkthrough that introduces new users to the weekly cadence, routine management, and review workflows.
- **User Authentication & Privacy**: Secure authentication and Row-Level Security (RLS) powered by Supabase—ensuring your personal planner data is strictly isolated to your account.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite |
| **Styling** | Tailwind CSS v4, Plus Jakarta Sans, Playfair Display |
| **Icons** | Lucide React |
| **Backend & Auth** | Supabase (PostgreSQL with Row-Level Security) |
| **Analytics** | Vercel Analytics |
| **Deployment** | Vercel / Netlify (SPA rewrites configured) |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### 1. Clone the repository

```bash
git clone https://github.com/Artifact19/milestones-planner.git
cd milestones-planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

An example template is provided in `.env.example`.

### 4. Database Setup (Supabase)

If setting up your own Supabase project, create the following two tables in your database:

#### `milestones`
- `id` (`uuid`, primary key, default `gen_random_uuid()`)
- `user_id` (`uuid`, references `auth.users(id)`, default `auth.uid()`)
- `title` (`text`, not null)
- `is_completed` (`boolean`, default `false`)
- `day_of_week` (`integer`, `0` for Weekly Master, `1-7` for Mon-Sun)
- `week_start_date` (`date`, not null - ISO Monday date `YYYY-MM-DD`)
- `duration_minutes` (`integer`, default `30`)
- `break_minutes` (`integer`, default `5`)
- `tag` (`text`, default `'career'`)
- `series_id` (`uuid`, optional, links recurring task instances)
- `parent_id` (`uuid`, optional, references parent milestone)
- `created_at` (`timestamptz`, default `now()`)

#### `weekly_notes`
- `id` (`uuid`, primary key, default `gen_random_uuid()`)
- `user_id` (`uuid`, references `auth.users(id)`, default `auth.uid()`)
- `week_start_date` (`date`, not null)
- `note` (`text`, default `''`)
- `updated_at` (`timestamptz`, default `now()`)

> **Note**: Enable **Row Level Security (RLS)** on both tables with policies restricting `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to `auth.uid() = user_id`.

### 5. Run local development server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 6. Build for production

```bash
npm run build
```

The compiled output will be generated in the `dist/` directory ready for deployment.

---

## Project Structure

```
milestones-planner/
├── public/
│   ├── _redirects                # SPA routing fallback for deployment
│   └── favicon.png               # App icon
├── src/
│   ├── components/
│   │   ├── AddTaskInput.jsx          # Task creation dock with batch recurrence options
│   │   ├── AuthPage.jsx              # Sign-in, registration, and password recovery
│   │   ├── DaySidebar.jsx            # Day selector navigation drawer with time budgets
│   │   ├── FocusedDayView.jsx        # Main daily and weekly workspace with task lists
│   │   ├── MasterCompletionModal.jsx # Completion handler for master milestones
│   │   ├── MoveToWeekModal.jsx       # Cross-week milestone rollover modal
│   │   ├── ProfileModal.jsx          # Account settings and productivity analytics
│   │   ├── ReportModal.jsx           # Milestone analytics and export modal (CSV/print)
│   │   ├── SundayCard.jsx            # Sunday retrospective notes and reflection
│   │   ├── TaskItem.jsx              # Task card with drag handle, inline edit, and controls
│   │   ├── TopBar.jsx                # Header bar, week switcher, and profile trigger
│   │   ├── TutorialModal.jsx         # Guided onboarding tour walkthrough
│   │   └── WeekSwitcher.jsx          # Previous / next week date navigator
│   ├── context/
│   │   └── AuthContext.jsx           # Supabase auth state and session provider
│   ├── hooks/
│   │   ├── useAnalytics.js           # Completion metrics and trend calculations
│   │   ├── useMilestones.js          # Milestones CRUD, custom ordering, and state
│   │   └── useWeeklyNote.js          # Weekly retrospective notes hook
│   ├── lib/
│   │   └── supabaseClient.js         # Supabase client initialization
│   ├── utils/
│   │   ├── dateUtils.js              # Date calculations, categories, and duration formatters
│   │   └── reportGenerator.js        # CSV generation and executive printable review sheets
│   ├── App.jsx                       # Root application shell and view coordination
│   ├── index.css                     # Global styles, Tailwind v4 imports, and theme tokens
│   └── main.jsx                      # Application entry point
├── .env.example
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## License

MIT
