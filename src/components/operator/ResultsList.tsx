import { cn } from '@/lib/utils';
import type { SearchResult } from '@/core/types';
import { Book, Hash, Search, Sparkles } from 'lucide-react';

interface ResultsListProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const matchTypeIcons = {
  exact: Book,
  reference: Hash,
  keyword: Search,
  semantic: Sparkles,
};

const matchTypeLabels = {
  exact: 'Exact',
  reference: 'Reference',
  keyword: 'Keyword',
  semantic: 'Topic',
};

export function ResultsList({ results, selectedIndex, onSelect }: ResultsListProps) {
  if (results.length === 0) {
    return null;
  }
  
  return (
    <div className="glass-subtle rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle/10">
        <span className="text-[10px] uppercase tracking-wider text-text-muted text-label">Results</span>
        <span className="text-[10px] text-text-muted tabular-nums">{results.length}</span>
      </div>
      <div className="p-1">
        {results.map((result, index) => {
          const Icon = matchTypeIcons[result.matchType];
          const isSelected = index === selectedIndex;

          return (
            <button
              key={`${result.passage.displayReference}-${index}`}
              onClick={() => onSelect(index)}
              aria-selected={isSelected}
              className={cn(
                'interactive w-full text-left px-2.5 py-2.5 rounded-md border border-transparent',
                isSelected && 'is-selected'
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={cn(
                  'mt-0.5 p-1.5 rounded-md shrink-0',
                  isSelected ? 'bg-primary/15 text-primary' : 'bg-surface-glass-elevated/60 text-text-muted'
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm',
                      isSelected ? 'text-foreground text-display' : 'text-text-secondary text-label'
                    )}>
                      {result.passage.displayReference}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-text-muted bg-surface-glass-elevated/50">
                      {matchTypeLabels[result.matchType]}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs line-clamp-2 mt-1 scripture-text leading-snug',
                    isSelected ? 'text-text-secondary' : 'text-text-muted'
                  )}>
                    {result.passage.text}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

