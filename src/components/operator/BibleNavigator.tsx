import { useState, useMemo, useCallback } from 'react';
import { BibleRepository } from '@/core/bibleRepository';
import { useStateManager } from '@/core/stateManager';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, BookOpen, Layers, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavLevel = 'books' | 'chapters' | 'verses';

export function BibleNavigator() {
  const [level, setLevel] = useState<NavLevel>('books');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { buildQueueFromPassage, buildQueueFromChapter } = useStateManager();

  const books = useMemo(() => BibleRepository.getAllBooks(), []);

  const chapters = useMemo(() => {
    if (!selectedBook) return [];
    return BibleRepository.getChapters(selectedBook);
  }, [selectedBook]);

  const verses = useMemo(() => {
    if (!selectedBook || !selectedChapter) return [];
    return BibleRepository.getVerses(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter]);

  const handleBookClick = useCallback((book: string) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setLevel('chapters');
  }, []);

  const handleChapterClick = useCallback((chapter: string) => {
    setSelectedChapter(chapter);
    setLevel('verses');
  }, []);

  const handleProjectChapter = useCallback(() => {
    if (!selectedBook || !selectedChapter) return;
    buildQueueFromChapter(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter, buildQueueFromChapter]);

  const handleVerseClick = useCallback((verseNum: string) => {
    if (!selectedBook || !selectedChapter) return;
    const passage = BibleRepository.getPassage({
      book: selectedBook,
      chapter: selectedChapter,
      verseStart: verseNum,
      translation: 'KJV',
    });
    if (passage) {
      buildQueueFromPassage(passage);
    }
  }, [selectedBook, selectedChapter, buildQueueFromPassage]);

  const goBack = useCallback(() => {
    if (level === 'verses') {
      setLevel('chapters');
      setSelectedChapter(null);
    } else if (level === 'chapters') {
      setLevel('books');
      setSelectedBook(null);
    }
  }, [level]);

  const breadcrumb = level === 'books'
    ? 'Browse Bible'
    : level === 'chapters'
      ? selectedBook
      : `${selectedBook} ${selectedChapter}`;

  return (
    <div className="px-2 pb-2">
      {/* Header / Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-1 py-1.5"
      >
        <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-1 text-left">
          {breadcrumb}
        </span>
        {level !== 'books' && (
          <button
            onClick={e => { e.stopPropagation(); goBack(); }}
            className="p-0.5 rounded hover:bg-accent"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </button>

      {/* Content - always shown when navigating deeper, toggle for books */}
      {(level !== 'books' || expanded) && (
        <div>
          {level === 'books' && (
            <div className="grid grid-cols-2 gap-0.5">
              {books.map((book) => (
                <button
                  key={book}
                  onClick={() => handleBookClick(book)}
                  className="flex items-center justify-between px-2 py-1.5 rounded text-xs text-left hover:bg-accent transition-colors group"
                >
                  <span className="truncate text-foreground">{book}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {level === 'chapters' && (
            <div className="grid grid-cols-5 gap-0.5">
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterClick(ch)}
                  className="flex items-center justify-center h-8 rounded text-sm font-medium hover:bg-accent text-foreground transition-colors"
                >
                  {ch}
                </button>
              ))}
            </div>
          )}

          {level === 'verses' && (
            <div className="space-y-1.5">
              <Button
                onClick={handleProjectChapter}
                variant="secondary"
                size="sm"
                className="w-full text-xs gap-1.5 h-7"
              >
                <Layers className="h-3 w-3" />
                Load Full Chapter
              </Button>
              <div className="grid grid-cols-5 gap-0.5">
                {verses.map((v) => (
                  <button
                    key={v.verse}
                    onClick={() => handleVerseClick(v.verse)}
                    className="flex items-center justify-center h-8 rounded text-sm font-medium hover:bg-accent text-foreground transition-colors"
                  >
                    {v.verse}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
