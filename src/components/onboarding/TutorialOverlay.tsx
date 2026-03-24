import { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStateManager } from '@/core/stateManager';

interface TutorialStep {
  targetSelector: string;
  title: string;
  instruction: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  actionType: 'auto' | 'search' | 'navigate' | 'jump' | 'service-click' | 'key-n' | 'key-b';
  completedText?: string;
}

const STEPS: TutorialStep[] = [
  {
    targetSelector: '[data-tutorial="search"]',
    title: 'Search for Scripture',
    instruction: 'Type a Bible verse (e.g., John 3:16) in the search box and select a result.',
    position: 'right',
    actionType: 'search',
    completedText: 'Verse projected!',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'Live Projection',
    instruction: 'This verse is now projected live. The Presenter panel shows what\'s on screen.',
    position: 'left',
    actionType: 'auto',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'Navigate Verses',
    instruction: 'Use the ← → arrow keys to move between verses.',
    position: 'left',
    actionType: 'navigate',
    completedText: 'Navigation works!',
  },
  {
    targetSelector: '[data-tutorial="jump"]',
    title: 'Jump to Verse',
    instruction: 'Type a verse number (e.g., 5) in the input and press Enter.',
    position: 'left',
    actionType: 'jump',
    completedText: 'Jumped to verse!',
  },
  {
    targetSelector: '[data-tutorial="service"]',
    title: 'Service Plan',
    instruction: 'Click a saved passage to load it. Create a service plan for your worship lineup.',
    position: 'right',
    actionType: 'service-click',
    completedText: 'Service Plan ready!',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'Next Passage',
    instruction: 'Press N to advance to the next passage in your Service Plan.',
    position: 'left',
    actionType: 'key-n',
    completedText: 'Next passage loaded!',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'Blank Screen',
    instruction: 'Press B to blank/unblank the projection screen.',
    position: 'left',
    actionType: 'key-b',
    completedText: 'Screen toggled!',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'You\'re Ready!',
    instruction: 'You know the essentials. Use keyboard shortcuts for fast, seamless control during services.',
    position: 'left',
    actionType: 'auto',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const prevSlideIndexRef = useRef<number | null>(null);

  const currentStep = STEPS[step];
  const { committedPassage, currentSlideIndex, isScreenBlanked } = useStateManager();

  // Measure the target element
  const measureTarget = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.targetSelector);
    if (el) setRect(el.getBoundingClientRect());
  }, [currentStep]);

  useEffect(() => {
    measureTarget();
    const id = setInterval(measureTarget, 500);
    window.addEventListener('resize', measureTarget);
    return () => { clearInterval(id); window.removeEventListener('resize', measureTarget); };
  }, [measureTarget]);

  // Reset action state on step change
  useEffect(() => {
    setActionDone(false);
    prevSlideIndexRef.current = currentSlideIndex;
  }, [step]);

  // Action detection for each step type
  useEffect(() => {
    if (!currentStep || actionDone) return;

    if (currentStep.actionType === 'auto') {
      const timer = setTimeout(() => setActionDone(true), 1500);
      return () => clearTimeout(timer);
    }

    if (currentStep.actionType === 'search') {
      if (committedPassage) setActionDone(true);
      return;
    }

    if (currentStep.actionType === 'navigate') {
      if (prevSlideIndexRef.current !== null && currentSlideIndex !== prevSlideIndexRef.current) {
        setActionDone(true);
      }
      return;
    }

    if (currentStep.actionType === 'jump') {
      // Listen for changes to committed passage that indicate a jump
      const handler = () => setActionDone(true);
      // We detect jump by watching slide index changes while this step is active
      if (prevSlideIndexRef.current !== null && currentSlideIndex !== prevSlideIndexRef.current) {
        setActionDone(true);
      }
      return;
    }

    if (currentStep.actionType === 'service-click') {
      // Any passage commit during this step counts
      const initialPassage = committedPassage?.displayReference;
      const unsub = useStateManager.subscribe((state) => {
        if (state.committedPassage && state.committedPassage.displayReference !== initialPassage) {
          setActionDone(true);
        }
      });
      return unsub;
    }

    if (currentStep.actionType === 'key-n') {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'n' || e.key === 'N') setActionDone(true);
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }

    if (currentStep.actionType === 'key-b') {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'b' || e.key === 'B') setActionDone(true);
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [currentStep, actionDone, committedPassage, currentSlideIndex, isScreenBlanked]);

  // Auto-advance after action completion
  useEffect(() => {
    if (actionDone) {
      const timer = setTimeout(() => {
        if (step < STEPS.length - 1) {
          setStep(step + 1);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [actionDone, step]);

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  if (!currentStep || !rect) return null;

  const padding = 8;
  const highlightStyle = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  const tooltipStyle: React.CSSProperties = {};
  if (currentStep.position === 'right') {
    tooltipStyle.top = rect.top;
    tooltipStyle.left = rect.right + 16;
  } else if (currentStep.position === 'left') {
    tooltipStyle.top = rect.top;
    tooltipStyle.right = window.innerWidth - rect.left + 16;
  } else if (currentStep.position === 'bottom') {
    tooltipStyle.top = rect.bottom + 16;
    tooltipStyle.left = rect.left;
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + 16;
    tooltipStyle.left = rect.left;
  }

  const isLastStep = step === STEPS.length - 1;
  const isActionStep = currentStep.actionType !== 'auto';

  return (
    <div className="fixed inset-0 z-[90]" style={{ pointerEvents: 'none' }}>
      {/* Backdrop with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={highlightStyle.left}
              y={highlightStyle.top}
              width={highlightStyle.width}
              height={highlightStyle.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="hsl(222 47% 11% / 0.6)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Highlight ring */}
      <div
        className="absolute border-2 border-primary rounded-lg pointer-events-none transition-all duration-300"
        style={{
          ...highlightStyle,
          boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute max-w-xs bg-card border border-border rounded-xl p-4 shadow-xl"
        style={{ ...tooltipStyle, pointerEvents: 'auto' }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground">{currentStep.title}</h3>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground shrink-0" title="Skip tutorial">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{currentStep.instruction}</p>

        {/* Action feedback */}
        {actionDone && currentStep.completedText && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-primary font-medium animate-in fade-in duration-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{currentStep.completedText}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {isActionStep && !actionDone && !isLastStep && (
              <button
                onClick={advance}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip step
              </button>
            )}
            {(currentStep.actionType === 'auto' || actionDone || isLastStep) && (
              <button
                onClick={advance}
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
