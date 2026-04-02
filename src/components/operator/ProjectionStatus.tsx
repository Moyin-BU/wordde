import { useStateManager } from '@/core/stateManager';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

export function ProjectionStatus() {
  const { isScreenBlanked, projectionLocked, liveSlideIndex, projectionPulse, undoMessage } = useStateManager();

  const status = isScreenBlanked
    ? { label: 'Blanked', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' }
    : projectionLocked
      ? { label: 'Locked', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
      : liveSlideIndex !== null
        ? { label: 'Live', color: 'bg-green-500', textColor: 'text-green-600' }
        : { label: 'Idle', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', status.textColor)}>
        {projectionLocked && <Lock className="h-3 w-3" />}
        <span
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-150',
            status.color,
            status.label === 'Live' && 'animate-pulse',
            projectionPulse && 'projection-pulse',
          )}
        />
        {status.label}
      </div>
      {undoMessage && (
        <span className="text-[10px] text-muted-foreground animate-fade-in opacity-0 undo-message">
          {undoMessage}
        </span>
      )}
    </div>
  );
}
