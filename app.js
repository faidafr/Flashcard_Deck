const initialState = {
  decks: [{
    id: 1,
    name: "Sample deck",
    cards: [{ id: 1, front: "What is the capital of France?", back: "Paris" }]
  }],
  nextDeckId: 2,
  nextCardId: 2,
  activeDeckId: 1
};
const loadedState = loadState(initialState);
const decks = loadedState.decks;
let nextDeckId = loadedState.nextDeckId;
let nextCardId = loadedState.nextCardId;
let activeDeckId = loadedState.activeDeckId;
let editingDeckId = null;
let modalOpener = null;
let editingCardId = null;
let editingCardDeckId = null;
let cardModalOpener = null;
let studySession = null;
let cardSearchQuery = "";
let cardSearchTimeout = null;

const createDeckButton = document.getElementById("create-deck");
const deckList = document.getElementById("deck-list");
const deckNavigation = document.getElementById("deck-navigation");
const deckEmptyState = document.getElementById("deck-empty-state");
const activeDeckName = document.getElementById("active-deck-name");
const cardEmptyState = document.getElementById("card-empty-state");
const cardEmptyIcon = document.getElementById("card-empty-icon");
const cardEmptyHeading = document.getElementById("card-empty-heading");
const cardEmptyDescription = document.getElementById("card-empty-description");
const clearCardSearchButton = document.getElementById("clear-card-search");
const cardSearchInput = document.getElementById("card-search");
const cardMatchCount = document.getElementById("card-match-count");
const cardBrowserView = document.getElementById("card-browser-view");
const studyView = document.getElementById("study-view");
const deckSidebar = document.querySelector("aside");
const deckDialog = document.getElementById("deck-dialog");
const deckDialogHeading = document.getElementById("deck-dialog-heading");
const deckForm = document.getElementById("deck-form");
const deckNameInput = document.getElementById("deck-name");
const cancelDeckButton = document.getElementById("cancel-deck");
const createCardButton = document.getElementById("create-card");
const cardList = document.getElementById("card-list");
const cardDialog = document.getElementById("card-dialog");
const cardDialogHeading = document.getElementById("card-dialog-heading");
const cardForm = document.getElementById("card-form");
const cardFrontInput = document.getElementById("card-front");
const cardBackInput = document.getElementById("card-back");
const cancelCardButton = document.getElementById("cancel-card");
const startStudyButton = document.getElementById("start-study");
const exitStudyButton = document.getElementById("exit-study");
const studyHeading = document.getElementById("study-heading");
const studyCounter = document.getElementById("study-counter");
const studyFront = document.getElementById("study-front");
const studyFrontLabel = document.getElementById("study-front-label");
const studyBack = document.getElementById("study-back");
const studyBackLabel = document.getElementById("study-back-label");
const studyPreviousButton = document.getElementById("study-previous");
const studyFlipButton = document.getElementById("study-flip");
const studyNextButton = document.getElementById("study-next");

function persistState() {
  saveState({
    decks,
    nextDeckId,
    nextCardId,
    activeDeckId
  });
}

function resetCardSearch() {
  if (cardSearchTimeout !== null) {
    window.clearTimeout(cardSearchTimeout);
    cardSearchTimeout = null;
  }
  cardSearchQuery = "";
  cardSearchInput.value = "";
}

function getMatchingCards(deck) {
  const query = cardSearchQuery.toLocaleLowerCase();
  return deck.cards.filter((card) => (
    `${card.front}\n${card.back}`.toLocaleLowerCase().includes(query)
  ));
}

