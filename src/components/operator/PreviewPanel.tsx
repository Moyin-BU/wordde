import { cn } from '@/lib/utils';
import type { Passage } from '@/core/types';
import { Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  passage: Passage | null;
  onCommit: () => void;
  hasCommitted: boolean;
  isScreenBlanked?: boolean;
}

export function PreviewPanel({ passage, onCommit, hasCommitted, isScreenBlanked }: PreviewPanelProps) {
  if (isScreenBlanked) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted p-8">
        <Eye className="h-10 w-10 mb-4 opacity-30" />
        <p className="text-center text-base text-label text-text-secondary">Screen Blanked</p>
        <p className="text-sm mt-2 text-text-muted">
          Press <kbd className="px-1.5 py-0.5 rounded bg-surface-glass-elevated/60 text-[10px]">Enter</kbd> to commit a verse and restore projection
        </p>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted p-8">
        <Eye className="h-10 w-10 mb-4 opacity-30" />
        <p className="text-center text-sm text-text-secondary">
          Search for a passage to preview it here
        </p>
        <p className="text-sm mt-2 text-text-muted">
          Type a reference like "John 3:16" or search by keyword
        </p>
      </div>
    );
  }

  return (
    <div className="glass-subtle h-full flex flex-col rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-accent/10">
            <Eye className="h-3.5 w-3.5 text-accent/90" />
          </div>
          <span className="text-xs text-label text-text-secondary">Preview</span>
        </div>
        <span className="scripture-reference text-reference text-sm">
          {passage.displayReference}
        </span>
      </div>

      {/* Scripture Content */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0">
        <blockquote className="scripture-text text-xl leading-relaxed text-scripture">
          {passage.verses.map((verse, index) => (
            <span key={verse.verse}>
              <sup className="text-[10px] text-text-muted mr-1 align-super">{verse.verse}</sup>
              {verse.text}
              {index < passage.verses.length - 1 && ' '}
            </span>
          ))}
        </blockquote>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border-subtle/10 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-text-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-glass-elevated/60 text-[10px]">Enter</kbd> to commit to projection
          </p>
          <Button
            onClick={onCommit}
            size="sm"
            className="gap-2 rounded-md"
            variant={hasCommitted ? 'secondary' : 'default'}
          >
            <Send className="h-3.5 w-3.5" />
            Commit to Projection
          </Button>
        </div>
      </div>
    </div>
  );
}

