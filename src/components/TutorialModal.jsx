import { useState, useEffect, useCallback } from 'react'
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

const TOUR_STEPS = [
  {
    id: 'time-budget',
    target: 'time-budget',
    badge: 'DAILY TIME AUDIT',
    title: 'See Where Your Entire Day Goes',
    oneLiner:
      'Track your daily Focus, Breaks, and Category split (Career, College, Personal) so you know exactly what to cut down or prioritize.'
  },
  {
    id: 'day-strip',
    target: 'day-strip',
    badge: 'DAY SWITCHER',
    title: 'Focus on One Day at a Time',
    oneLiner:
      'Switch between Monday–Sunday to execute today’s plan, or click "Wk" to view your high-level Weekly Milestones.'
  },
  {
    id: 'add-task',
    target: 'add-task',
    badge: 'ADD & CUSTOMIZE',
    title: 'Double-Click to Set Time, Tags & Repeat',
    oneLiner:
      'Type any task here—double-click this bar anytime to expand repeat days, Career/College/Personal tags, and focus time.'
  },
  {
    id: 'task-list',
    target: 'task-list',
    badge: 'TASK CONTROLS',
    title: 'Check Off, Reorder & Repeat Tasks',
    oneLiner:
      'Tick tasks as you finish, drag to reorder, or click the 🔁 button on any task to repeat it across multiple days.'
  },
  {
    id: 'week-switcher',
    target: 'week-switcher',
    badge: 'WEEKLY PROGRESS',
    title: 'Live Weekly Completion & Hours',
    oneLiner:
      'Watch your weekly completion bar and total budgeted hours update live as you check off tasks.'
  },
  {
    id: 'analytics-btn',
    target: 'analytics-btn',
    badge: 'DEEP ANALYTICS',
    title: 'See Which Tasks Take the Most Time',
    oneLiner:
      'Open Profile & Analytics to see your Career, College, and Personal hours—plus a ranked breakdown of which specific tasks took your time.'
  },
  {
    id: 'reports-btn',
    target: 'reports-btn',
    badge: 'EXPORT REPORTS',
    title: 'One-Click PDF & CSV Reports',
    oneLiner:
      'Download or print clean weekly, monthly, or yearly summaries of your completed milestones anytime.'
  }
]

