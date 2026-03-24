// Bible Projection App - Input Controller
// Handles keyboard input and coordinates between UI, SearchEngine, and StateManager
// Per MCD: Input mutates state only

import { useCallback, useEffect } from 'react';
import { useStateManager } from './stateManager';
import { SearchEngine } from './searchEngine';

/**
 * Input Controller Hook
 * Provides handlers for all operator input actions
 */
export function useInputController() {
  const {
    searchQuery,
    searchResults,
    selectedResultIndex,
    previewPassage,
    currentTranslation,
    setSearchQuery,
    setSearchResults,
    setPreview,
    selectNext,
    selectPrevious,
    commitPassage,
    clearPreview,
  } = useStateManager();
  
  /**
   * Handle search input changes
   * Per Implementation Guide: Capture operator input, query SearchEngine, update preview
   */
  const handleInputChange = useCallback((value: string) => {
    // Validate input
    if (!SearchEngine.isValidInput(value)) {
      return;
    }
    
    // Update search query state
    setSearchQuery(value);
    
    // Empty input -> clear results and preview
    if (!value.trim()) {
      setSearchResults([]);
      setPreview(null);
      return;
    }
    
    // Query SearchEngine with current translation
    const results = SearchEngine.search(value, currentTranslation);
    
    // Update results (this also auto-previews first result)
    setSearchResults(results);
  }, [currentTranslation, setSearchQuery, setSearchResults, setPreview]);
  
  /**
   * Handle keyboard navigation
   * Per MCD: Arrow Up/Down navigate results, Enter commits, Esc clears
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectNext();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        selectPrevious();
        break;
        
      case 'Escape':
        event.preventDefault();
        clearPreview();
        break;
    }
  }, [selectNext, selectPrevious, previewPassage, commitPassage, clearPreview]);
  
  /**
   * Handle result selection via click
   */
  const handleResultSelect = useCallback((index: number) => {
    if (index >= 0 && index < searchResults.length) {
      setPreview(searchResults[index].passage);
    }
  }, [searchResults, setPreview]);
  
  /**
   * Handle autocomplete suggestion selection
   * Loads the reference through the existing slide generation pipeline
   */
  const handleSuggestionSelect = useCallback((reference: string) => {
    setSearchQuery(reference);
    
    // Query SearchEngine with the selected reference
    const results = SearchEngine.search(reference, currentTranslation);
    setSearchResults(results);
  }, [currentTranslation, setSearchQuery, setSearchResults]);

  return {
    // State
    searchQuery,
    searchResults,
    selectedResultIndex,
    previewPassage,
    
    // Handlers
    handleInputChange,
    handleKeyDown,
    handleResultSelect,
    handleSuggestionSelect,
    
    // Actions
    commitPassage,
    clearPreview,
  };
}

/**
 * Global keyboard shortcuts hook
 * For app-wide keyboard handling including passage navigation
 */
export function useGlobalKeyboard() {
  const {
    clearPreview,
    commitCurrentSlide,
    projectionQueue,
    slideNext,
    slidePrevious,
    loadChapterAsQueue,
    blankScreen,
    goToNextChapter,
    goToPreviousChapter,
  } = useStateManager();

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'Escape':
          clearPreview();
          return;

        case 'ArrowRight':
          event.preventDefault();
          slideNext();
          commitCurrentSlide();
          return;

        case 'ArrowLeft':
          event.preventDefault();
          slidePrevious();
          commitCurrentSlide();
          return;

        case 'c':
        case 'C':
          event.preventDefault();
          loadChapterAsQueue();
          return;

        case 'b':
        case 'B':
          event.preventDefault();
          blankScreen();
          return;

        case 'PageDown':
          event.preventDefault();
          goToNextChapter();
          return;

        case 'PageUp':
          event.preventDefault();
          goToPreviousChapter();
          return;

        case 'n':
        case 'N':
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('nextServicePlanPassage'));
          return;

        case 'Enter':
          if (event.shiftKey) {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('nextServicePlanPassage'));
          }
          return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [clearPreview, commitCurrentSlide, projectionQueue, slideNext, slidePrevious, loadChapterAsQueue, blankScreen, goToNextChapter, goToPreviousChapter]);
}
