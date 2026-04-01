// Bible Projection App - State Manager
// Single source of truth for all application state
// Per MCD: State is the truth. UI is a projection.

import { create } from 'zustand';
import type { AppState, Passage, Slide, SearchResult } from './types';
import { BibleRepository } from './bibleRepository';
import { broadcastCommit, broadcastBlank, broadcastUnblank, loadBlankSettings, persistProjectionState } from './broadcastSync';

interface StateManager extends AppState {
  // State mutation methods
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setPreview: (passage: Passage | null) => void;
  setSelectedIndex: (index: number) => void;
  commitPassage: () => void;
  clearPreview: () => void;
  setTranslation: (translation: string) => void;
  setLoading: (loading: boolean) => void;
  setBibleLoaded: (loaded: boolean) => void;

  // Search result navigation
  selectNext: () => void;
  selectPrevious: () => void;

  // Projection queue (slide-based)
  projectionQueue: Slide[];
  currentSlideIndex: number;
  liveSlideIndex: number | null;
  isScreenBlanked: boolean;

  // Slide actions
  buildQueueFromPassage: (passage: Passage) => void;
  buildQueueFromChapter: (book: string, chapter: string) => void;

  // Recent passages
  recentPassages: string[];
  addToRecent: (reference: string) => void;
  removeFromRecent: (reference: string) => void;
  clearAllRecent: () => void;

  // Projection history (multi-step undo)
  historyStack: Slide[];
  previousSlide: Slide | null;
  returnToLastPassage: () => void;
  undoProjection: () => void;

  // Projection lock
  projectionLocked: boolean;
  toggleProjectionLock: () => void;
  projectNow: () => void;

  slideNext: () => void;
  slidePrevious: () => void;
  commitCurrentSlide: () => void;
  blankScreen: () => void;
  loadChapterAsQueue: () => void;

  // Legacy committed passage (derived from live slide)
  committedPassage: Passage | null;

  // Legacy navigation kept for header controls
  goToNextVerse: () => void;
  goToPreviousVerse: () => void;
  goToNextChapter: () => void;
  goToPreviousChapter: () => void;
  displayCurrentChapter: () => void;
  previewNextVerse: () => void;
  previewPreviousVerse: () => void;
  previewCurrentChapter: () => void;
}

function passageToSlides(passage: Passage): Slide[] {
  return passage.verses.map((v) => ({
    reference: `${passage.reference.book} ${passage.reference.chapter}:${v.verse}`,
    text: v.text,
    book: passage.reference.book,
    chapter: passage.reference.chapter,
    verse: v.verse,
  }));
}

function chapterToSlides(book: string, chapter: string): Slide[] {
  const verses = BibleRepository.getVerses(book, chapter);
  return verses.map((v) => ({
    reference: `${book} ${chapter}:${v.verse}`,
    text: v.text,
    book,
    chapter,
    verse: v.verse,
  }));
}

function slideToPassage(slide: Slide): Passage {
  return {
    reference: {
      book: slide.book,
      chapter: slide.chapter,
      verseStart: slide.verse,
      translation: 'KJV',
    },
    displayReference: slide.reference,
    text: slide.text,
    verses: [{ verse: slide.verse, text: slide.text }],
  };
}