function renderCards(focusTarget = null) {
  cardList.replaceChildren();

  const activeDeck = decks.find((deck) => deck.id === activeDeckId);
  createCardButton.disabled = !activeDeck;
  startStudyButton.disabled = !activeDeck || activeDeck.cards.length === 0;
  cardSearchInput.disabled = !activeDeck || activeDeck.cards.length === 0;

  if (!activeDeck) {
    cardMatchCount.textContent = "0 matches";
    cardEmptyState.hidden = false;
    cardEmptyIcon.textContent = "▱";
    cardEmptyHeading.textContent = "Choose a deck";
    cardEmptyDescription.textContent = "Create or select a deck in the sidebar to view its cards.";
    clearCardSearchButton.hidden = true;
    return;
  }

  const matchingCards = getMatchingCards(activeDeck);
  cardMatchCount.textContent = `${matchingCards.length} ${
    matchingCards.length === 1 ? "match" : "matches"
  }`;
  cardEmptyState.hidden = matchingCards.length > 0;
  clearCardSearchButton.hidden = matchingCards.length > 0 || !cardSearchQuery;

  if (activeDeck.cards.length === 0) {
    cardEmptyIcon.textContent = "＋";
    cardEmptyHeading.textContent = "No cards yet";
    cardEmptyDescription.textContent = "Use New card above to add your first question and answer.";
  } else if (matchingCards.length === 0) {
    cardEmptyIcon.textContent = "⌕";
    cardEmptyHeading.textContent = "No matching cards";
    cardEmptyDescription.textContent = `No cards match "${cardSearchInput.value.trim()}". Try another search or clear it.`;
  }

  matchingCards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "card";
    article.dataset.cardId = String(card.id);

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.setAttribute("aria-hidden", "false");
    const frontHeading = document.createElement("h3");
    frontHeading.textContent = "Question";
    const frontText = document.createElement("p");
    frontText.textContent = card.front;
    front.append(frontHeading, frontText);

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.setAttribute("aria-hidden", "true");
    const backHeading = document.createElement("h3");
    backHeading.textContent = "Answer";
    const backText = document.createElement("p");
    backText.textContent = card.back;
    back.append(backHeading, backText);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const flipButton = document.createElement("button");
    flipButton.type = "button";
    flipButton.dataset.cardAction = "flip";
    flipButton.dataset.cardId = String(card.id);
    flipButton.setAttribute("aria-pressed", "false");
    flipButton.setAttribute("aria-label", `Show answer for ${card.front}`);
    flipButton.textContent = "Show answer";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.cardAction = "edit";
    editButton.dataset.cardId = String(card.id);
    editButton.setAttribute("aria-label", `Edit card: ${card.front}`);
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.cardAction = "delete";
    deleteButton.dataset.cardId = String(card.id);
    deleteButton.setAttribute("aria-label", `Delete card: ${card.front}`);
    deleteButton.textContent = "Delete";

    inner.append(front, back);
    actions.append(flipButton, editButton, deleteButton);
    article.append(inner, actions);
    cardList.append(article);
  });

  if (focusTarget) {
    const button = cardList.querySelector(
      `[data-card-action="${focusTarget.action}"][data-card-id="${focusTarget.id}"]`
    );
    if (button) button.focus();
  }
}

function renderDecks(focusTarget = null) {
  deckList.replaceChildren();

  decks.forEach((deck) => {
    const item = document.createElement("li");
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.dataset.action = "select";
    selectButton.dataset.deckId = String(deck.id);
    selectButton.setAttribute("aria-pressed", String(deck.id === activeDeckId));
    selectButton.textContent = deck.name;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.deckId = String(deck.id);
    editButton.setAttribute("aria-label", `Rename ${deck.name}`);
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.deckId = String(deck.id);
    deleteButton.setAttribute("aria-label", `Delete ${deck.name}`);
    deleteButton.textContent = "Delete";

    item.append(selectButton, editButton, deleteButton);
    deckList.append(item);
  });

  const activeDeck = decks.find((deck) => deck.id === activeDeckId);
  deckNavigation.hidden = decks.length === 0;
  deckEmptyState.hidden = decks.length > 0;
  activeDeckName.textContent = activeDeck ? activeDeck.name : "No deck selected";
  renderCards();

  if (focusTarget) {
    const button = deckList.querySelector(
      `[data-action="${focusTarget.action}"][data-deck-id="${focusTarget.id}"]`
    );
    if (button) button.focus();
  }
}

function renderStudyCard() {
  const deck = decks.find((item) => item.id === studySession.deckId);
  const card = deck.cards[studySession.index];

  studySession.isFlipped = false;
  studyFront.textContent = card.front;
  studyBack.textContent = card.back;
  studyFront.hidden = false;
  studyFrontLabel.hidden = false;
  studyBack.hidden = true;
  studyBackLabel.hidden = true;
  studyFlipButton.setAttribute("aria-pressed", "false");
  studyFlipButton.textContent = "Show answer";
  studyCounter.textContent = `${studySession.index + 1} of ${deck.cards.length}`;
  studyPreviousButton.disabled = studySession.index === 0;
  studyNextButton.disabled = studySession.index === deck.cards.length - 1;
}

function flipStudyCard() {
  studySession.isFlipped = !studySession.isFlipped;
  studyFront.hidden = studySession.isFlipped;
  studyFrontLabel.hidden = studySession.isFlipped;
  studyBack.hidden = !studySession.isFlipped;
  studyBackLabel.hidden = !studySession.isFlipped;
  studyFlipButton.setAttribute("aria-pressed", String(studySession.isFlipped));
  studyFlipButton.textContent = studySession.isFlipped ? "Show question" : "Show answer";
}

function moveStudyIndex(amount) {
  const deck = decks.find((item) => item.id === studySession.deckId);
  const nextIndex = studySession.index + amount;
  if (nextIndex < 0 || nextIndex >= deck.cards.length) return;

  studySession.index = nextIndex;
  renderStudyCard();
}

