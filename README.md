# Remix of Remix of Remix of Remix of Remix of Bible Previewer

Context:

You are building v1 of a Bible Projection App. Only use the provided materials:

PRD.md – Product Requirements Document

MCD.md – Master Context Document (screen inventory, state inventory, data contracts, pure/impure boundaries)

KJV Bible JSON ZIP file – read-only Bible data

Do not invent anything outside these materials. Follow the constraints strictly.

Task Description

Implement the Operator Screen search → preview flow.

Scope:

Operator types a search query

Display ranked search results on Operator Screen

Update the preview passage state in StateManager

Do not commit to Projection Screen

Step-by-Step Implementation Guide
1. Capture Operator Input

File: src/core/inputController.js
Function: handleInputChange(value: string)

Steps:

Receive keyboard input from the operator

Update Search Query State: StateManager.setSearchQuery(value)

If input is empty → clear previewPassage and results on UI

Otherwise → pass input and currentTranslation to SearchEngine.search(value, currentTranslation)

2. Query SearchEngine

File: src/core/searchEngine.js
Function: search(query: string, translation: string)

Steps:

Receive query + translation

Lookup passages via BibleRepository and SemanticIndex (read-only)

Rank passages (exact match first, then semantic matches)

Return top N ranked passages (default N = 5)

3. Update Preview State

File: inputController.js (continuation)

Steps:

Take top-ranked passage from SearchEngine

Call StateManager.setPreview(passage) to update Preview Passage State

Ensure Committed Passage State remains untouched

No updates to Projection Screen

4. Operator Screen Display

File: src/core/ui/mainUI.js

Steps:

Read previewPassage from StateManager

Render passage in the Operator Screen results panel

Display ranked results list

Update dynamically on input changes

Edge cases:

Empty input → clear preview panel

No matches → display “No matches found”

5. Edge Cases & Error Handling

Sanitize invalid input characters

Translation not loaded → fall back to KJV

Empty search result → set previewPassage to null

6. Testing Notes

Unit tests for handleInputChange:

Normal input → top passage correct

Empty input → preview cleared

No matches → empty results displayed

Integration test: Input → StateManager → Operator Screen render

7. Constraints (Must Follow Strictly)

Data: Bible JSON / Semantic Index → read-only, accessed only via BibleRepository

State: Only mutate searchQuery and previewPassage

Screens: Only Operator Screen

Logic: Pure ranking may be computed freely; all mutations through StateManager APIs

Side Effects: Must not update Projection Screen or any other state

Deliverables for Lovable

inputController.js with handleInputChange

Integration with SearchEngine.search

Operator Screen renders preview dynamically.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sermon-search.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2dc652a-99d3-4379-9c9d-247f8f33dea2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