export const useStateManager = create<StateManager>((set, get) => ({
  // App state
  searchQuery: '',
  searchResults: [],
  previewPassage: null,
  selectedResultIndex: -1,
  committedPassage: null,
  currentTranslation: 'KJV',
  displayMode: 'operator-only',
  isLoading: false,
  isBibleLoaded: false,

  // Projection queue state
  historyStack: [],
  previousSlide: null,
  projectionLocked: false,
  projectionQueue: [],
  currentSlideIndex: 0,
  liveSlideIndex: null,
  isScreenBlanked: false,

  // Recent passages
  recentPassages: (() => {
    try { return JSON.parse(localStorage.getItem('recentPassages') || '[]'); } catch { return []; }
  })(),
  addToRecent: (reference: string) => {
    const MAX = 15;
    const current = get().recentPassages.filter(r => r !== reference);
    const updated = [reference, ...current].slice(0, MAX);
    set({ recentPassages: updated });
    localStorage.setItem('recentPassages', JSON.stringify(updated));
  },
  removeFromRecent: (reference: string) => {
    const updated = get().recentPassages.filter(r => r !== reference);
    set({ recentPassages: updated });
    localStorage.setItem('recentPassages', JSON.stringify(updated));
  },
  clearAllRecent: () => {
    set({ recentPassages: [] });
    localStorage.setItem('recentPassages', JSON.stringify([]));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => {
    set({
      searchResults: results,
      selectedResultIndex: results.length > 0 ? 0 : -1,
    });

    if (results.length > 0) {
      const passage = results[0].passage;
      set({ previewPassage: passage });
      const slides = passageToSlides(passage);
      set({ projectionQueue: slides, currentSlideIndex: 0 });
      // Auto-project immediately
      get().commitCurrentSlide();
    } else {
      set({ previewPassage: null, projectionQueue: [], currentSlideIndex: 0 });
    }
  },

  setPreview: (passage) => {
    set({ previewPassage: passage });
    if (passage) {
      const slides = passageToSlides(passage);
      set({ projectionQueue: slides, currentSlideIndex: 0 });
      // Auto-project immediately
      get().commitCurrentSlide();
    }
  },

  setSelectedIndex: (index) => {
    const { searchResults } = get();
    if (index >= 0 && index < searchResults.length) {
      const passage = searchResults[index].passage;
      const slides = passageToSlides(passage);
      set({
        selectedResultIndex: index,
        previewPassage: passage,
        projectionQueue: slides,
        currentSlideIndex: 0,
      });
      // Auto-project immediately
      get().commitCurrentSlide();
    }
  },

  commitPassage: () => {
    // Commit the current slide in the queue
    get().commitCurrentSlide();
  },

  clearPreview: () => {
    set({
      searchQuery: '',
      searchResults: [],
      previewPassage: null,
      selectedResultIndex: -1,
      projectionQueue: [],
      currentSlideIndex: 0,
    });
  },

  setTranslation: (translation) => set({ currentTranslation: translation }),
  setLoading: (loading) => set({ isLoading: loading }),
  setBibleLoaded: (loaded) => set({ isBibleLoaded: loaded }),

  selectNext: () => {
    const { selectedResultIndex, searchResults } = get();
    if (selectedResultIndex < searchResults.length - 1) {
      const newIndex = selectedResultIndex + 1;
      const passage = searchResults[newIndex].passage;
      const slides = passageToSlides(passage);
      set({
        selectedResultIndex: newIndex,
        previewPassage: passage,
        projectionQueue: slides,
        currentSlideIndex: 0,
      });
    }
  },

  selectPrevious: () => {
    const { selectedResultIndex, searchResults } = get();
    if (selectedResultIndex > 0) {
      const newIndex = selectedResultIndex - 1;
      const passage = searchResults[newIndex].passage;
      const slides = passageToSlides(passage);
      set({
        selectedResultIndex: newIndex,
        previewPassage: passage,
        projectionQueue: slides,
        currentSlideIndex: 0,
      });
    }
  },

  // === Slide queue operations ===

  buildQueueFromPassage: (passage) => {
    const slides = passageToSlides(passage);
    set({ projectionQueue: slides, currentSlideIndex: 0 });
    // Auto-project immediately (commitCurrentSlide handles addToRecent)
    get().commitCurrentSlide();
  },

  buildQueueFromChapter: (book, chapter) => {
    const slides = chapterToSlides(book, chapter);
    set({ projectionQueue: slides, currentSlideIndex: 0 });
    // Auto-project immediately (commitCurrentSlide handles addToRecent)
    get().commitCurrentSlide();
  },

  slideNext: () => {
    const { currentSlideIndex, projectionQueue } = get();
    if (currentSlideIndex < projectionQueue.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1 });
    } else {
      // At end of queue: extend by loading next verse
      const lastSlide = projectionQueue[projectionQueue.length - 1];
      if (!lastSlide) return;
      const nextPos = BibleRepository.getNextVerse(lastSlide.book, lastSlide.chapter, lastSlide.verse);
      if (!nextPos) return;
      const verse = BibleRepository.getVerse(nextPos.book, nextPos.chapter, nextPos.verse);
      if (!verse) return;
      const newSlide: Slide = {
        reference: `${nextPos.book} ${nextPos.chapter}:${nextPos.verse}`,
        text: verse.text,
        book: nextPos.book,
        chapter: nextPos.chapter,
        verse: nextPos.verse,
      };
      set({
        projectionQueue: [...projectionQueue, newSlide],
        currentSlideIndex: currentSlideIndex + 1,
      });
    }
  },

  slidePrevious: () => {
    const { currentSlideIndex, projectionQueue } = get();
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1 });
    } else {
      // At start of queue: prepend previous verse
      const firstSlide = projectionQueue[0];
      if (!firstSlide) return;
      const prevPos = BibleRepository.getPreviousVerse(firstSlide.book, firstSlide.chapter, firstSlide.verse);
      if (!prevPos) return;
      const verse = BibleRepository.getVerse(prevPos.book, prevPos.chapter, prevPos.verse);
      if (!verse) return;
      const newSlide: Slide = {
        reference: `${prevPos.book} ${prevPos.chapter}:${prevPos.verse}`,
        text: verse.text,
        book: prevPos.book,
        chapter: prevPos.chapter,
        verse: prevPos.verse,
      };
      set({
        projectionQueue: [newSlide, ...projectionQueue],
        currentSlideIndex: 0, // stay on the newly prepended slide
      });
    }
  },

  returnToLastPassage: () => {
    const { previousSlide } = get();
    if (!previousSlide) return;
    const passage = slideToPassage(previousSlide);
    get().buildQueueFromPassage(passage);
  },

  undoProjection: () => {
    const { historyStack } = get();
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    // Pop from history without pushing current back (true undo)
    set({ historyStack: historyStack.slice(0, -1) });
    const passage = slideToPassage(last);
    // Build queue and project — buildQueueFromPassage will push current live to history
    get().buildQueueFromPassage(passage);
  },

  toggleProjectionLock: () => {
    set({ projectionLocked: !get().projectionLocked });
  },

  projectNow: () => {
    const { projectionQueue, currentSlideIndex, liveSlideIndex } = get();
    const slide = projectionQueue[currentSlideIndex];
    if (!slide) return;
    const oldLiveSlide = liveSlideIndex !== null ? projectionQueue[liveSlideIndex] ?? null : null;
    if (oldLiveSlide && (oldLiveSlide.book !== slide.book || oldLiveSlide.chapter !== slide.chapter || oldLiveSlide.verse !== slide.verse)) {
      set({ previousSlide: oldLiveSlide });
    }
    const passage = slideToPassage(slide);
    set({ liveSlideIndex: currentSlideIndex, committedPassage: passage, isScreenBlanked: false });
    broadcastCommit(passage);
    persistProjectionState({ passage, isBlanked: false, timestamp: Date.now() });
    get().addToRecent(slide.reference);
    // Pre-load next slide
    if (currentSlideIndex >= projectionQueue.length - 1) {
      const nextPos = BibleRepository.getNextVerse(slide.book, slide.chapter, slide.verse);
      if (nextPos) {
        const verse = BibleRepository.getVerse(nextPos.book, nextPos.chapter, nextPos.verse);
        if (verse) {
          set({ projectionQueue: [...get().projectionQueue, { reference: `${nextPos.book} ${nextPos.chapter}:${nextPos.verse}`, text: verse.text, book: nextPos.book, chapter: nextPos.chapter, verse: nextPos.verse }] });
        }
      }
    }
  },

  commitCurrentSlide: () => {
    const { projectionQueue, currentSlideIndex, liveSlideIndex, projectionLocked } = get();
    const slide = projectionQueue[currentSlideIndex];
    if (!slide) return;

    // When locked, only update preview — do NOT broadcast to projection
    if (projectionLocked) {
      // Pre-load next slide for preview
      if (currentSlideIndex >= projectionQueue.length - 1) {
        const nextPos = BibleRepository.getNextVerse(slide.book, slide.chapter, slide.verse);
        if (nextPos) {
          const verse = BibleRepository.getVerse(nextPos.book, nextPos.chapter, nextPos.verse);
          if (verse) {
            set({ projectionQueue: [...get().projectionQueue, { reference: `${nextPos.book} ${nextPos.chapter}:${nextPos.verse}`, text: verse.text, book: nextPos.book, chapter: nextPos.chapter, verse: nextPos.verse }] });
          }
        }
      }
      return;
    }

    // Normal (unlocked) projection
    const oldLiveSlide = liveSlideIndex !== null ? projectionQueue[liveSlideIndex] ?? null : null;
    if (oldLiveSlide && (oldLiveSlide.book !== slide.book || oldLiveSlide.chapter !== slide.chapter || oldLiveSlide.verse !== slide.verse)) {
      set({ previousSlide: oldLiveSlide });
    }
    const passage = slideToPassage(slide);
    set({ liveSlideIndex: currentSlideIndex, committedPassage: passage, isScreenBlanked: false });
    broadcastCommit(passage);
    persistProjectionState({ passage, isBlanked: false, timestamp: Date.now() });
    get().addToRecent(slide.reference);
    // Pre-load next slide
    if (currentSlideIndex >= projectionQueue.length - 1) {
      const nextPos = BibleRepository.getNextVerse(slide.book, slide.chapter, slide.verse);
      if (nextPos) {
        const verse = BibleRepository.getVerse(nextPos.book, nextPos.chapter, nextPos.verse);
        if (verse) {
          set({ projectionQueue: [...get().projectionQueue, { reference: `${nextPos.book} ${nextPos.chapter}:${nextPos.verse}`, text: verse.text, book: nextPos.book, chapter: nextPos.chapter, verse: nextPos.verse }] });
        }
      }
    }
  },

  blankScreen: () => {
    const { isScreenBlanked, committedPassage } = get();
    if (isScreenBlanked) {
      set({ isScreenBlanked: false });
      broadcastUnblank();
      persistProjectionState({ passage: committedPassage, isBlanked: false, timestamp: Date.now() });
    } else {
      set({ isScreenBlanked: true });
      const settings = loadBlankSettings();
      broadcastBlank(settings);
      persistProjectionState({ passage: committedPassage, isBlanked: true, blankSettings: settings, timestamp: Date.now() });
    }
  },

  loadChapterAsQueue: () => {
    const { projectionQueue, currentSlideIndex, previewPassage } = get();
    // Determine which book/chapter from current slide or preview
    const slide = projectionQueue[currentSlideIndex];
    const book = slide?.book || previewPassage?.reference.book;
    const chapter = slide?.chapter || previewPassage?.reference.chapter;
    if (!book || !chapter) return;

    const slides = chapterToSlides(book, chapter);
    if (slides.length === 0) return;

    // Commit entire chapter as a single passage to projector
    const verses = BibleRepository.getVerses(book, chapter);
    const chapterPassage = BibleRepository.getPassage({
      book,
      chapter,
      verseStart: '1',
      verseEnd: String(verses.length),
      translation: get().currentTranslation,
    });

    set({
      projectionQueue: slides,
      currentSlideIndex: 0,
      liveSlideIndex: null,
    });

    if (chapterPassage) {
      set({ committedPassage: chapterPassage, isScreenBlanked: false });
      broadcastCommit(chapterPassage);
    }
  },

  // === Legacy navigation methods (kept for header nav buttons) ===
  goToNextVerse: () => {
    get().slideNext();
    get().commitCurrentSlide();
  },
  goToPreviousVerse: () => {
    get().slidePrevious();
    get().commitCurrentSlide();
  },
  goToNextChapter: () => {
    const { committedPassage, currentTranslation } = get();
    if (!committedPassage) return;
    const { book, chapter } = committedPassage.reference;
    const chapterNum = parseInt(chapter, 10);
    const nextChapter = String(chapterNum + 1);
    const nextChapterVerses = BibleRepository.getVerses(book, nextChapter);
    if (nextChapterVerses.length > 0) {
      const slides = chapterToSlides(book, nextChapter);
      const passage = BibleRepository.getPassage({ book, chapter: nextChapter, verseStart: '1', translation: currentTranslation });
      if (passage) {
        set({ projectionQueue: slides, currentSlideIndex: 0, liveSlideIndex: 0, committedPassage: passage, isScreenBlanked: false });
        broadcastCommit(passage);
      }
      return;
    }
    const allBooks = BibleRepository.getAllBooks();
    const bookIndex = allBooks.findIndex(b => b.toLowerCase() === book.toLowerCase());
    if (bookIndex >= 0 && bookIndex < allBooks.length - 1) {
      const nextBook = allBooks[bookIndex + 1];
      const chapters = BibleRepository.getChapters(nextBook);
      if (chapters.length > 0) {
        const slides = chapterToSlides(nextBook, chapters[0]);
        const passage = BibleRepository.getPassage({ book: nextBook, chapter: chapters[0], verseStart: '1', translation: currentTranslation });
        if (passage) {
          set({ projectionQueue: slides, currentSlideIndex: 0, liveSlideIndex: 0, committedPassage: passage, isScreenBlanked: false });
          broadcastCommit(passage);
        }
      }
    }
  },
  goToPreviousChapter: () => {
    const { committedPassage, currentTranslation } = get();
    if (!committedPassage) return;
    const { book, chapter } = committedPassage.reference;
    const chapterNum = parseInt(chapter, 10);
    if (chapterNum > 1) {
      const prevChapter = String(chapterNum - 1);
      const slides = chapterToSlides(book, prevChapter);
      const passage = BibleRepository.getPassage({ book, chapter: prevChapter, verseStart: '1', translation: currentTranslation });
      if (passage) {
        set({ projectionQueue: slides, currentSlideIndex: 0, liveSlideIndex: 0, committedPassage: passage, isScreenBlanked: false });
        broadcastCommit(passage);
      }
      return;
    }
    const allBooks = BibleRepository.getAllBooks();
    const bookIndex = allBooks.findIndex(b => b.toLowerCase() === book.toLowerCase());
    if (bookIndex > 0) {
      const prevBook = allBooks[bookIndex - 1];
      const chapters = BibleRepository.getChapters(prevBook);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const slides = chapterToSlides(prevBook, lastChapter);
        const passage = BibleRepository.getPassage({ book: prevBook, chapter: lastChapter, verseStart: '1', translation: currentTranslation });
        if (passage) {
          set({ projectionQueue: slides, currentSlideIndex: 0, liveSlideIndex: 0, committedPassage: passage, isScreenBlanked: false });
          broadcastCommit(passage);
        }
      }
    }
  },
  displayCurrentChapter: () => { get().loadChapterAsQueue(); },
  previewNextVerse: () => { get().slideNext(); },
  previewPreviousVerse: () => { get().slidePrevious(); },
  previewCurrentChapter: () => { get().loadChapterAsQueue(); },
}));
