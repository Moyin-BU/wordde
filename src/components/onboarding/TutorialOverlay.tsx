import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  targetSelector: string;
  title: string;
  instruction: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  waitForAction?: boolean;
}

const STEPS: TutorialStep[] = [
  {
    targetSelector: '[data-tutorial="search"]',
    title: 'Search for Scripture',
    instruction: 'Type a Bible verse (e.g., John 3:16) to search and instantly project it.',
    position: 'right',
  },
  {
    targetSelector: '[data-tutorial="recent"]',
    title: 'Recent Passages',
    instruction: 'Your projected verses appear here for quick access. Click any to re-project.',
    position: 'right',
  },
  {
    targetSelector: '[data-tutorial="navigator"]',
    title: 'Bible Navigator',
    instruction: 'Browse by Book → Chapter → Verse to find any passage.',
    position: 'right',
  },
  {
    targetSelector: '[data-tutorial="service"]',
    title: 'Service Plan',
    instruction: 'Add passages here to prepare your service lineup ahead of time.',
    position: 'right',
  },
  {
    targetSelector: '[data-tutorial="presenter"]',
    title: 'Presenter Panel',
    instruction: 'See the LIVE verse and NEXT preview. Use ← → arrow keys to navigate between verses.',
    position: 'left',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const currentStep = STEPS[step];

  const measureTarget = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [currentStep]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

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

  // Position the tooltip
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

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
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
          fill="hsl(222 47% 11% / 0.75)"
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: 'all' }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Highlight ring */}
      <div
        className="absolute border-2 border-primary rounded-lg pointer-events-none"
        style={{
          ...highlightStyle,
          boxShadow: '0 0 0 4px hsl(38 92% 50% / 0.2)',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute max-w-xs bg-card border border-border rounded-xl p-4 shadow-xl"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground">{currentStep.title}</h3>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{currentStep.instruction}</p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={advance}
            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
