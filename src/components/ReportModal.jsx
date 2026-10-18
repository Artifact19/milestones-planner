import { useState, useMemo } from 'react'
import {
  X,
  FileText,
  Printer,
  FileSpreadsheet
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import {
  compileReportData,
  exportToCSV,
  printExecutiveReport
} from '../utils/reportGenerator'
import { formatDuration } from '../utils/dateUtils'

const MONTH_OPTIONS = [
  { id: 0, label: 'January' },
  { id: 1, label: 'February' },
  { id: 2, label: 'March' },
  { id: 3, label: 'April' },
  { id: 4, label: 'May' },
  { id: 5, label: 'June' },
  { id: 6, label: 'July' },
  { id: 7, label: 'August' },
  { id: 8, label: 'September' },
  { id: 9, label: 'October' },
  { id: 10, label: 'November' },
  { id: 11, label: 'December' }
]

export default function ReportModal({
  isOpen,
  onClose,
  weekStart,
  currentWeekMilestones = []
}) {
  const { user } = useAuth()
  const { milestones: allMilestones, currentYear } = useAnalytics()

  const [reportType, setReportType] = useState('weekly') // 'weekly' | 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())

  // Compile active report data dynamically
  const activeReport = useMemo(() => {
    // If weekly report is chosen, we can prefer currentWeekMilestones or allMilestones
    const dataset = reportType === 'weekly' && currentWeekMilestones.length > 0
      ? currentWeekMilestones
      : allMilestones

    return compileReportData({
      type: reportType,
      milestones: dataset,
      weekStart: weekStart || new Date(),
      targetYear: selectedYear,
      targetMonthIndex: selectedMonth,
      userEmail: user?.email || 'User'
    })
  }, [
    reportType,
    currentWeekMilestones,
    allMilestones,
    weekStart,
    selectedYear,
    selectedMonth,
    user
  ])

  if (!isOpen) return null

  const handlePrint = () => {
    printExecutiveReport(activeReport)
  }

  const handleCSV = () => {
    exportToCSV(activeReport)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center text-xs font-serif font-bold shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1C1917] tracking-tight">
                Export Milestone Reports
              </h2>
              <p className="text-xs text-[#78716C]">
                Print-ready executive PDF and spreadsheet downloads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] text-stone-400 hover:text-[#1C1917] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. Report Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
              Select Report Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType('weekly')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  reportType === 'weekly'
                    ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-sm'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>Weekly</span>
                <span className="text-[10px] opacity-70 font-normal">Current Week</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  reportType === 'monthly'
                    ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-sm'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>Monthly</span>
                <span className="text-[10px] opacity-70 font-normal">Month by Month</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('yearly')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  reportType === 'yearly'
                    ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-sm'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] opacity-70 font-normal">Full Year Review</span>
              </button>
            </div>
          </div>

          {/* 2. Date filters if monthly or yearly */}
          {reportType === 'monthly' && (
            <div className="flex items-center gap-2 text-xs bg-white p-3 rounded-2xl border border-[#E5E0D8]">
              <span className="text-[#78716C] font-semibold">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} {selectedYear}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'yearly' && (
            <div className="flex items-center gap-2 text-xs bg-white p-3 rounded-2xl border border-[#E5E0D8]">
              <span className="text-[#78716C] font-semibold">Select Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
              </select>
            </div>
          )}

          {/* 3. Live Report Summary Preview Card */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Report Preview
                </span>
                <h3 className="font-bold text-sm sm:text-base text-[#1C1917] mt-0.5">
                  {activeReport.periodTitle}
                </h3>
                <p className="text-xs text-[#695431] font-medium">
                  {activeReport.subtitle}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-[#1C1917] text-white font-mono font-bold text-xs shadow-sm">
                  {activeReport.percent}% Done
                </span>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Completed</span>
                <span className="font-bold font-mono text-[#224A32] text-sm sm:text-base">
                  {activeReport.completed}/{activeReport.total}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Focus Time</span>
                <span className="font-bold font-mono text-[#1C1917] text-sm sm:text-base">
                  {formatDuration(activeReport.focusMinutes)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Category Tag</span>
                <span className="font-semibold text-xs text-[#57534E]">
                  {activeReport.careerCount} Career • {activeReport.collegeCount} Coll
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#E5E0D8] rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${activeReport.percent}%` }}
                  className="bg-[#224A32] h-full rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>0%</span>
                <span>{activeReport.percent}% achievement rate</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Download Actions */}
        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#78716C] text-center sm:text-left">
            Choose format to export or save:
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* CSV Download Button */}
            <button
              type="button"
              onClick={handleCSV}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#1C1917] text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#224A32]" />
              <span>Export CSV</span>
            </button>

            {/* Print / Save to PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-semibold shadow-md shadow-stone-900/10 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
