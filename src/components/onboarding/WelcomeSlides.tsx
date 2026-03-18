import { useState } from 'react';
import { Book, Zap, ListChecks, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    icon: Book,
    title: 'Welcome to Bible Projection',
    description: 'A fast, offline-first scripture projection system built for live church services.',
  },
  {
    icon: Zap,
    title: 'Instant Scripture Projection',
    description: 'Select any verse and it projects immediately — no extra steps. Search, browse, or pick from your service plan.',
  },
  {
    icon: ListChecks,
    title: 'Service Plan & Live Control',
    description: 'Prepare your passages ahead of time, then navigate through them with keyboard shortcuts during the service.',
  },
  {
    icon: Rocket,
    title: 'Ready to Begin?',
    description: 'Everything runs offline. Your projection screen stays in sync automatically via a second browser tab.',
  },
];

interface WelcomeSlidesProps {
  onComplete: () => void;
}

export function WelcomeSlides({ onComplete }: WelcomeSlidesProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">{slide.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {!isLast && (
            <button
              onClick={onComplete}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => (isLast ? onComplete() : setCurrent(current + 1))}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {isLast ? 'Enter App' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
