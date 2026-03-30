// Bible Projection App - Input Controller
// Handles keyboard input and coordinates between UI, SearchEngine, and StateManager
// Per MCD: Input mutates state only

import { useCallback, useEffect, useRef } from 'react';
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
    returnToLastPassage,
  } = useStateManager();

  // Store handlers in refs to avoid re-registering the listener
  const handlersRef = useRef({
    clearPreview,
    commitCurrentSlide,
    slideNext,
    slidePrevious,
    loadChapterAsQueue,
    blankScreen,
    goToNextChapter,
    goToPreviousChapter,
    returnToLastPassage,
  });

  // Keep refs current without re-registering the event listener
  useEffect(() => {
    handlersRef.current = {
      clearPreview,
      commitCurrentSlide,
      slideNext,
      slidePrevious,
      loadChapterAsQueue,
      blankScreen,
      goToNextChapter,
      goToPreviousChapter,
      returnToLastPassage,
    };
  });

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Skip shortcuts when user is typing in an input field
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const h = handlersRef.current;

      switch (event.key) {
        case 'Escape':
          h.clearPreview();
          return;

        case 'ArrowRight':
          event.preventDefault();
          h.slideNext();
          h.commitCurrentSlide();
          return;

        case 'ArrowLeft':
          event.preventDefault();
          h.slidePrevious();
          h.commitCurrentSlide();
          return;

        case 'c':
        case 'C':
          event.preventDefault();
          h.loadChapterAsQueue();
          return;

        case 'b':
        case 'B':
          event.preventDefault();
          h.blankScreen();
          return;

        case 'PageDown':
          event.preventDefault();
          h.goToNextChapter();
          return;

        case 'PageUp':
          event.preventDefault();
          h.goToPreviousChapter();
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
  }, []); // Registered once, uses refs for current handlers
}
