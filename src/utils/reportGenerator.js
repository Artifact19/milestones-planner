import {
  parseDateString,
  addDays,
  formatShortDate,
  formatDuration,
  formatWeekRange,
  DAY_NAMES,
  TAG_OPTIONS,
  normalizeCategory
} from './dateUtils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Determine exact date of a task
function getTaskDate(task) {
  const monday = parseDateString(task.week_start_date)
  if (task.day_of_week >= 1 && task.day_of_week <= 7) {
    return addDays(monday, task.day_of_week - 1)
  }
  return monday
}

// Compile structured report data based on report type
export function compileReportData({
  type = 'weekly', // 'weekly' | 'monthly' | 'yearly'
  milestones = [],
  weekStart = new Date(),
  targetYear = new Date().getFullYear(),
  targetMonthIndex = new Date().getMonth(), // 0-indexed
  userEmail = 'User',
  weeklyNote = '',
  selectedCategory = 'all'
}) {
  let filteredMilestones = []
  let periodTitle = ''
  let subtitle = ''

  if (type === 'weekly') {
    const mondayStr = formatWeekRange(weekStart)
    periodTitle = `Weekly Milestone Report`
    subtitle = mondayStr

    // Filter milestones for this week
    const targetWeekStartStr = weekStart.toISOString().split('T')[0]
    filteredMilestones = milestones.filter((m) => {
      return m.week_start_date === targetWeekStartStr || m.week_start_date === weekStart
    })
    // If not filtered by exact string, match by week start local date
    if (filteredMilestones.length === 0) {
      const wY = weekStart.getFullYear()
      const wM = String(weekStart.getMonth() + 1).padStart(2, '0')
      const wD = String(weekStart.getDate()).padStart(2, '0')
      const localStr = `${wY}-${wM}-${wD}`
      filteredMilestones = milestones.filter((m) => m.week_start_date === localStr)
    }
  } else if (type === 'monthly') {
    const monthName = MONTH_NAMES[targetMonthIndex]
    periodTitle = `Monthly Milestone Report`
    subtitle = `${monthName} ${targetYear}`

    filteredMilestones = milestones.filter((m) => {
      const d = getTaskDate(m)
      return d.getFullYear() === targetYear && d.getMonth() === targetMonthIndex
    })
  } else {
    // Yearly
    periodTitle = `Annual Milestone Report`
    subtitle = `Year ${targetYear} Performance Review`

    filteredMilestones = milestones.filter((m) => {
      const d = getTaskDate(m)
      return d.getFullYear() === targetYear
    })
  }

  // Summary Metrics
  const total = filteredMilestones.length
  const completed = filteredMilestones.filter((m) => m.is_completed).length
  const pending = total - completed
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  let focusMinutes = 0
  let breakMinutes = 0
  let careerCount = 0
  let collegeCount = 0
  let personalCount = 0
  let careerFocusMinutes = 0
  let collegeFocusMinutes = 0
  let personalFocusMinutes = 0

  filteredMilestones.forEach((m) => {
    const isComp = Boolean(m.is_completed)
    const dur = m.duration_minutes ?? 30
    const brk = m.break_minutes ?? 5
    const cat = normalizeCategory(m.tag)
    if (isComp) {
      focusMinutes += dur
      breakMinutes += brk
      if (cat === 'career') careerFocusMinutes += dur
      else if (cat === 'college') collegeFocusMinutes += dur
      else personalFocusMinutes += dur
    }
    if (cat === 'career') careerCount++
    else if (cat === 'college') collegeCount++
    else personalCount++
  })

  // Group by day or month depending on type
  const dayGroups = {}
  if (type === 'weekly') {
    for (let i = 0; i <= 7; i++) {
      dayGroups[i] = {
        name: DAY_NAMES[i],
        tasks: filteredMilestones.filter((m) => m.day_of_week === i)
      }
    }
  }

  // Monthly breakdown for yearly report
  const monthBreakdown = []
  if (type === 'yearly') {
    for (let m = 0; m < 12; m++) {
      const monthTasks = filteredMilestones.filter((task) => getTaskDate(task).getMonth() === m)
      const mTotal = monthTasks.length
      const mComp = monthTasks.filter((t) => t.is_completed).length
      const mPercent = mTotal > 0 ? Math.round((mComp / mTotal) * 100) : 0
      monthBreakdown.push({
        monthName: MONTH_NAMES[m],
        total: mTotal,
        completed: mComp,
        percent: mPercent,
        focusMinutes: monthTasks
          .filter((t) => t.is_completed)
          .reduce((acc, t) => acc + (t.duration_minutes ?? 30), 0)
      })
    }
  }

  return {
    type,
    periodTitle,
    subtitle,
    userEmail,
    generatedAt: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    total,
    completed,
    pending,
    percent,
    focusMinutes,
    breakMinutes,
    totalMinutes: focusMinutes + breakMinutes,
    careerCount,
    collegeCount,
    personalCount,
    careerFocusMinutes,
    collegeFocusMinutes,
    personalFocusMinutes,
    focusByCategory: {
      career: careerFocusMinutes,
      college: collegeFocusMinutes,
      personal: personalFocusMinutes
    },
    selectedCategory,
    milestones: filteredMilestones,
    dayGroups,
    monthBreakdown,
    weeklyNote
  }
}