function exitStudyMode() {
  if (!studySession) return;

  document.removeEventListener("keydown", studySession.keyHandler);
  const returnFocus = studySession.returnFocus;
  studySession = null;
  cardBrowserView.hidden = false;
  studyView.hidden = true;
  deckSidebar.hidden = false;

  if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
    returnFocus.focus();
  }
}

function enterStudyMode(deckId) {
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) {
    throw new Error(`Cannot study unknown deck: ${deckId}`);
  }
  if (deck.cards.length === 0) {
    throw new Error(`Cannot study empty deck: ${deck.name}`);
  }

  if (studySession) exitStudyMode();

  const returnFocus = document.activeElement instanceof HTMLElement
    && document.activeElement !== document.body
    ? document.activeElement
    : startStudyButton;
  const keyHandler = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      exitStudyMode();
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveStudyIndex(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveStudyIndex(1);
    } else if (event.code === "Space" || event.key === " ") {
      if (event.target instanceof HTMLElement && event.target.closest("button")) return;
      event.preventDefault();
      flipStudyCard();
    }
  };

  studySession = {
    deckId,
    index: 0,
    isFlipped: false,
    keyHandler,
    returnFocus
  };
  cardBrowserView.hidden = true;
  studyView.hidden = false;
  deckSidebar.hidden = true;
  renderStudyCard();
  document.addEventListener("keydown", keyHandler);
  studyHeading.focus();
}

function openDeckDialog(deck, opener) {
  editingDeckId = deck ? deck.id : null;
  modalOpener = opener;
  deckDialogHeading.textContent = deck ? "Rename deck" : "Create deck";
  deckNameInput.value = deck ? deck.name : "";
  deckNameInput.setCustomValidity("");
  deckDialog.showModal();
  deckNameInput.focus();
}

createDeckButton.addEventListener("click", () => {
  openDeckDialog(null, createDeckButton);
});

cardSearchInput.addEventListener("input", () => {
  if (cardSearchTimeout !== null) {
    window.clearTimeout(cardSearchTimeout);
  }

  cardSearchTimeout = window.setTimeout(() => {
    cardSearchTimeout = null;
    cardSearchQuery = cardSearchInput.value.trim();
    renderCards();
  }, 300);
});

deckList.addEventListener("click", (event) => {
  const button = event.target instanceof Element
    ? event.target.closest("button[data-action]")
    : null;
  if (!button) return;

  const deckId = Number(button.dataset.deckId);
  const deckIndex = decks.findIndex((deck) => deck.id === deckId);
  if (deckIndex < 0) return;

  const action = button.dataset.action;
  if (action === "select") {
    activeDeckId = deckId;
    resetCardSearch();
    renderDecks({ action: "select", id: deckId });
    persistState();
  } else if (action === "edit") {
    openDeckDialog(decks[deckIndex], button);
  } else if (action === "delete") {
    decks.splice(deckIndex, 1);
    if (activeDeckId === deckId) {
      activeDeckId = decks.length
        ? decks[Math.min(deckIndex, decks.length - 1)].id
        : null;
      resetCardSearch();
    }

    const nextDeck = decks.find((deck) => deck.id === activeDeckId);
    renderDecks(nextDeck ? { action: "select", id: nextDeck.id } : null);
    if (!nextDeck) createDeckButton.focus();
    persistState();
  }
});

deckForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = deckNameInput.value.trim();

  if (!name) {
    deckNameInput.setCustomValidity("Enter a deck name.");
    deckNameInput.reportValidity();
    return;
  }
  deckNameInput.setCustomValidity("");

  if (editingDeckId === null) {
    const deck = { id: nextDeckId++, name, cards: [] };
    decks.push(deck);
    activeDeckId = deck.id;
  } else {
    const deck = decks.find((item) => item.id === editingDeckId);
    if (!deck) {
      throw new Error("The deck being edited no longer exists.");
    }
    deck.name = name;
    activeDeckId = deck.id;
  }

  resetCardSearch();
  const focusAction = editingDeckId === null ? "select" : "edit";
  const savedDeckId = activeDeckId;
  renderDecks();
  deckDialog.close();
  window.setTimeout(() => {
    const button = deckList.querySelector(
      `[data-action="${focusAction}"][data-deck-id="${savedDeckId}"]`
    );
    if (button) button.focus();
  }, 0);
  persistState();
});

cancelDeckButton.addEventListener("click", () => {
  deckDialog.close();
});

deckDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    deckDialog.close();
  }
});

