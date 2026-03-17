import { useCallback } from 'react';
import { useStateManager } from '@/core/stateManager';
import { BibleRepository } from '@/core/bibleRepository';
import { cn } from '@/lib/utils';
import { Clock, Play } from 'lucide-react';

export function RecentPassages() {
  const { recentPassages, projectionQueue, currentSlideIndex, buildQueueFromPassage, buildQueueFromChapter } = useStateManager();

  const loadRecent = useCallback((reference: string) => {
    const rangePattern = /^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/i;
    const chapterPattern = /^(.+?)\s+(\d+)$/i;

    const rangeMatch = reference.match(rangePattern);
    if (rangeMatch) {
      const [, bookPart, chapter, verseStart, verseEnd] = rangeMatch;
      const bookName = BibleRepository.resolveBookName(bookPart.trim());
      if (!bookName) return;
      const passage = BibleRepository.getPassage({ book: bookName, chapter, verseStart, verseEnd, translation: 'KJV' });
      if (passage) buildQueueFromPassage(passage);
      return;
    }

    const chapterMatch = reference.match(chapterPattern);
    if (chapterMatch) {
      const [, bookPart, chapter] = chapterMatch;
      const bookName = BibleRepository.resolveBookName(bookPart.trim());
      if (!bookName) return;
      buildQueueFromChapter(bookName, chapter);
    }
  }, [buildQueueFromPassage, buildQueueFromChapter]);

  const isActive = useCallback((reference: string) => {
    if (!projectionQueue.length) return false;
    const first = projectionQueue[0];
    return reference.startsWith(`${first.book} ${first.chapter}`);
  }, [projectionQueue]);

  if (recentPassages.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <div className="flex items-center gap-1.5 px-1 py-1.5">
        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
      </div>
      <div className="space-y-0.5">
        {recentPassages.slice(0, 8).map((ref, idx) => {
          const active = isActive(ref);
          return (
            <button
              key={`${ref}-${idx}`}
              onClick={() => loadRecent(ref)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
                active
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-accent border border-transparent'
              )}
            >
              {active ? (
                <Play className="h-3 w-3 text-primary fill-primary shrink-0" />
              ) : (
                <span className="text-[10px] text-muted-foreground font-mono w-3 text-center shrink-0">{idx + 1}</span>
              )}
              <span className={cn('text-xs truncate', active ? 'font-medium text-primary' : 'text-foreground')}>
                {ref}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