// Sanitize string to prevent XSS injection in HTML reports
export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Mitigate CSV Formula Injection (CWE-1236)
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""'
  let str = String(value)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str
  }
  return `"${str.replace(/"/g, '""')}"`
}

// Download report as CSV spreadsheet
export function exportToCSV(reportData) {
  const { periodTitle, subtitle, milestones } = reportData

  const headers = [
    'ID',
    'Title',
    'Status',
    'Day of Week',
    'Assigned Date',
    'Category Tag',
    'Focus Time (min)',
    'Break Time (min)',
    'Total Budgeted (min)',
    'Week Start Date'
  ]

  const rows = milestones.map((m) => {
    const taskDate = getTaskDate(m)
    const dateFormatted = taskDate.toISOString().split('T')[0]
    const dayName = DAY_NAMES[m.day_of_week] || 'Weekly'
    const status = m.is_completed ? 'Completed' : 'Pending'
    const tagObj = TAG_OPTIONS.find((t) => t.id === m.tag)
    const tagLabel = tagObj ? tagObj.label : 'Career / Study'
    const dur = m.duration_minutes ?? 30
    const brk = m.break_minutes ?? 5

    return [
      sanitizeCsvCell(m.id),
      sanitizeCsvCell(m.title),
      sanitizeCsvCell(status),
      sanitizeCsvCell(dayName),
      sanitizeCsvCell(dateFormatted),
      sanitizeCsvCell(tagLabel),
      dur,
      brk,
      dur + brk,
      sanitizeCsvCell(m.week_start_date)
    ]
  })

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanTitle = (subtitle || periodTitle).replace(/[^a-zA-Z0-9]/g, '_')
  a.href = url
  a.download = `Milestones_Report_${cleanTitle}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Open and print executive PDF report
export function printExecutiveReport(reportData) {
  const {
    periodTitle,
    subtitle,
    userEmail,
    generatedAt,
    total,
    completed,
    pending,
    percent,
    focusMinutes,
    breakMinutes,
    totalMinutes,
    careerCount,
    collegeCount,
    personalCount,
    milestones,
    type,
    dayGroups,
    monthBreakdown,
    weeklyNote
  } = reportData

  const printWindow = window.open('', '_blank', 'width=950,height=850')
  if (!printWindow) {
    alert('Please allow popups to generate and print your PDF report.')
    return
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${periodTitle} — ${subtitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #FFFFFF;
      color: #1C1917;
      line-height: 1.5;
      padding: 30px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1C1917;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .monogram {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #FFFFFF;
      border: 1px solid #E5E0D8;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1C1917;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #78716C;
      font-weight: 600;
    }

    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #57534E;
    }

    .meta-box strong {
      color: #1C1917;
      display: block;
      font-size: 13px;
    }

    .report-title-card {
      background: #FAF8F5;
      border: 1px solid #E5E0D8;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .report-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #1C1917;
    }

    .report-subtitle {
      font-size: 14px;
      color: #695431;
      font-weight: 600;
      margin-top: 2px;
    }

    .badge-percent {
      background: #1C1917;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 9999px;
      font-family: monospace;
      font-size: 16px;
      font-weight: 700;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 25px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E5E0D8;
      border-radius: 14px;
      padding: 14px 16px;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #78716C;
    }

    .kpi-value {
      font-size: 22px;
      font-weight: 800;
      font-family: monospace;
      color: #1C1917;
      margin-top: 4px;
    }

    .progress-bar-container {
      background: #E5E0D8;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 25px;
    }

    .progress-bar-fill {
      background: #224A32;
      height: 100%;
      border-radius: 9999px;
      width: ${percent}%;
    }

    h2.section-heading {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1C1917;
      border-bottom: 1px solid #E5E0D8;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      font-size: 12px;
    }

    table.data-table th {
      background: #FAF8F5;
      text-align: left;
      padding: 8px 12px;
      font-weight: 700;
      color: #57534E;
      border-bottom: 1px solid #E5E0D8;
      text-transform: uppercase;
      font-size: 11px;
    }

    table.data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #F0ECE6;
      vertical-align: middle;
    }

    .tag-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #E5E0D8;
      background: #FAF8F5;
    }

    .status-completed {
      color: #224A32;
      font-weight: 700;
    }

    .status-pending {
      color: #A8A29E;
    }

    .reflection-box {
      background: #FAF8F5;
      border: 1px solid #E5E0D8;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 25px;
      font-size: 13px;
      color: #44403C;
      font-style: italic;
      line-height: 1.6;
    }

    .footer {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px solid #E5E0D8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #A8A29E;
    }

    .print-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 25px;
    }

    .btn-print {
      background: #1C1917;
      color: #FFFFFF;
      border: none;
      padding: 10px 22px;
      border-radius: 9999px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }

    .btn-print:hover {
      background: #000;
    }

    @media print {
      .print-actions {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <header class="header">
    <div class="brand">
      <div class="monogram">
        <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/favicon.png" alt="Milestones Icon" style="width: 34px; height: 34px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.parentElement.innerText='M';" />
      </div>
      <div>
        <div class="brand-title">MILESTONES</div>
        <div class="brand-subtitle">Architectural Milestone Report</div>
      </div>
    </div>
    <div class="meta-box">
      <strong>${escapeHtml(userEmail)}</strong>
      <span>Report Date: ${escapeHtml(generatedAt)}</span>
    </div>
  </header>

  <div class="report-title-card">
    <div>
      <h1 class="report-title">${escapeHtml(periodTitle)}</h1>
      <div class="report-subtitle">${escapeHtml(subtitle)}</div>
    </div>
    <div class="badge-percent">${percent}% Completed</div>
  </div>

  <div class="progress-bar-container">
    <div class="progress-bar-fill"></div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Tasks Finished</div>
      <div class="kpi-value">${completed} <span style="font-size: 13px; color: #78716C;">/ ${total}</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Completion Rate</div>
      <div class="kpi-value">${percent}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Completed Focus Time</div>
      <div class="kpi-value">${formatDuration(focusMinutes)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Time Budgeted</div>
      <div class="kpi-value">${formatDuration(totalMinutes)}</div>
    </div>
  </div>

  ${
    type === 'yearly' && monthBreakdown.length > 0
      ? `
    <h2 class="section-heading">Month-by-Month Performance Overview</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Completed</th>
          <th>Total</th>
          <th>Rate</th>
          <th>Focus Time</th>
          <th>Visual Progress</th>
        </tr>
      </thead>
      <tbody>
        ${monthBreakdown
          .map(
            (mb) => `
          <tr>
            <td><strong>${escapeHtml(mb.monthName)}</strong></td>
            <td>${mb.completed}</td>
            <td>${mb.total}</td>
            <td><strong>${mb.percent}%</strong></td>
            <td>${formatDuration(mb.focusMinutes)}</td>
            <td style="width: 140px;">
              <div style="background: #E5E0D8; height: 6px; border-radius: 9999px; overflow: hidden;">
                <div style="background: #1C1917; height: 100%; width: ${mb.percent}%;"></div>
              </div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    `
      : ''
  }

  <h2 class="section-heading">Milestone Item Details (${total} Total Tasks)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28px;">✓</th>
        <th>Task Title</th>
        <th>Schedule</th>
        <th>Category</th>
        <th>Focus</th>
        <th>Break</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        milestones.length === 0
          ? '<tr><td colspan="7" style="text-align: center; color: #A8A29E; padding: 20px;">No milestones recorded for this period.</td></tr>'
          : milestones
              .map((m) => {
                const dayName = DAY_NAMES[m.day_of_week] || 'Weekly'
                const tagObj = TAG_OPTIONS.find((t) => t.id === m.tag) || TAG_OPTIONS[0]
                const statusClass = m.is_completed ? 'status-completed' : 'status-pending'
                const statusText = m.is_completed ? 'Completed' : 'Pending'
                const checkIcon = m.is_completed ? '☑' : '☐'

                return `
              <tr>
                <td style="font-size: 15px;">${checkIcon}</td>
                <td><strong>${escapeHtml(m.title)}</strong></td>
                <td>${escapeHtml(dayName)}</td>
                <td><span class="tag-pill">${escapeHtml(tagObj.label)}</span></td>
                <td>${formatDuration(m.duration_minutes ?? 30)}</td>
                <td>${formatDuration(m.break_minutes ?? 5)}</td>
                <td class="${statusClass}">${escapeHtml(statusText)}</td>
              </tr>
            `
              })
              .join('')
      }
    </tbody>
  </table>

  ${
    weeklyNote && weeklyNote.trim()
      ? `
    <h2 class="section-heading">Sunday Reflection & Architecture Note</h2>
    <div class="reflection-box">
      "${escapeHtml(weeklyNote)}"
    </div>
    `
      : ''
  }

  <div class="footer">
    <span>Generated by Milestones — Weekly Architectural Planner</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    // Auto-trigger print after font load
    window.onload = function() {
      setTimeout(function() {
        // user can click button or print directly
      }, 500);
    }
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
