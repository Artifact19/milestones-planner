import { useState, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Award,
  Sparkles,
  LogOut,
  Loader2,
  Printer,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { useTheme } from '../context/ThemeContext'
import { formatDuration } from '../utils/dateUtils'
import { compileReportData, printExecutiveReport } from '../utils/reportGenerator'

export default function ProfileModal({ isOpen, onClose, onOpenTutorial }) {
  const { user, signOut, updateAvatar } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const {
    milestones,
    monthlyList,
    yearlyList,
    totalAll,
    completedAll,
    overallPercent,
    totalFocusMinutes,
    bestMonth,
    currentYear,
    loading: analyticsLoading
  } = useAnalytics()

  const [activeTab, setActiveTab] = useState('monthly') // 'monthly' | 'yearly'
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  // User avatar URL from metadata or localStorage
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    (user?.id ? localStorage.getItem('user_avatar_' + user.id) : null)

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  // Image resize and upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic file validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be under 5MB.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      // Scale down image to max 256x256 to ensure ultra-fast load and lightweight metadata
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const maxSize = 256
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compactDataUrl = canvas.toDataURL('image/jpeg', 0.85)

          const { error } = await updateAvatar(compactDataUrl)
          setIsUploading(false)

          if (error) {
            setUploadError(`Failed to update avatar: ${error.message}`)
          } else {
            setUploadSuccess(true)
            setTimeout(() => setUploadSuccess(false), 3000)
          }
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setIsUploading(false)
      setUploadError(err.message || 'Error processing image')
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    const { error } = await updateAvatar(null)
    setIsUploading(false)
    if (error) {
      setUploadError(`Could not remove photo: ${error.message}`)
    }
  }

  const activeMonthData = monthlyList[selectedMonthIndex] || monthlyList[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center text-xs font-serif font-bold shadow-sm">
              M
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1C1917] tracking-tight">
                Profile & Analytics
              </h2>
              <p className="text-xs text-[#78716C]">
                Milestone completion history and focus metrics
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Profile Photo & Account Card */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar with Upload Hover Trigger */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#E5E0D8] shadow-md bg-[#F2EFE9] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold font-serif text-[#1C1917]">
                    {userInitial}
                  </span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Change profile picture"
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer gap-0.5"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Upload</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917] truncate">
                    {user?.email?.split('@')[0] || 'Architect'}
                  </h3>
                  <p className="text-xs text-[#78716C] truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      title="Remove custom photo"
                      className="p-1.5 rounded-full bg-white hover:bg-rose-50 border border-[#E5E0D8] text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {uploadSuccess && (
                <p className="text-xs text-emerald-700 font-medium mt-2 animate-in fade-in">
                  ✓ Profile photo updated successfully!
                </p>
              )}

              {uploadError && (
                <p className="text-xs text-rose-600 font-medium mt-2">{uploadError}</p>
              )}

              {/* Quick High-Level Stats Strip */}
              <div className="mt-3 pt-3 border-t border-[#E5E0D8]/80 flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs">
                <span className="flex items-center gap-1 text-[#57534E]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#224A32]" />
                  <span className="font-semibold text-[#1C1917]">{completedAll}</span>
                  <span>/{totalAll} completed</span>
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-[#57534E]">
                  <Clock className="w-3.5 h-3.5 text-[#695431]" />
                  <span className="font-semibold text-[#1C1917]">
                    {formatDuration(totalFocusMinutes)}
                  </span>
                  <span>focused</span>
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-[#57534E]">
                  <Award className="w-3.5 h-3.5 text-[#1C1917]" />
                  <span className="font-bold text-[#1C1917]">{overallPercent}%</span>
                  <span>overall rate</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Tab Navigation for Analytics */}
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('monthly')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'bg-[#1C1917] text-white shadow-sm'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border border-[#E5E0D8]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Monthly Graph ({currentYear})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('yearly')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'yearly'
                    ? 'bg-[#1C1917] text-white shadow-sm'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border border-[#E5E0D8]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Yearly & Quarters</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const report = compileReportData({
                  type: activeTab,
                  milestones,
                  targetYear: currentYear,
                  targetMonthIndex: selectedMonthIndex,
                  userEmail: user?.email || 'User'
                })
                printExecutiveReport(report)
              }}
              title="Print or save executive PDF report"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#1C1917] text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#224A32]" />
              <span className="hidden sm:inline">Print / PDF Report</span>
            </button>
          </div>

          {/* Section 3: Graphs Display */}
          {analyticsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1C1917]" />
              <p className="text-xs uppercase tracking-wider font-semibold">
                Calculating completion stats…
              </p>
            </div>
          ) : activeTab === 'monthly' ? (
            /* =================== MONTHLY GRAPH =================== */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-[#1C1917] tracking-tight">
                    Monthly Milestone Completion (%)
                  </h4>
                  <p className="text-xs text-[#78716C]">
                    Percentage of planned tasks marked completed across months
                  </p>
                </div>

                {bestMonth && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EB] border border-[#E8DAC5] text-[#695431] text-xs font-medium self-start sm:self-auto">
                    <Sparkles className="w-3.5 h-3.5 text-[#695431]" />
                    <span>
                      Best Month: <strong className="font-bold">{bestMonth.monthShort} ({bestMonth.percent}%)</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Architectural Bar Chart */}
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div className="relative pt-6 pb-2 min-w-[420px] sm:min-w-0">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 pb-7">
                  <div className="border-b border-dashed border-[#E5E0D8] w-full relative">
                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-stone-400">100%</span>
                  </div>
                  <div className="border-b border-dashed border-[#E5E0D8] w-full relative">
                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-stone-400">75%</span>
                  </div>
                  <div className="border-b border-dashed border-[#E5E0D8] w-full relative">
                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-stone-400">50%</span>
                  </div>
                  <div className="border-b border-dashed border-[#E5E0D8] w-full relative">
                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-stone-400">25%</span>
                  </div>
                  <div className="border-b border-[#E5E0D8] w-full relative">
                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-stone-400">0%</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-2 h-44 items-end px-1 sm:px-2">
                  {monthlyList.map((m) => {
                    const isSelected = m.monthIndex === selectedMonthIndex
                    const heightPercent = m.total > 0 ? Math.max(m.percent, 6) : 0

                    // Dynamic bar colors based on achievement
                    let barColor = 'bg-[#1C1917]'
                    let badgeBg = 'bg-[#1C1917] text-white'

                    if (m.percent >= 80) {
                      barColor = 'bg-[#224A32]'
                      badgeBg = 'bg-[#224A32] text-white'
                    } else if (m.percent >= 50) {
                      barColor = 'bg-[#695431]'
                      badgeBg = 'bg-[#695431] text-white'
                    } else if (m.total > 0) {
                      barColor = 'bg-[#78716C]'
                      badgeBg = 'bg-[#78716C] text-white'
                    }

                    return (
                      <button
                        key={m.monthIndex}
                        type="button"
                        onClick={() => setSelectedMonthIndex(m.monthIndex)}
                        className={`group flex flex-col items-center h-full justify-end cursor-pointer transition-all ${
                          isSelected ? 'scale-[1.03]' : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        {/* Floating Percentage Badge above bar */}
                        <div className="h-5 flex items-center justify-center mb-1">
                          {m.total > 0 ? (
                            <span
                              className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded-full transition-all ${
                                isSelected ? badgeBg : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {m.percent}%
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-stone-300">—</span>
                          )}
                        </div>

                        {/* The Pillar / Bar */}
                        <div className="w-full max-w-[28px] h-32 bg-[#FAF8F5] rounded-xl p-0.5 border border-[#E5E0D8] flex flex-col justify-end overflow-hidden">
                          {m.total > 0 ? (
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-500 ease-out shadow-sm ${barColor} ${
                                isSelected ? 'ring-2 ring-stone-900/20' : ''
                              }`}
                            />
                          ) : (
                            <div className="w-full h-1 bg-stone-200/60 rounded-full" />
                          )}
                        </div>

                        {/* Month Label */}
                        <div className="mt-2 text-center">
                          <span
                            className={`text-[10px] sm:text-[11px] font-semibold block ${
                              isSelected
                                ? 'text-[#1C1917] underline decoration-2 underline-offset-4 font-bold'
                                : 'text-[#78716C]'
                            }`}
                          >
                            {m.monthShort}
                          </span>
                          {m.isCurrent && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#224A32] mt-0.5" title="Current Month" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

              {/* Selected Month Detail Highlight Box */}
              {activeMonthData && (
                <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[#1C1917] text-sm">
                      {activeMonthData.monthFull} {currentYear}
                    </span>
                    <span className="text-[#78716C] ml-2">
                      {activeMonthData.total > 0
                        ? `${activeMonthData.completed} of ${activeMonthData.total} tasks completed`
                        : 'No milestones recorded for this month'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E5E0D8] text-[#1C1917] font-bold">
                      Completion: {activeMonthData.percent}%
                    </span>
                    {activeMonthData.focusMinutes > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-[#EBF2EC] border border-[#CFE1D3] text-[#224A32] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(activeMonthData.focusMinutes)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* =================== YEARLY GRAPH & QUARTERS =================== */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm space-y-6">
              <div>
                <h4 className="font-bold text-sm text-[#1C1917] tracking-tight">
                  Yearly Overview & Quarterly Progression
                </h4>
                <p className="text-xs text-[#78716C]">
                  Annual completion percentage and quarter-by-quarter breakdown
                </p>
              </div>

              {/* Yearly Progress Cards */}
              <div className="space-y-4">
                {yearlyList.map((y) => (
                  <div
                    key={y.year}
                    className="border border-[#E5E0D8] rounded-2xl p-4 bg-[#FAF8F5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1C1917]" />
                        <span className="font-bold text-sm text-[#1C1917]">
                          Year {y.year}
                        </span>
                        {y.year === currentYear && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EBF2EC] text-[#224A32] border border-[#CFE1D3]">
                            Current Year
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-stone-400">Annual Rate:</span>
                        <span className="font-bold text-sm text-[#1C1917] px-2.5 py-0.5 bg-white border border-[#E5E0D8] rounded-full">
                          {y.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Overall Year Progress Bar */}
                    <div className="w-full bg-[#E5E0D8] rounded-full h-2.5 overflow-hidden">
                      <div
                        style={{ width: `${y.percent}%` }}
                        className="bg-[#1C1917] h-full rounded-full transition-all duration-700"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span>{y.completed} completed of {y.total} milestones</span>
                      {y.focusMinutes > 0 && (
                        <span>{formatDuration(y.focusMinutes)} focus logged</span>
                      )}
                    </div>

                    {/* Four Quarters Cards for this year */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5E0D8]/80">
                      {y.quarterList.map((q) => (
                        <div
                          key={q.quarter}
                          className="bg-white rounded-xl p-2.5 border border-[#E5E0D8] flex flex-col justify-between gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#57534E]">{q.quarter}</span>
                            <span className="font-mono font-bold text-[#1C1917]">
                              {q.percent}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden my-0.5">
                            <div
                              style={{ width: `${q.percent}%` }}
                              className="bg-[#224A32] h-full rounded-full"
                            />
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {q.completed}/{q.total} tasks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: All-Time Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                Completion Rate
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1917] block mt-1">
                {overallPercent}%
              </span>
              <span className="text-[10px] text-stone-400">All-time consistency</span>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                Finished Tasks
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#224A32] block mt-1">
                {completedAll}
              </span>
              <span className="text-[10px] text-stone-400">Out of {totalAll} planned</span>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                Focus Time
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#695431] block mt-1">
                {formatDuration(totalFocusMinutes)}
              </span>
              <span className="text-[10px] text-stone-400">Dedicated study/work</span>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                Top Month
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1917] block mt-1">
                {bestMonth ? `${bestMonth.monthShort}` : '—'}
              </span>
              <span className="text-[10px] text-stone-400">
                {bestMonth ? `${bestMonth.percent}% rate` : 'No data yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E0D8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                signOut()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-rose-50 border border-[#E5E0D8] hover:border-rose-200 text-[#57534E] hover:text-rose-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {onOpenTutorial && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenTutorial()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs font-medium transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Feature Tour</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] text-xs font-medium transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#DEB47E]" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#173324]" />
                  <span>Forest Dark</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
