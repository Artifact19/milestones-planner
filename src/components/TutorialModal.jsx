import { useState, useEffect } from 'react'
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Repeat,
  Download,
  BarChart3,
  Sparkles,
  HelpCircle,
  Home,
  FileText,
  ListTodo
} from 'lucide-react'

export default function TutorialModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  // Reset to step 0 when reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep])

  if (!isOpen) return null

  const steps = [
    {
      id: 'weekly-flow',
      tag: 'WELCOME & CADENCE',
      title: 'Your Intentional Weekly Canvas',
      subtitle:
        'Milestones organizes your focus around natural 7-day cycles (Monday to Sunday) for sustainable productivity.',
      icon: Sparkles,
      iconColor: 'text-[#695431]',
      diagram: (
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm flex flex-col gap-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] p-0.5 overflow-hidden flex items-center justify-center">
                <img src="/favicon.png" alt="App Icon" className="w-full h-full object-contain [image-rendering:pixelated]" />
              </div>
              <span className="font-bold text-[#1C1917] tracking-tight">MILESTONES</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[11px] font-mono text-[#57534E]">
              <span>‹</span>
              <span className="font-semibold text-[#1C1917]">Oct 19 — Oct 25</span>
              <span>›</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-[#EBF2EC] text-[#224A32] font-mono text-[10px] font-bold">
              85% Done
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]/80">
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Today Button</span>
              <span className="font-semibold text-[#1C1917] mt-0.5 block">Instant Return</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]/80">
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Week Switcher</span>
              <span className="font-semibold text-[#1C1917] mt-0.5 block">Future & History</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]/80">
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Time Budget</span>
              <span className="font-semibold text-[#1C1917] mt-0.5 block">Total Week Hours</span>
            </div>
          </div>
        </div>
      ),
      highlights: [
        {
          title: 'Monday to Sunday Flow',
          desc: 'Structure your commitments by natural weeks so you always have a fresh start every Monday.'
        },
        {
          title: 'Spider-Man Home Button',
          desc: 'Click the Spider-Man icon or the "Today" pill anytime to quickly return to current day.'
        },
        {
          title: 'Live Weekly Progress Pill',
          desc: 'Watch your completion badge and architectural progress bar fill up as you check off items.'
        }
      ],
      tip: 'Use the left & right arrows next to the date in the top bar to plan next week ahead of time.'
    },
    {
      id: 'sidebar-navigation',
      tag: 'SIDEBAR NAVIGATION',
      title: 'Focused Daily Workspaces',
      subtitle:
        'Concentrate on one single day at a time without feeling overwhelmed by your whole to-do list.',
      icon: Calendar,
      iconColor: 'text-[#224A32]',
      diagram: (
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm flex flex-col gap-2 font-sans">
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5 text-[#695431]" />
              <span className="font-bold text-[#1C1917]">Weekly Milestones</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E5E0D8] text-stone-500 font-mono">
              Master Bucket
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#1C1917] text-white flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Tuesday (Active Day)</span>
            </div>
            <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
              4/5 Tasks
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#E5E0D8]/60 flex items-center justify-between text-xs text-stone-500">
            <span>Wednesday</span>
            <span className="text-[10px] font-mono">2 Tasks</span>
          </div>
        </div>
      ),
      highlights: [
        {
          title: 'Single Day Focus',
          desc: 'Click any weekday (Mon–Sun) in the sidebar to review and execute only what matters today.'
        },
        {
          title: 'Master Weekly Milestones',
          desc: 'Select day "0" at the top of the sidebar for high-level weekly projects not tied to one date.'
        },
        {
          title: 'Live Daily Counters',
          desc: 'Each sidebar tab displays your active task tally and completion progress in real time.'
        }
      ],
      tip: 'On mobile, tap the menu hamburger icon in the top bar to toggle the day selector anytime.'
    },
    {
      id: 'task-entry',
      tag: 'TASKS & HABITS',
      title: 'Floating Add Bar & Smart Recurrence',
      subtitle:
        'Quickly capture tasks with duration budgeting and multi-day recurrence that stays under your control.',
      icon: Clock,
      iconColor: 'text-[#1C1917]',
      diagram: (
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm flex flex-col gap-2.5 font-sans">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
            <span className="text-stone-400 font-bold">+</span>
            <span className="text-[#1C1917] font-medium flex-1">Complete system architecture review</span>
            <span className="px-2 py-0.5 rounded-md bg-stone-200 text-[#1C1917] font-mono text-[10px] font-semibold">
              45m
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF4EB] border border-[#E8DAC5] text-[#695431] text-[10px] font-semibold">
              <Repeat className="w-3 h-3" /> Repeat
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#224A32]">
              <span className="font-bold block">Smart Repeating</span>
              <span className="text-[10px] text-emerald-700">Repeats across selected days of the week</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[#695431]">
              <span className="font-bold block">Safe Delete Modal</span>
              <span className="text-[10px] text-amber-800">Delete just one instance or all future ones</span>
            </div>
          </div>
        </div>
      ),
      highlights: [
        {
          title: 'Docked Bottom Input',
          desc: 'The input bar stays anchored at the bottom of your workspace so your active tasks stay clean.'
        },
        {
          title: 'Time & Energy Tagging',
          desc: 'Assign realistic estimates (15m, 30m, 1h, 2h) to balance your daily cognitive workload.'
        },
        {
          title: 'Safe Repeating Task Deletion',
          desc: 'Deleting a recurring habit gives you the choice to delete either only this day or all forward days.'
        }
      ],
      tip: 'Press Enter while typing in the add bar to immediately create your task and keep planning.'
    },
    {
      id: 'sunday-retro',
      tag: 'SUNDAY RITUAL',
      title: 'Sunday Intentions & Weekly Notes',
      subtitle:
        'A dedicated retrospective space to consolidate weekly learnings and establish momentum for next week.',
      icon: FileText,
      iconColor: 'text-[#695431]',
      diagram: (
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E8DAC5] p-4 shadow-sm flex flex-col gap-2 font-sans">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#695431] uppercase tracking-wider text-[10px]">
              Sunday Weekly Notes
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Auto-Saved</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#E5E0D8] text-xs text-[#44403C] space-y-1">
            <p className="font-medium text-[#1C1917]">✦ Weekly Reflections & Wins</p>
            <p className="text-[11px] text-[#78716C]">• Shipped new feature ahead of schedule</p>
            <p className="text-[11px] text-[#78716C]">• Maintained 85% completion rate across all 7 days</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-stone-500">Unfinished items?</span>
            <span className="font-semibold text-[#224A32] cursor-default">
              One-Click Carry Forward to Monday →
            </span>
          </div>
        </div>
      ),
      highlights: [
        {
          title: 'Dedicated Sunday Workspace',
          desc: 'Sunday features a scratchpad designed for end-of-week reflection and priority calibration.'
        },
        {
          title: 'Continuous Auto-Saving',
          desc: 'Weekly thoughts, meeting notes, and wins are saved directly to your private cloud storage.'
        },
        {
          title: 'Carry Forward',
          desc: 'Easily transition any uncompleted milestones into next Monday without manual re-typing.'
        }
      ],
      tip: 'Spend 10 minutes on Sunday evening reviewing your week — it sets you up for an effortless Monday.'
    },
    {
      id: 'analytics-exports',
      tag: 'ANALYTICS & EXPORTS',
      title: '12-Month Analytics & Executive Reports',
      subtitle:
        'Gain long-term visibility into your productivity trends and export presentation-ready summaries.',
      icon: BarChart3,
      iconColor: 'text-[#1C1917]',
      diagram: (
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm flex flex-col gap-3 font-sans">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E0D8]/60">
            <span className="font-bold text-[#1C1917]">All-Time Consistency</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-semibold text-[#1C1917]">
                🖨️ PDF Report
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-semibold text-[#1C1917]">
                📥 CSV Sheet
              </span>
            </div>
          </div>
          {/* Mini Bar Chart Mockup */}
          <div className="flex items-end justify-between h-14 px-2 pt-2 gap-1.5">
            {[45, 60, 55, 80, 75, 90, 85, 95, 88, 92, 98, 94].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t-sm transition-all bg-[#1C1917] hover:bg-[#695431]"
                  style={{ height: `${val}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono px-1">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>
      ),
      highlights: [
        {
          title: 'Profile Modal & Avatar',
          desc: 'Click "Profile" in the top bar to upload a profile picture and view 12-month completion analytics.'
        },
        {
          title: 'Executive PDF & CSV Reports',
          desc: 'Click "Reports" in the top bar to print or export detailed Weekly, Monthly, or Yearly breakdown sheets.'
        },
        {
          title: 'Re-Visit Tour Anytime',
          desc: 'You can replay this tutorial anytime by clicking the "Tour" button in the top bar.'
        }
      ],
      tip: 'Export a monthly CSV report at the end of each month to track your personal productivity archives!'
    }
  ]

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100)

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSkip = () => {
    if (onComplete) onComplete()
    onClose()
  }

  const handleComplete = () => {
    if (onComplete) onComplete()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl shadow-[0_24px_50px_-12px_rgba(28,25,23,0.18)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Slim Progress Strip */}
        <div className="w-full bg-[#E5E0D8]/70 h-1 overflow-hidden">
          <div
            className="h-full bg-[#1C1917] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E5E0D8]/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#1C1917] text-white uppercase tracking-wider">
              {step.tag}
            </span>
            <span className="text-xs font-mono font-medium text-[#78716C]">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Skip Option Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-[#78716C] hover:text-[#1C1917] font-medium px-2.5 py-1 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Close tutorial"
              className="p-1 rounded-full text-stone-400 hover:text-[#1C1917] hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Step Title & Subtitle */}
          <div>
            <h2
              id="tutorial-modal-title"
              className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#1C1917]"
            >
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] mt-1 leading-relaxed">
              {step.subtitle}
            </p>
          </div>

          {/* Feature Diagram / Mockup */}
          {step.diagram}

          {/* Feature Highlights Grid */}
          <div className="space-y-2.5">
            {step.highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm"
              >
                <div className="mt-0.5 p-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#224A32] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">{item.title}</h4>
                  <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Architectural Pro Tip */}
          {step.tip && (
            <div className="p-3.5 rounded-2xl bg-[#FAF4EB] border border-[#E8DAC5] flex items-start gap-2.5 text-xs text-[#695431]">
              <Sparkles className="w-4 h-4 shrink-0 text-[#695431] mt-0.5" />
              <div>
                <span className="font-bold text-[#695431] mr-1 uppercase text-[10px] tracking-wider block sm:inline">
                  Architectural Tip:
                </span>
                <span>{step.tip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E0D8] flex items-center justify-between gap-3">
          {/* Skip for now text */}
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer transition-colors"
          >
            Skip for now
          </button>

          {/* Interactive Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  index === currentStep
                    ? 'w-6 h-2 bg-[#1C1917]'
                    : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>

          {/* Back & Next Navigation Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E5E0D8] text-[#1C1917] text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-[#FAF8F5] text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span>{isLast ? 'Get Started 🚀' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
