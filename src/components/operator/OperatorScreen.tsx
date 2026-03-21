import { useEffect, useState } from 'react';
import { OnboardingManager } from '@/components/onboarding/OnboardingManager';
import { useInputController, useGlobalKeyboard } from '@/core/inputController';
import { useStateManager } from '@/core/stateManager';
import { BibleRepository } from '@/core/bibleRepository';
import { SearchEngine } from '@/core/searchEngine';
import { onBroadcastMessage, broadcastStateResponse } from '@/core/broadcastSync';
import { SearchInput } from './SearchInput';
import { ResultsList } from './ResultsList';
import { PresenterPanel } from './PresenterPanel';
import { PassageNavigation } from './PassageNavigation';
import { BibleNavigator } from './BibleNavigator';
import { ServicePlan } from './ServicePlan';
import { RecentPassages } from './RecentPassages';
import { ProjectionSettings } from './ProjectionSettings';
import { Book, Monitor, Search, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function OperatorScreen() {
  const [displayOpen, setDisplayOpen] = useState(false);
  const {
    searchQuery,
    searchResults,
    selectedResultIndex,
    handleInputChange,
    handleKeyDown,
    handleResultSelect,
    handleSuggestionSelect,
    clearPreview,
  } = useInputController();

  const { committedPassage, isLoading, isBibleLoaded, setBibleLoaded, setLoading, isScreenBlanked } = useStateManager();

  useGlobalKeyboard();

  useEffect(() => {
    const unsub = onBroadcastMessage((msg) => {
      if (msg.type === 'REQUEST_STATE') {
        const state = useStateManager.getState();
        broadcastStateResponse(state.committedPassage);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isBibleLoaded) {
      setLoading(true);
      Promise.all([
        BibleRepository.loadFromZip('/data/KJV_Bible_JSON.zip'),
        SearchEngine.loadSemanticIndex('/data/semanticIndex.json'),
      ])
        .then(() => {
          setBibleLoaded(true);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load Bible:', error);
          setLoading(false);
        });
    }
  }, [isBibleLoaded, setBibleLoaded, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading Bible data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <OnboardingManager />
      {/* Compact Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-sm text-foreground leading-tight">Bible Projection</h1>
                <p className="text-[10px] text-muted-foreground leading-tight">Operator Control</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                KJV
              </span>

              {committedPassage && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                  <Monitor className="h-3.5 w-3.5 text-primary" />
                  <PassageNavigation />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => window.open('/projection', 'projector', 'noopener')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Projector
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main dual-column layout */}
      <main className="flex-1 flex min-h-0">
        {/* Left Column - Workflow sections */}
        <div className="w-[380px] shrink-0 border-r border-border flex flex-col bg-card/30">
          <ScrollArea className="flex-1 min-h-0">
            {/* ===== SCRIPTURE SECTION ===== */}
            <div className="border-b border-border">
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Scripture</span>
              </div>

              {/* Search */}
              <div className="px-3 pb-2" data-tutorial="search" onKeyDown={handleKeyDown}>
                <SearchInput
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onClear={clearPreview}
                  onSelectSuggestion={handleSuggestionSelect}
                  isLoading={isLoading}
                  placeholder="Search reference or keyword..."
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="px-2 pb-2">
                  <ResultsList
                    results={searchResults}
                    selectedIndex={selectedResultIndex}
                    onSelect={handleResultSelect}
                  />
                </div>
              )}

              {/* Recent Passages (inline, compact) */}
              <div data-tutorial="recent"><RecentPassages /></div>

              {/* Bible Navigator */}
              <div data-tutorial="navigator"><BibleNavigator /></div>
            </div>

            {/* ===== SERVICE SECTION ===== */}
            <div className="border-b border-border">
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Service</span>
              </div>
              <div data-tutorial="service"><ServicePlan /></div>
            </div>

            {/* ===== DISPLAY SECTION (collapsible) ===== */}
            <div>
              <button
                onClick={() => setDisplayOpen(!displayOpen)}
                className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-accent/10 transition-colors"
              >
                {displayOpen ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Display</span>
              </button>
              {displayOpen && (
                <div className="px-3 pb-3">
                  <ProjectionSettings />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column - Presenter Panel */}
        <div className="flex-1 min-w-0 flex flex-col" data-tutorial="presenter">
          <PresenterPanel />
        </div>
      </main>

      {/* Keyboard shortcut hint bar */}
      <footer className="border-t border-border bg-card/50 shrink-0">
        <div className="px-4 py-1.5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">←</kbd> Prev
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">→</kbd> Next
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> Results
          </span>
          <span className="text-border">│</span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">C</kbd> Chapter
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">B</kbd> Blank
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">⇧Enter</kbd> Next Passage
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> Clear
          </span>
        </div>
      </footer>
    </div>
  );
}
