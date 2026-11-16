const STORAGE_KEY = "flashcards-app-state";
const STORAGE_VERSION = 1;

function isValidState(state) {
  if (
    state === null
    || typeof state !== "object"
    || !Array.isArray(state.decks)
    || !Number.isSafeInteger(state.nextDeckId)
    || !Number.isSafeInteger(state.nextCardId)
    || !(state.activeDeckId === null || Number.isSafeInteger(state.activeDeckId))
  ) {
    return false;
  }

  const deckIds = new Set();
  const cardIds = new Set();
  let maxDeckId = 0;
  let maxCardId = 0;

  for (const deck of state.decks) {
    if (
      deck === null
      || typeof deck !== "object"
      || !Number.isSafeInteger(deck.id)
      || deck.id < 1
      || deckIds.has(deck.id)
      || typeof deck.name !== "string"
      || !Array.isArray(deck.cards)
    ) {
      return false;
    }

    deckIds.add(deck.id);
    maxDeckId = Math.max(maxDeckId, deck.id);

    for (const card of deck.cards) {
      if (
        card === null
        || typeof card !== "object"
        || !Number.isSafeInteger(card.id)
        || card.id < 1
        || cardIds.has(card.id)
        || typeof card.front !== "string"
        || typeof card.back !== "string"
      ) {
        return false;
      }

      cardIds.add(card.id);
      maxCardId = Math.max(maxCardId, card.id);
    }
  }

  return (
    state.nextDeckId > maxDeckId
    && state.nextCardId > maxCardId
    && (state.activeDeckId === null || deckIds.has(state.activeDeckId))
  );
}

function loadState(fallbackState = {
  decks: [],
  nextDeckId: 1,
  nextCardId: 1,
  activeDeckId: null
}) {
  let serialized;

  try {
    serialized = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to read flashcard state; using the initial state.", error);
    return fallbackState;
  }

  if (serialized === null) return fallbackState;

  let record;
  try {
    record = JSON.parse(serialized);
  } catch (error) {
    console.warn("Stored flashcard state is not valid JSON; using the initial state.", error);
    return fallbackState;
  }

  if (
    record === null
    || typeof record !== "object"
    || record.version !== STORAGE_VERSION
    || !isValidState(record.state)
  ) {
    console.warn("Stored flashcard state has an unsupported version or invalid data; using the initial state.");
    return fallbackState;
  }

  return record.state;
}

function saveState(state) {
  if (!isValidState(state)) {
    throw new TypeError("Refusing to save invalid flashcard state.");
  }

  const serialized = JSON.stringify({
    version: STORAGE_VERSION,
    state
  });
  window.localStorage.setItem(STORAGE_KEY, serialized);
}