export default function TutorialModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  // Measure target DOM element and keep spotlight aligned
  const updateSpotlight = useCallback(() => {
    if (!isOpen || !step?.target) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) {
      setTargetRect(null)
      return
    }
    const rect = el.getBoundingClientRect()
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right
    })
  }, [isOpen, step])

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  // Scroll target into view when step changes, then measure
  useEffect(() => {
    if (!isOpen || !step?.target) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      const inViewport = rect.top >= 60 && rect.bottom <= window.innerHeight - 60
      if (!inViewport) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    updateSpotlight()
    const timer1 = setTimeout(updateSpotlight, 180)
    const timer2 = setTimeout(updateSpotlight, 400)

    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [isOpen, currentStep, step, updateSpotlight])

  const handleFinish = useCallback(() => {
    if (onComplete) onComplete()
    onClose()
  }, [onComplete, onClose])

  const handleNext = useCallback(() => {
    if (isLast) {
      handleFinish()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1))
    }
  }, [isLast, handleFinish])

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFinish()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleFinish, handleNext, handlePrev])

  if (!isOpen) return null

  // Compute spotlight frame & tooltip placement
  const pad = 8
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768

  const hasRect = Boolean(targetRect && targetRect.width > 0 && targetRect.height > 0)

  const spotTop = hasRect ? Math.max(4, targetRect.top - pad) : vh / 2 - 40
  const spotLeft = hasRect ? Math.max(4, targetRect.left - pad) : vw / 2 - 150
  const spotWidth = hasRect ? Math.min(vw - 8, targetRect.width + pad * 2) : 300
  const spotHeight = hasRect ? Math.min(vh - 8, targetRect.height + pad * 2) : 80

  // Decide whether tooltip goes below or above the spotlight
  const spaceBelow = vh - (spotTop + spotHeight)
  const placeAbove = hasRect && spaceBelow < 210 && spotTop > 190

  const tooltipWidth = Math.min(360, vw - 24)
  const targetCenterX = hasRect ? spotLeft + spotWidth / 2 : vw / 2
  const tooltipLeft = Math.min(
    Math.max(12, targetCenterX - tooltipWidth / 2),
    vw - tooltipWidth - 12
  )

  // Arrow horizontal offset relative to tooltip card
  const arrowLeft = Math.min(
    Math.max(24, targetCenterX - tooltipLeft),
    tooltipWidth - 24
  )

  const tooltipStyle = hasRect
    ? placeAbove
      ? {
          left: `${tooltipLeft}px`,
          bottom: `${Math.max(12, vh - spotTop + 18)}px`,
          width: `${tooltipWidth}px`
        }
      : {
          left: `${tooltipLeft}px`,
          top: `${Math.min(vh - 190, spotTop + spotHeight + 18)}px`,
          width: `${tooltipWidth}px`
        }
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`
      }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Feature Tour"
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* Clickable Dimmed Backdrop (when no target rect) */}
      {!hasRect && (
        <div
          className="fixed inset-0 bg-[#1C1917]/65 backdrop-blur-[1px]"
          onClick={handleFinish}
        />
      )}

      {/* Spotlight Cutout Frame over Active Element */}
      {hasRect && (
        <div
          onClick={handleNext}
          title="Click Next to continue tour"
          style={{
            top: `${spotTop}px`,
            left: `${spotLeft}px`,
            width: `${spotWidth}px`,
            height: `${spotHeight}px`,
            boxShadow: '0 0 0 9999px rgba(28, 25, 23, 0.65)'
          }}
          className="fixed z-50 rounded-2xl border-3 border-[#FEF08A] ring-4 ring-[#FEF08A]/35 transition-all duration-300 ease-out cursor-pointer pointer-events-auto"
        />
      )}

      {/* Floating Neo-Brutalist One-Line Tooltip Card with Arrow */}
      <div
        style={tooltipStyle}
        className="fixed z-50 bg-white border-2 border-[#1C1917] rounded-2xl p-4 shadow-[5px_5px_0px_#1C1917] transition-all duration-300 ease-out pointer-events-auto"
      >
        {/* Pointer Arrow pointing to the highlighted feature */}
        {hasRect && !placeAbove && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -top-3 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          >
            <div className="w-4 h-4 rotate-45 bg-[#FEF08A] border-l-2 border-t-2 border-[#1C1917]" />
          </div>
        )}

        {hasRect && placeAbove && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -bottom-3 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          >
            <div className="w-4 h-4 rotate-45 bg-white border-r-2 border-b-2 border-[#1C1917]" />
          </div>
        )}

        {/* Top Bar: Step Badge + Skip */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FEF08A] border border-[#1C1917] text-[#1C1917] font-mono text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#1C1917]">
              <Sparkles className="w-2.5 h-2.5" />
              {step.badge}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#78716C]">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            aria-label="Close tour"
            className="p-1 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Feature Title & Single Simple Line */}
        <h3 className="text-sm sm:text-base font-black text-[#1C1917] tracking-tight">
          {step.title}
        </h3>
        <p className="text-xs text-[#44403C] font-medium mt-1 leading-relaxed">
          {step.oneLiner}
        </p>

        {/* Step Dots + Navigation Controls */}
        <div className="mt-3.5 pt-2.5 border-t border-[#1C1917]/15 flex items-center justify-between gap-2">
          {/* Progress Dots */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full border border-[#1C1917] transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-5 bg-[#FEF08A]'
                    : idx < currentStep
                    ? 'w-2 bg-[#1C1917]'
                    : 'w-2 bg-stone-200'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFinish}
              className="px-2 py-1 text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              Skip
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous step"
                className="p-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border-2 border-[#1C1917] text-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] border-2 border-[#1C1917] text-[#1C1917] text-xs font-black shadow-[2px_2px_0px_#1C1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              {isLast ? (
                <>
                  <span>Done</span>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
