import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Book, BookOpen, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getSuggestions, type Suggestion } from '@/core/autocomplete';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onClear: () => void;
  onSelectSuggestion?: (reference: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  onFocus?: () => void;
}

const typeIcons = {
  book: Book,
  chapter: BookOpen,
  verse: FileText,
};

export function SearchInput({
  value,
  onChange,
  onKeyDown,
  onClear,
  onSelectSuggestion,
  isLoading = false,
  placeholder = 'Search by reference or keyword... (e.g., John 3:16)',
  onFocus: onFocusProp,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update suggestions when value changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const results = getSuggestions(value);
    setSuggestions(results);
    setSelectedSuggestion(-1);
    setShowSuggestions(results.length > 0);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion.reference);
    } else {
      onChange(suggestion.reference);
    }
  }, [onChange, onSelectSuggestion]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          setSelectedSuggestion(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return;

        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          setSelectedSuggestion(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return;

        case 'Enter':
          if (selectedSuggestion >= 0) {
            event.preventDefault();
            event.stopPropagation();
            selectSuggestion(suggestions[selectedSuggestion]);
            return;
          }
          break;

        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          setShowSuggestions(false);
          setSelectedSuggestion(-1);
          return;

        case 'Tab':
          if (selectedSuggestion >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[selectedSuggestion]);
            return;
          } else if (suggestions.length > 0) {
            event.preventDefault();
            selectSuggestion(suggestions[0]);
            return;
          }
          break;
      }
    }

    // Pass through to parent handler
    onKeyDown(event);
  }, [showSuggestions, suggestions, selectedSuggestion, selectSuggestion, onKeyDown]);

  return (
    <div ref={containerRef} className="relative group">
      {/* Search affordance sits inside the glass control, not beside it */}
      <Search
        className={cn(
          'absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10 transition-colors duration-150',
          value ? 'text-primary/80' : 'text-text-muted group-focus-within:text-primary/80'
        )}
      />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
          onFocusProp?.();
        }}
        placeholder={placeholder}
        className={cn(
          'glass interactive h-11 pl-10 pr-10 text-sm rounded-lg',
          'text-foreground placeholder:text-text-muted/80',
          'focus-visible:ring-2 focus-visible:ring-focus/70 focus-visible:ring-offset-0',
          'focus-visible:border-primary/40'
        )}
        autoComplete="off"
        spellCheck={false}
      />
      {value && !isLoading && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-surface-glass-elevated/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          tabIndex={-1}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isLoading && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Autocomplete dropdown — genuinely floating UI */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="glass-floating absolute left-0 right-0 top-full mt-2 z-50 rounded-lg overflow-hidden p-1">
          {suggestions.map((suggestion, index) => {
            const Icon = typeIcons[suggestion.type];
            const isActive = index === selectedSuggestion;
            return (
              <button
                key={`${suggestion.reference}-${index}`}
                aria-selected={isActive}
                className={cn(
                  'interactive w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-left rounded-md border border-transparent',
                  isActive ? 'text-foreground' : 'text-text-secondary'
                )}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  selectSuggestion(suggestion);
                }}
                onMouseEnter={() => setSelectedSuggestion(index)}
                tabIndex={-1}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-text-muted')} />
                <span className="truncate text-label">{suggestion.display}</span>
                <span className="ml-auto text-[10px] text-text-muted capitalize">
                  {suggestion.type}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