deckDialog.addEventListener("close", () => {
  editingDeckId = null;
  if (modalOpener instanceof HTMLElement && modalOpener.isConnected) {
    modalOpener.focus();
  } else {
    createDeckButton.focus();
  }
  modalOpener = null;
});

function openCardDialog(card, opener) {
  const activeDeck = decks.find((deck) => deck.id === activeDeckId);
  if (!activeDeck) return;

  editingCardId = card ? card.id : null;
  editingCardDeckId = activeDeck.id;
  cardModalOpener = opener;
  cardDialogHeading.textContent = card ? "Edit card" : "Add card";
  cardFrontInput.value = card ? card.front : "";
  cardBackInput.value = card ? card.back : "";
  cardFrontInput.setCustomValidity("");
  cardBackInput.setCustomValidity("");
  cardDialog.showModal();
  cardFrontInput.focus();
}

createCardButton.addEventListener("click", () => {
  openCardDialog(null, createCardButton);
});

cardList.addEventListener("click", (event) => {
  const button = event.target instanceof Element
    ? event.target.closest("button[data-card-action]")
    : null;
  if (!button) return;

  const cardId = Number(button.dataset.cardId);
  const deck = decks.find((item) => item.id === activeDeckId);
  const cardIndex = deck ? deck.cards.findIndex((card) => card.id === cardId) : -1;
  if (!deck || cardIndex < 0) return;

  const action = button.dataset.cardAction;
  if (action === "flip") {
    const article = button.closest(".card");
    const flipped = article.classList.toggle("is-flipped");
    button.setAttribute("aria-pressed", String(flipped));
    button.setAttribute("aria-label", `${flipped ? "Show question" : "Show answer"} for ${
      deck.cards[cardIndex].front
    }`);
    button.textContent = flipped ? "Show question" : "Show answer";
    article.querySelector(".card-front").setAttribute("aria-hidden", String(flipped));
    article.querySelector(".card-back").setAttribute("aria-hidden", String(!flipped));
  } else if (action === "edit") {
    openCardDialog(deck.cards[cardIndex], button);
  } else if (action === "delete") {
    const visibleIndex = getMatchingCards(deck).findIndex((card) => card.id === cardId);
    deck.cards.splice(cardIndex, 1);
    const remainingMatches = getMatchingCards(deck);
    const nextCard = remainingMatches[Math.min(visibleIndex, remainingMatches.length - 1)];
    renderCards(nextCard ? { action: "flip", id: nextCard.id } : null);
    if (!nextCard) {
      if (cardSearchQuery) cardSearchInput.focus();
      else createCardButton.focus();
    }
    persistState();
  }
});

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const front = cardFrontInput.value.trim();
  const back = cardBackInput.value.trim();

  cardFrontInput.setCustomValidity(front ? "" : "Enter the front of the card.");
  cardBackInput.setCustomValidity(back ? "" : "Enter the back of the card.");
  if (!front || !back) {
    cardForm.reportValidity();
    return;
  }

  const deck = decks.find((item) => item.id === editingCardDeckId);
  if (!deck) {
    throw new Error("The deck for this card no longer exists.");
  }

  let card;
  if (editingCardId === null) {
    card = { id: nextCardId++, front, back };
    deck.cards.push(card);
  } else {
    card = deck.cards.find((item) => item.id === editingCardId);
    if (!card) {
      throw new Error("The card being edited no longer exists.");
    }
    card.front = front;
    card.back = back;
  }

  const focusAction = editingCardId === null ? "flip" : "edit";
  resetCardSearch();
  renderCards();
  cardDialog.close();
  window.setTimeout(() => {
    const button = cardList.querySelector(
      `[data-card-action="${focusAction}"][data-card-id="${card.id}"]`
    );
    if (button) button.focus();
  }, 0);
  persistState();
});

cancelCardButton.addEventListener("click", () => {
  cardDialog.close();
});

cardDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    cardDialog.close();
  }
});

cardDialog.addEventListener("close", () => {
  editingCardId = null;
  editingCardDeckId = null;
  if (cardModalOpener instanceof HTMLElement && cardModalOpener.isConnected) {
    cardModalOpener.focus();
  } else {
    createCardButton.focus();
  }
  cardModalOpener = null;
});

startStudyButton.addEventListener("click", () => {
  enterStudyMode(activeDeckId);
});

exitStudyButton.addEventListener("click", exitStudyMode);
studyFlipButton.addEventListener("click", flipStudyCard);
studyPreviousButton.addEventListener("click", () => moveStudyIndex(-1));
studyNextButton.addEventListener("click", () => moveStudyIndex(1));

clearCardSearchButton.addEventListener("click", () => {
  resetCardSearch();
  renderCards();
  cardSearchInput.focus();
});

renderDecks();