# Milestones Planner

A weekly planner designed around 7-day cycles (Monday to Sunday). It helps you define high-level weekly goals, schedule daily tasks, maintain recurring routines, and review your progress without the clutter of heavyweight project management software.

---

## Key Features

- **7-Day Weekly Rhythm**: Dedicated daily views from Monday to Sunday, plus a central **Weekly Master** view for overarching priorities.
- **Weekly Master & Daily Subtasks**: Plan big milestones for the week, then break them down into actionable daily items across specific days.
- **Flexible Recurring Tasks**: Schedule repeating habits across any combination of days. Complete tasks individually or in batches, with safe options to delete single days or full series.
- **Time Estimates & Tagging**: Assign duration estimates (15m, 30m, 1h, 2h) and tags to keep daily workloads balanced and realistic.
- **Sunday Review & Rollover**: Dedicated Sunday retrospective space to write notes, review completion rates, and roll unfinished milestones forward to the next week in one click.
- **Analytics & Exports**: View completion trends over time and export summaries as CSV files or printable review sheets.
- **User Authentication & Privacy**: Secure authentication and row-level security (RLS) powered by Supabase—ensuring your data stays private and accessible only to your account.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite |
| **Styling** | Tailwind CSS, Plus Jakarta Sans, Playfair Display |
| **Icons** | Lucide React |
| **Backend & Auth** | Supabase (PostgreSQL with Row-Level Security) |
| **Deployment** | Vercel / Netlify (SPA rewrites configured) |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

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
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `user_id` (uuid, references `auth.users(id)`, default `auth.uid()`)
- `title` (text, not null)
- `completed` (boolean, default `false`)
- `day_of_week` (integer, `0` for Weekly Master, `1-7` for Mon-Sun)
- `week_start_date` (date, not null - ISO Monday date `YYYY-MM-DD`)
- `duration_minutes` (integer, default `30`)
- `tag` (text, default `'Deep Work'`)
- `series_id` (uuid, optional, links recurring task instances)
- `parent_id` (uuid, optional, references parent milestone)
- `created_at` (timestamptz, default `now()`)

#### `weekly_notes`
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `user_id` (uuid, references `auth.users(id)`, default `auth.uid()`)
- `week_start_date` (date, not null)
- `note` (text, default `''`)
- `updated_at` (timestamptz, default `now()`)

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

The output will be in the `dist/` directory ready for deployment.

---

## Project Structure

```
milestones-planner/
├── public/
│   ├── _redirects           # SPA routing fallback for deployment
│   └── favicon.png          # App icon
├── src/
│   ├── components/
│   │   ├── AddTaskInput.jsx        # Task creation input with recurrence options
│   │   ├── AuthPage.jsx            # Sign-in and registration screen
│   │   ├── DaySidebar.jsx          # Day selector and progress sidebar
│   │   ├── FocusedDayView.jsx      # Main day task list and day controls
│   │   ├── MasterCompletionModal.jsx # Completion handler for master milestones
│   │   ├── ProfileModal.jsx        # Account and profile management
│   │   ├── ReportModal.jsx         # Analytics and export modal (CSV/print)
│   │   ├── SundayCard.jsx          # Sunday review and milestone rollover
│   │   ├── TaskItem.jsx            # Individual task item with edit/delete controls
│   │   ├── TopBar.jsx              # Navigation bar and week controls
│   │   ├── TutorialModal.jsx       # Guided walkthrough for new users
│   │   └── WeekSwitcher.jsx        # Previous / next week selector
│   ├── context/
│   │   └── AuthContext.jsx         # Supabase auth state and session provider
│   ├── hooks/
│   │   ├── useAnalytics.js         # Completion metrics and trend calculations
│   │   ├── useMilestones.js        # Milestones CRUD and state management
│   │   └── useWeeklyNote.js        # Weekly retrospective notes hook
│   ├── lib/
│   │   └── supabaseClient.js       # Supabase client initialization
│   ├── utils/
│   │   ├── dateUtils.js            # Date formatting and week calculation helpers
│   │   └── reportGenerator.js      # CSV and print report formatting
│   ├── App.jsx                     # Application shell and view routing
│   ├── index.css                   # Global styles and typography rules
│   └── main.jsx                    # Application entry point
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## License

MIT
