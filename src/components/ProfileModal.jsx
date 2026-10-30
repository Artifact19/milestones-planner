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
  Layers,
  ChevronDown,
  Briefcase,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { formatDuration, FOCUS_CATEGORY_OPTIONS } from '../utils/dateUtils'
import { compileReportData, printExecutiveReport } from '../utils/reportGenerator'

export default function ProfileModal({ isOpen, onClose, onOpenTutorial }) {
  const { user, signOut, updateAvatar } = useAuth()
  const {
    milestones,
    monthlyList,
    yearlyList,
    totalAll,
    completedAll,
    overallPercent,
    totalFocusMinutes,
    totalPlannedFocusMinutes,
    totalFocusByCategory,
    totalPlannedFocusByCategory,
    allTimeTaskBreakdown,
    bestMonth,
    currentYear,
    loading: analyticsLoading
  } = useAnalytics()

  const [activeTab, setActiveTab] = useState('monthly') // 'monthly' | 'yearly'
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth())
  const [timeMode, setTimeMode] = useState('planned') // 'planned' | 'completed'
  const [expandedWeekNum, setExpandedWeekNum] = useState(null)
  const [focusCategory, setFocusCategory] = useState(() => {
    try {
      return localStorage.getItem('milestones_focus_category') || 'all'
    } catch {
      return 'all'
    }
  })

  const handleCategoryChange = (catId) => {
    setFocusCategory(catId)
    try {
      localStorage.setItem('milestones_focus_category', catId)
    } catch {
      // ignore localStorage errors
    }
  }

  // Active category configuration
  const activeCategoryConfig =
    FOCUS_CATEGORY_OPTIONS.find((c) => c.id === focusCategory) || FOCUS_CATEGORY_OPTIONS[0]

  // Helper to extract category focus minutes
  const getCategoryMinutes = (catMap, totalMinutes, cat = focusCategory) => {
    if (cat === 'all') return totalMinutes || 0
    return catMap?.[cat] || 0
  }

  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  // User avatar URL from metadata or localStorage
  const rawAvatar =
    user?.user_metadata?.avatar_url ||
    (user?.id ? localStorage.getItem('user_avatar_' + user.id) : null)
  const isSafeAvatar =
    typeof rawAvatar === 'string' &&
    (/^https:\/\//i.test(rawAvatar) ||
      /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(rawAvatar))
  const avatarUrl = isSafeAvatar ? rawAvatar : null

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
                Milestone completion history and per-task time audit
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

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FEF08A] border-2 border-[#1C1917] text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      signOut()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FECDD3] hover:bg-[#FDA4AF] border-2 border-[#1C1917] text-[#9F1239] text-xs font-black shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Log Out</span>
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
                    {formatDuration(getCategoryMinutes(totalFocusByCategory, totalFocusMinutes))}
                  </span>
                  <span>
                    {focusCategory === 'all'
                      ? 'completed focus'
                      : `${activeCategoryConfig.shortLabel} focus`}
                  </span>
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
                  userEmail: user?.email || 'User',
                  selectedCategory: focusCategory
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
                <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-3 sm:p-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E0D8] text-[#1C1917] font-bold font-mono text-xs shadow-2xs whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-[#224A32]" />
                        <span>{activeMonthData.monthFull} {currentYear}</span>
                        {activeMonthData.isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#224A32] ml-0.5 animate-pulse" title="Current Month" />
                        )}
                      </div>
                      <span className="text-[#78716C] text-xs">
                        {activeMonthData.total > 0
                          ? `${activeMonthData.completed} of ${activeMonthData.total} tasks completed`
                          : 'No milestones recorded for this month'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-[#E5E0D8] text-[#1C1917] font-bold">
                        Completion: {activeMonthData.percent}%
                      </span>
                      {activeMonthData.focusMinutes > 0 && (
                        <span
                          className={`px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 shadow-xs transition-all ${
                            focusCategory === 'career'
                              ? 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
                              : focusCategory === 'college'
                              ? 'bg-[#ECEAF0] border-[#DBD6E3] text-[#3E364E]'
                              : focusCategory === 'personal'
                              ? 'bg-[#F4ECE1] border-[#E8DAC5] text-[#635032]'
                              : 'bg-[#EBF2EC] border-[#CFE1D3] text-[#224A32]'
                          }`}
                          title={`${activeCategoryConfig.label}: ${formatDuration(
                            getCategoryMinutes(activeMonthData.focusByCategory, activeMonthData.focusMinutes)
                          )} completed in ${activeMonthData.monthFull}`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDuration(
                              getCategoryMinutes(activeMonthData.focusByCategory, activeMonthData.focusMinutes)
                            )}
                          </span>
                          <span className="text-[10px] font-sans font-bold opacity-80 uppercase tracking-wider">
                            {activeCategoryConfig.shortLabel}
                          </span>
                        </span>
                      )}
                    </div>
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
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#224A32]" />
                          <strong className="text-[#1C1917]">
                            {formatDuration(getCategoryMinutes(y.focusByCategory, y.focusMinutes))}
                          </strong>
                          <span>
                            {focusCategory === 'all'
                              ? 'completed focus logged'
                              : `${activeCategoryConfig.shortLabel} focus logged`}
                          </span>
                        </span>
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
                          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                            <span>{q.completed}/{q.total} tasks</span>
                            {q.focusMinutes > 0 && (
                              <span className="font-semibold text-stone-600">
                                {formatDuration(getCategoryMinutes(q.focusByCategory, q.focusMinutes))}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Performance & Focus Breakdown (Monthly when on monthly tab, All-Time when on yearly/quarters) */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="w-4 h-4 text-[#78716C]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1917]">
                    {activeTab === 'monthly'
                      ? 'Performance & Focus Breakdown'
                      : 'All-Time Performance & Focus Breakdown'}
                  </h4>
                  {activeTab === 'monthly' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF2EC] text-[#224A32] border border-[#CFE1D3] text-[11px] font-semibold font-mono whitespace-nowrap shrink-0 shadow-2xs">
                      <Calendar className="w-3 h-3 text-[#224A32]" />
                      <span>{activeMonthData.monthShort} {currentYear}</span>
                      {activeMonthData.isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#224A32] animate-pulse" title="Current Month" />
                      )}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#78716C]">
                  {activeTab === 'monthly'
                    ? `Breakdown for ${activeMonthData.monthFull} ${currentYear} • click any month bar above to inspect`
                    : 'All-time cumulative milestone completion and focus metrics'}
                </p>
              </div>

              {/* Category Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                  <Clock className="w-3.5 h-3.5 text-[#695431]" />
                  <span className="font-medium text-[11px] uppercase tracking-wider">
                    Focus Filter:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('all')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      focusCategory === 'all'
                        ? 'bg-[#1C1917] text-white font-bold shadow-xs'
                        : 'bg-white border border-[#E5E0D8] text-[#57534E] hover:text-[#1C1917] hover:border-stone-400'
                    }`}
                  >
                    <span>All:</span>
                    <strong>
                      {formatDuration(
                        activeTab === 'monthly'
                          ? activeMonthData.focusMinutes
                          : totalFocusMinutes
                      )}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('career')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      focusCategory === 'career'
                        ? 'bg-[#224A32] text-white font-bold shadow-xs ring-1 ring-[#224A32]'
                        : 'bg-white text-[#244E35] border border-[#D2E4D6] hover:bg-[#EBF2EC]'
                    }`}
                  >
                    <span>Career:</span>
                    <strong>
                      {formatDuration(
                        activeTab === 'monthly'
                          ? activeMonthData.focusByCategory?.career || 0
                          : totalFocusByCategory?.career || 0
                      )}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('college')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      focusCategory === 'college'
                        ? 'bg-[#3E364E] text-white font-bold shadow-xs ring-1 ring-[#3E364E]'
                        : 'bg-white text-[#3E364E] border border-[#DBD6E3] hover:bg-[#ECEAF0]'
                    }`}
                  >
                    <span>College:</span>
                    <strong>
                      {formatDuration(
                        activeTab === 'monthly'
                          ? activeMonthData.focusByCategory?.college || 0
                          : totalFocusByCategory?.college || 0
                      )}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('personal')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      focusCategory === 'personal'
                        ? 'bg-[#635032] text-white font-bold shadow-xs ring-1 ring-[#635032]'
                        : 'bg-white text-[#635032] border-[#E8DAC5] hover:bg-[#F4ECE1]'
                    }`}
                  >
                    <span>Personal:</span>
                    <strong>
                      {formatDuration(
                        activeTab === 'monthly'
                          ? activeMonthData.focusByCategory?.personal || 0
                          : totalFocusByCategory?.personal || 0
                      )}
                    </strong>
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Cards Grid: Dynamic between Monthly and All-Time */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Card 1: Completion Rate */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                    Completion Rate
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1917] block mt-1">
                    {activeTab === 'monthly' ? activeMonthData.percent : overallPercent}%
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {activeTab === 'monthly'
                    ? `${activeMonthData.monthFull} consistency`
                    : 'All-time consistency'}
                </span>
              </div>

              {/* Card 2: Finished Tasks */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                    Finished Tasks
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-[#224A32] block mt-1">
                    {activeTab === 'monthly' ? activeMonthData.completed : completedAll}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {activeTab === 'monthly'
                    ? `Out of ${activeMonthData.total} planned in ${activeMonthData.monthShort}`
                    : `Out of ${totalAll} planned`}
                </span>
              </div>

              {/* Card 3: Focus Time Card */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                      Focus Time
                    </span>
                    <span
                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border transition-colors ${
                        focusCategory === 'career'
                          ? 'bg-[#EBF2EC] text-[#244E35] border-[#D2E4D6]'
                          : focusCategory === 'college'
                          ? 'bg-[#ECEAF0] text-[#3E364E] border-[#DBD6E3]'
                          : focusCategory === 'personal'
                          ? 'bg-[#F4ECE1] text-[#635032] border-[#E8DAC5]'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {activeCategoryConfig.shortLabel}
                    </span>
                  </div>

                  <span
                    className={`text-xl sm:text-2xl font-bold font-mono block mt-1 transition-colors ${
                      focusCategory === 'career'
                        ? 'text-[#224A32]'
                        : focusCategory === 'college'
                        ? 'text-[#3E364E]'
                        : focusCategory === 'personal'
                        ? 'text-[#635032]'
                        : 'text-[#695431]'
                    }`}
                  >
                    {formatDuration(
                      activeTab === 'monthly'
                        ? getCategoryMinutes(activeMonthData.focusByCategory, activeMonthData.focusMinutes)
                        : getCategoryMinutes(totalFocusByCategory, totalFocusMinutes)
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block truncate">
                  {activeTab === 'monthly'
                    ? focusCategory === 'all'
                      ? `${activeMonthData.monthShort} focus logged`
                      : `${activeCategoryConfig.label}`
                    : focusCategory === 'all'
                    ? 'Completed study/work'
                    : `${activeCategoryConfig.label}`}
                </span>
              </div>

              {/* Card 4: Pending Tasks (Monthly) or Top Month (Yearly/All-Time) */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">
                    {activeTab === 'monthly' ? 'Pending Tasks' : 'Top Month'}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1917] block mt-1">
                    {activeTab === 'monthly'
                      ? Math.max(0, activeMonthData.total - activeMonthData.completed)
                      : bestMonth
                      ? `${bestMonth.monthShort}`
                      : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {activeTab === 'monthly'
                    ? activeMonthData.total === 0
                      ? 'No milestones this month'
                      : activeMonthData.completed >= activeMonthData.total
                      ? 'All completed! 🎯'
                      : `${Math.max(0, activeMonthData.total - activeMonthData.completed)} tasks left to finish`
                    : bestMonth
                    ? `${bestMonth.percent}% rate`
                    : 'No data yet'}
                </span>
              </div>
            </div>

            {/* =================== PER-TASK TIME BREAKDOWN LEADERBOARD =================== */}
            {(() => {
              const rawBreakdown =
                activeTab === 'monthly'
                  ? activeMonthData.taskBreakdown || []
                  : allTimeTaskBreakdown || []

              const isPlanned = timeMode === 'planned'
              const catMap =
                activeTab === 'monthly'
                  ? isPlanned
                    ? activeMonthData.plannedFocusByCategory || activeMonthData.focusByCategory
                    : activeMonthData.focusByCategory
                  : isPlanned
                  ? totalPlannedFocusByCategory || totalFocusByCategory
                  : totalFocusByCategory

              const totalScopeMinutes =
                activeTab === 'monthly'
                  ? isPlanned
                    ? activeMonthData.plannedFocusMinutes || activeMonthData.focusMinutes || 0
                    : activeMonthData.focusMinutes || 0
                  : isPlanned
                  ? totalPlannedFocusMinutes || totalFocusMinutes || 0
                  : totalFocusMinutes || 0

              const filteredTasks = rawBreakdown
                .filter((t) => (focusCategory === 'all' ? true : t.category === focusCategory))
                .filter((t) =>
                  isPlanned ? t.plannedFocusMinutes > 0 : t.completedFocusMinutes > 0
                )
                .sort((a, b) =>
                  isPlanned
                    ? b.plannedFocusMinutes - a.plannedFocusMinutes
                    : b.completedFocusMinutes - a.completedFocusMinutes
                )

              const activeCategoryTotal =
                focusCategory === 'all'
                  ? totalScopeMinutes
                  : catMap?.[focusCategory] || 0

              const careerMins = catMap?.career || 0
              const collegeMins = catMap?.college || 0
              const personalMins = catMap?.personal || 0

              return (
                <div className="bg-white border-2 border-[#1C1917] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#1C1917] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#E5E0D8]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#FEF08A] border border-[#1C1917] text-[10px] font-mono font-black text-[#1C1917] uppercase">
                          Time Audit
                        </span>
                        <h4 className="font-black text-sm text-[#1C1917] tracking-tight">
                          Which Tasks Took Your Time ({activeTab === 'monthly' ? activeMonthData.monthShort : 'All-Time'})
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-0.5">
                        Click Career, College, or Personal below to see which specific tasks consume the most hours
                      </p>
                    </div>

                    {/* Planned vs Completed Toggle */}
                    <div className="inline-flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#1C1917] self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setTimeMode('planned')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isPlanned
                            ? 'bg-[#FEF08A] text-[#1C1917] border border-[#1C1917] shadow-[1px_1px_0px_#1C1917]'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        Planned Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeMode('completed')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          !isPlanned
                            ? 'bg-[#BBF7D0] text-[#1C1917] border border-[#1C1917] shadow-[1px_1px_0px_#1C1917]'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        Completed Time
                      </button>
                    </div>
                  </div>

                  {/* Visual Stacked Bar of Career vs College vs Personal */}
                  {totalScopeMinutes > 0 && (
                    <div className="space-y-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D8]">
                      <div className="w-full h-3.5 rounded-full border-2 border-[#1C1917] bg-white overflow-hidden flex p-[1px]">
                        {careerMins > 0 && (
                          <div
                            onClick={() => handleCategoryChange('career')}
                            style={{
                              width: `${Math.round((careerMins / totalScopeMinutes) * 100)}%`
                            }}
                            title={`Career / Study: ${formatDuration(careerMins)}`}
                            className="h-full bg-[#16A34A] hover:opacity-90 transition-all duration-300 cursor-pointer"
                          />
                        )}
                        {collegeMins > 0 && (
                          <div
                            onClick={() => handleCategoryChange('college')}
                            style={{
                              width: `${Math.round((collegeMins / totalScopeMinutes) * 100)}%`
                            }}
                            title={`College / Assignment: ${formatDuration(collegeMins)}`}
                            className="h-full bg-[#7E22CE] hover:opacity-90 transition-all duration-300 cursor-pointer"
                          />
                        )}
                        {personalMins > 0 && (
                          <div
                            onClick={() => handleCategoryChange('personal')}
                            style={{
                              width: `${Math.round((personalMins / totalScopeMinutes) * 100)}%`
                            }}
                            title={`Personal / Other: ${formatDuration(personalMins)}`}
                            className="h-full bg-[#D97706] hover:opacity-90 transition-all duration-300 cursor-pointer"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleCategoryChange(focusCategory === 'career' ? 'all' : 'career')
                          }
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            focusCategory === 'career'
                              ? 'bg-[#BBF7D0] border-[#1C1917] font-black shadow-[1.5px_1.5px_0px_#1C1917]'
                              : 'bg-white border-[#E5E0D8] hover:border-[#1C1917]'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-[#224A32] font-bold">
                            <Briefcase className="w-3 h-3" />
                            Career
                          </span>
                          <span className="font-mono font-black text-[#1C1917] block mt-0.5">
                            {formatDuration(careerMins)}{' '}
                            <span className="text-[10px] font-normal text-[#78716C]">
                              ({Math.round((careerMins / totalScopeMinutes) * 100)}%)
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCategoryChange(focusCategory === 'college' ? 'all' : 'college')
                          }
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            focusCategory === 'college'
                              ? 'bg-[#E9D5FF] border-[#1C1917] font-black shadow-[1.5px_1.5px_0px_#1C1917]'
                              : 'bg-white border-[#E5E0D8] hover:border-[#1C1917]'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-[#3E364E] font-bold">
                            <BookOpen className="w-3 h-3" />
                            College
                          </span>
                          <span className="font-mono font-black text-[#1C1917] block mt-0.5">
                            {formatDuration(collegeMins)}{' '}
                            <span className="text-[10px] font-normal text-[#78716C]">
                              ({Math.round((collegeMins / totalScopeMinutes) * 100)}%)
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCategoryChange(focusCategory === 'personal' ? 'all' : 'personal')
                          }
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            focusCategory === 'personal'
                              ? 'bg-[#FDE68A] border-[#1C1917] font-black shadow-[1.5px_1.5px_0px_#1C1917]'
                              : 'bg-white border-[#E5E0D8] hover:border-[#1C1917]'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-[#635032] font-bold">
                            <Sparkles className="w-3 h-3" />
                            Personal
                          </span>
                          <span className="font-mono font-black text-[#1C1917] block mt-0.5">
                            {formatDuration(personalMins)}{' '}
                            <span className="text-[10px] font-normal text-[#78716C]">
                              ({Math.round((personalMins / totalScopeMinutes) * 100)}%)
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ranked Task List */}
                  {filteredTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#78716C] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E5E0D8]">
                      {isPlanned
                        ? `No tasks planned in ${activeCategoryConfig.label} for this period.`
                        : `No completed tasks logged in ${activeCategoryConfig.label} yet — switch to "Planned Time" above to inspect scheduled tasks!`}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filteredTasks.map((t, idx) => {
                        const mins = isPlanned ? t.plannedFocusMinutes : t.completedFocusMinutes
                        const sharePct =
                          activeCategoryTotal > 0
                            ? Math.round((mins / activeCategoryTotal) * 100)
                            : 0
                        const barColor =
                          t.category === 'career'
                            ? 'bg-[#16A34A]'
                            : t.category === 'college'
                            ? 'bg-[#7E22CE]'
                            : 'bg-[#D97706]'
                        const catBadge =
                          t.category === 'career'
                            ? 'bg-[#BBF7D0] text-[#1C1917]'
                            : t.category === 'college'
                            ? 'bg-[#E9D5FF] text-[#1C1917]'
                            : 'bg-[#FDE68A] text-[#1C1917]'
                        const catLabel =
                          t.category === 'career'
                            ? 'Career'
                            : t.category === 'college'
                            ? 'College'
                            : 'Personal'

                        return (
                          <div
                            key={t.key}
                            className="p-3 rounded-xl bg-[#FAF8F5] border border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] shrink-0">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-[#1C1917] truncate">
                                  {t.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#1C1917] shrink-0 ${catBadge}`}
                                >
                                  {catLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                                <span className="text-[10px] text-[#78716C] hidden sm:inline">
                                  {isPlanned
                                    ? `${t.totalCount} ${t.totalCount === 1 ? 'day' : 'days'} (${formatDuration(t.perSessionFocus)}/d)`
                                    : `${t.completedCount}/${t.totalCount} done`}
                                </span>
                                <span className="font-black text-[#1C1917]">
                                  {formatDuration(mins)}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#1C1917]/40 text-[#1C1917]">
                                  {sharePct}%
                                </span>
                              </div>
                            </div>

                            <div className="w-full h-2 rounded-full bg-white border border-[#1C1917] overflow-hidden p-[1px]">
                              <div
                                style={{ width: `${Math.max(sharePct, 4)}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Weekly Performance and Focus Breakdown for the selected month */}
            {activeTab === 'monthly' && (
              <div className="space-y-3 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#224A32]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1917]">
                      Weekly Performance & Focus Breakdown
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#57534E] border border-[#E5E0D8] font-semibold whitespace-nowrap">
                      {activeMonthData.weeksList?.length || 0} Weeks in {activeMonthData.monthShort}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C]">
                    Click any category or "Tasks" on a week to inspect its tasks
                  </span>
                </div>

                {/* List of weeks */}
                <div className="space-y-2.5">
                  {activeMonthData.weeksList?.map((w) => {
                    const activeCatMinutes = getCategoryMinutes(w.focusByCategory, w.focusMinutes)

                    let barColor = 'bg-[#1C1917]'
                    let badgeStyle = 'bg-stone-100 text-[#57534E] border-[#E5E0D8]'
                    if (w.percent >= 80) {
                      barColor = 'bg-[#224A32]'
                      badgeStyle = 'bg-[#EBF2EC] text-[#224A32] border-[#CFE1D3]'
                    } else if (w.percent >= 50) {
                      barColor = 'bg-[#695431]'
                      badgeStyle = 'bg-[#FAF4EB] text-[#695431] border-[#E8DAC5]'
                    }

                    return (
                      <div
                        key={w.weekNumber}
                        className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all shadow-2xs ${
                          w.isCurrentWeek
                            ? 'border-[#224A32]/50 bg-[#FAFBF9] ring-1 ring-[#224A32]/10'
                            : 'border-[#E5E0D8] hover:border-stone-400/60'
                        }`}
                      >
                        {/* Week Card Header: Week number, Date range, Status & Completion Rate */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs font-mono px-2.5 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#1C1917]">
                              Week {w.weekNumber}
                            </span>
                            <span className="text-xs font-semibold text-[#44403C]">
                              {w.dateRange}
                            </span>
                            {w.isCurrentWeek && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF2EC] text-[#224A32] border border-[#CFE1D3]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#224A32] animate-pulse" />
                                Current Week
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-[11px] text-[#78716C]">
                              {w.total > 0
                                ? `${w.completed} of ${w.total} tasks`
                                : '0 tasks'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full border font-bold text-xs ${badgeStyle}`}>
                              {w.percent}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#F2EFE9] rounded-full h-2 overflow-hidden my-2.5">
                          <div
                            style={{ width: `${w.percent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          />
                        </div>

                        {/* Week Card Footer: Focus Breakdown */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F2EFE9] text-xs">
                          <div className="flex items-center gap-1.5 text-[#57534E]">
                            <Clock className="w-3.5 h-3.5 text-[#695431]" />
                            <span className="text-[11px]">Completed Focus:</span>
                            <strong className="font-mono font-bold text-[#1C1917]">
                              {formatDuration(w.focusMinutes)}
                            </strong>
                            {w.plannedFocusMinutes > 0 && (
                              <span className="text-[10px] text-stone-400 font-mono">
                                / {formatDuration(w.plannedFocusMinutes)} planned
                              </span>
                            )}
                            {focusCategory !== 'all' && (
                              <span className="text-[10px] text-stone-400 font-mono">
                                ({activeCategoryConfig.shortLabel}: {formatDuration(activeCatMinutes)})
                              </span>
                            )}
                          </div>

                          {/* Category Focus Breakdown Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={() => {
                                handleCategoryChange('career')
                                setExpandedWeekNum((prev) =>
                                  prev === w.weekNumber && focusCategory === 'career'
                                    ? null
                                    : w.weekNumber
                                )
                              }}
                              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                focusCategory === 'career'
                                  ? 'bg-[#224A32] text-white font-bold border-[#224A32] shadow-2xs'
                                  : 'bg-[#EBF2EC] text-[#244E35] border-[#D2E4D6] hover:border-[#224A32]'
                              }`}
                              title="Click to inspect Career / Study tasks in this week"
                            >
                              Career: {formatDuration(w.focusByCategory.career || w.plannedFocusByCategory?.career || 0)}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleCategoryChange('college')
                                setExpandedWeekNum((prev) =>
                                  prev === w.weekNumber && focusCategory === 'college'
                                    ? null
                                    : w.weekNumber
                                )
                              }}
                              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                focusCategory === 'college'
                                  ? 'bg-[#3E364E] text-white font-bold border-[#3E364E] shadow-2xs'
                                  : 'bg-[#ECEAF0] text-[#3E364E] border-[#DBD6E3] hover:border-[#3E364E]'
                              }`}
                              title="Click to inspect College / Assignment tasks in this week"
                            >
                              College: {formatDuration(w.focusByCategory.college || w.plannedFocusByCategory?.college || 0)}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleCategoryChange('personal')
                                setExpandedWeekNum((prev) =>
                                  prev === w.weekNumber && focusCategory === 'personal'
                                    ? null
                                    : w.weekNumber
                                )
                              }}
                              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                focusCategory === 'personal'
                                  ? 'bg-[#635032] text-white font-bold border-[#635032] shadow-2xs'
                                  : 'bg-[#F4ECE1] text-[#635032] border-[#E8DAC5] hover:border-[#635032]'
                              }`}
                              title="Click to inspect Personal / Other tasks in this week"
                            >
                              Personal: {formatDuration(w.focusByCategory.personal || w.plannedFocusByCategory?.personal || 0)}
                            </button>

                            {w.taskBreakdown?.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedWeekNum((prev) =>
                                    prev === w.weekNumber ? null : w.weekNumber
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-bold cursor-pointer"
                              >
                                <span>Tasks</span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${
                                    expandedWeekNum === w.weekNumber ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Per-Task Breakdown for this specific week */}
                        {expandedWeekNum === w.weekNumber && w.taskBreakdown?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#E5E0D8] space-y-1.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-[11px] text-[#78716C] pb-1">
                              <span className="font-bold text-[#1C1917]">
                                Week {w.weekNumber} Tasks ({activeCategoryConfig.shortLabel})
                              </span>
                              <span>Planned vs Completed Focus</span>
                            </div>
                            {w.taskBreakdown
                              .filter((t) =>
                                focusCategory === 'all' ? true : t.category === focusCategory
                              )
                              .map((t) => (
                                <div
                                  key={t.key}
                                  className="flex items-center justify-between gap-2 text-xs bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E5E0D8]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-semibold text-[#1C1917] truncate">
                                      {t.title}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#78716C] shrink-0">
                                      ({t.completedCount}/{t.totalCount} days)
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs shrink-0 flex items-center gap-2">
                                    <span className="text-[#78716C] text-[11px]">
                                      Planned: <strong className="text-[#1C1917]">{formatDuration(t.plannedFocusMinutes)}</strong>
                                    </span>
                                    {t.completedFocusMinutes > 0 && (
                                      <span className="text-[#224A32] font-bold">
                                        • Done: {formatDuration(t.completedFocusMinutes)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FECDD3] hover:bg-[#FDA4AF] border-2 border-[#1C1917] text-[#9F1239] text-xs font-black shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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
