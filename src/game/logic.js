const isNode = typeof module !== 'undefined' && module.exports;
const config = isNode ? require('../config.js') : window.appConfig;
const storeContainer = isNode ? require('../store/store.js') : window;
const store = storeContainer.store;
const getActiveRanks = storeContainer.getActiveRanks;
const getActiveColumns = storeContainer.getActiveColumns;

function createDeck(selectedSuits) {
    const deck = [];
    const copiesPerSuit = config.totalSuitsNeeded / selectedSuits.length;

    for (let s = 0; s < copiesPerSuit; s++) {
        selectedSuits.forEach((suit) => {
            config.ranks.forEach((rank) => {
                deck.push({ rank, suit, faceUp: false });
            });
        });
    }

    return deck.sort(() => Math.random() - 0.5);
}

function initializeGameState(selectedSuits) {
    store.reset();
    store.state.deck = createDeck(selectedSuits);
    store.state.columns = Array.from({ length: config.dealColumns }, () => []);
    store.notify();
}

function saveState() {
    store.saveSnapshot();
}

function undoMove() {
    if (store.state.history.length === 0 || store.state.isDealing) return false;

    const last = store.state.history.pop();
    store.restoreSnapshot(last);
    return store.state.history.length > 0;
}

function isMovableSequence(colIdx, cardIdx) {
    const activeRanks = getActiveRanks();
    const columns = getActiveColumns();
    const col = columns[colIdx] || [];

    if (col.length === 0 || cardIdx >= col.length) return false;

    for (let i = cardIdx; i < col.length - 1; i++) {
        const cur = col[i];
        const next = col[i + 1];

        if (!cur.faceUp || !next.faceUp) return false;
        if (cur.suit !== next.suit) return false;

        const curRankIdx = activeRanks.indexOf(cur.rank);
        const nextRankIdx = activeRanks.indexOf(next.rank);
        if (nextRankIdx !== curRankIdx - 1) return false;
    }

    return true;
}

function canDrop(card, target) {
    const activeRanks = getActiveRanks();
    if (!target || target.length === 0) return true;

    const lastCard = target[target.length - 1];
    const isFaceUp = lastCard.faceUp !== undefined ? lastCard.faceUp : true;
    if (!isFaceUp) return false;

    const movingRankIdx = activeRanks.indexOf(card.rank);
    const targetRankIdx = activeRanks.indexOf(lastCard.rank);
    return movingRankIdx === targetRankIdx - 1;
}

function isComplete(cards) {
    if (!Array.isArray(cards) || cards.length !== config.ranks.length) return false;

    const activeRanks = getActiveRanks();
    const suit = cards[0].suit;

    for (let i = 0; i < cards.length; i++) {
        if (cards[i].suit !== suit || activeRanks.indexOf(cards[i].rank) !== (activeRanks.length - 1 - i)) {
            return false;
        }
    }
    return true;
}

function resolveSequences() {
    const columns = store.state.columns;
    let completed = false;

    columns.forEach((col, idx) => {
        if (col.length < config.ranks.length) return;

        const lastSet = col.slice(-config.ranks.length);
        if (lastSet.every((c) => c.faceUp) && isComplete(lastSet)) {
            store.state.columns[idx].splice(-config.ranks.length);
            store.state.completedSuits.push(lastSet[0].suit);
            if (store.state.columns[idx].length > 0) {
                store.state.columns[idx][store.state.columns[idx].length - 1].faceUp = true;
            }
            store.state.score += 100;
            completed = true;
        }
    });

    return completed;
}

function moveCards(from, idx, to) {
    saveState();
    const cardsToMove = store.state.columns[from].splice(idx);
    store.state.columns[to] = store.state.columns[to].concat(cardsToMove);
    if (store.state.columns[from].length > 0) {
        store.state.columns[from][store.state.columns[from].length - 1].faceUp = true;
    }
    store.state.score--;
    const completed = resolveSequences();
    store.notify();
    return { victory: store.state.completedSuits.length === config.totalSuitsNeeded, completed };
}

async function drawFromDeck() {
    if (store.state.deck.length === 0 || store.state.isDealing || store.state.columns.some((c) => c.length === 0)) {
        return false;
    }

    saveState();
    store.state.isDealing = true;
    for (let i = 0; i < config.drawCount; i++) {
        const card = store.state.deck.pop();
        card.faceUp = true;
        store.state.columns[i].push(card);
        store.notify();
        await new Promise((resolve) => setTimeout(resolve, 40));
    }
    store.state.isDealing = false;
    const completed = resolveSequences();
    store.notify();
    return { success: true, victory: store.state.completedSuits.length === config.totalSuitsNeeded, completed };
}

function getHint() {
    for (let from = 0; from < store.state.columns.length; from++) {
        const column = store.state.columns[from];
        for (let idx = 0; idx < column.length; idx++) {
            if (!isMovableSequence(from, idx)) continue;
            for (let to = 0; to < store.state.columns.length; to++) {
                if (from !== to && canDrop(column[idx], store.state.columns[to])) {
                    return { from, idx, to, card: column[idx] };
                }
            }
        }
    }
    return null;
}

if (isNode) {
    module.exports = {
        createDeck,
        initializeGameState,
        saveState,
        undoMove,
        isMovableSequence,
        canDrop,
        isComplete,
        moveCards,
        drawFromDeck,
        getHint,
        resolveSequences
    };
}
