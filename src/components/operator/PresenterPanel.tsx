import { useStateManager } from '@/core/stateManager';
import { cn } from '@/lib/utils';
import { Eye, Monitor, SkipForward, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Slide } from '@/core/types';

function SlideCard({
  slide,
  label,
  icon: Icon,
  variant,
}: {
  slide: Slide | null;
  label: string;
  icon: React.ElementType;
  variant: 'live' | 'next';
}) {
  const styles = {
    live: {
      border: 'border-primary/60 bg-primary/5',
      label: 'text-primary',
      refSize: 'text-base',
      textSize: 'text-2xl',
      minH: 'min-h-[180px]',
      padding: 'p-6',
      glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
    },
    next: {
      border: 'border-accent/40 bg-accent/5',
      label: 'text-accent',
      refSize: 'text-sm',
      textSize: 'text-lg',
      minH: 'min-h-[120px]',
      padding: 'p-4',
      glow: '',
    },
  }[variant];

  return (
    <div
      className={cn(
        'rounded-lg border-2 flex flex-col gap-2 transition-all duration-200',
        styles.border,
        styles.minH,
        styles.padding,
        styles.glow,
        variant === 'live' ? 'flex-[55]' : 'flex-[45]'
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Icon className={cn('h-4 w-4', styles.label)} />
        <span className={cn('text-xs font-semibold uppercase tracking-wider', styles.label)}>
          {label}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
        {slide ? (
          <>
            <p className={cn('scripture-reference text-reference mb-1 shrink-0', styles.refSize)}>
              {slide.reference}
            </p>
            <div className="overflow-y-auto flex-1 min-h-0">
              <p
                className={cn(
                  'scripture-text leading-relaxed text-scripture whitespace-normal break-words',
                  styles.textSize,
                )}
              >
                {slide.text}
              </p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground/40 text-sm italic">
            {variant === 'live' ? 'No slide projected' : variant === 'next' ? 'No slide selected' : 'No slide available'}
          </p>
        )}
      </div>
    </div>
  );
}

export function PresenterPanel() {
  const {
    projectionQueue,
    currentSlideIndex,
    liveSlideIndex,
    isScreenBlanked,
    commitCurrentSlide,
  } = useStateManager();

  const liveSlide = liveSlideIndex !== null ? projectionQueue[liveSlideIndex] ?? null : null;

  const isCurrentLive = liveSlideIndex === currentSlideIndex;
  const displayNext = isCurrentLive
    ? projectionQueue[currentSlideIndex + 1] ?? null
    : projectionQueue[currentSlideIndex] ?? null;

  if (isScreenBlanked) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Eye className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-xl font-medium">Screen Blanked</p>
        <p className="text-sm mt-2 text-muted-foreground/60">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">B</kbd> to restore projection
        </p>
      </div>
    );
  }

  if (projectionQueue.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-primary/20">
              <Monitor className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Presenter</span>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <SlideCard slide={null} label="Live" icon={Monitor} variant="live" />
          <SlideCard slide={null} label="Next" icon={SkipForward} variant="next" />
          
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary/20">
            <Monitor className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Presenter</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {currentSlideIndex + 1} / {projectionQueue.length}
          </span>
          <Button onClick={commitCurrentSlide} size="sm" className="gap-1.5 h-7 text-xs">
            <Send className="h-3 w-3" />
            Commit
          </Button>
        </div>
      </div>

      {/* Slide stack with visual hierarchy */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <SlideCard slide={liveSlide} label="Live" icon={Monitor} variant="live" />
        <SlideCard slide={displayNext} label="Next" icon={SkipForward} variant="next" />
        <SlideCard slide={displayNextPlusOne} label="Next +1" icon={SkipForward} variant="upcoming" />
      </div>
    </div>
  );
}
