const isNode = typeof module !== 'undefined' && module.exports;
const storeContainer = isNode ? require('../store/store.js') : window;
const store = storeContainer.store;
const getActiveRanks = storeContainer.getActiveRanks;
const getActiveColumns = storeContainer.getActiveColumns;

function updateStatus() {
    const scoreElem = document.getElementById('score');
    if (scoreElem) scoreElem.innerText = store.state.score;
}

function updateProgressBar() {
    const count = store.state.completedSuits.length;
    const percentage = (count / 8) * 100;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('completed-count');
    if (bar) bar.style.width = `${percentage}%`;
    if (text) text.innerText = count;
}

function saveState() {
    store.saveSnapshot();
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.disabled = false;
}

function undoMove() {
    if (store.state.history.length === 0 || store.state.isDealing) return;
    const last = store.state.history.pop();
    store.restoreSnapshot(last);
    if (store.state.history.length === 0) {
        const btn = document.getElementById('undo-btn');
        if (btn) btn.disabled = true;
    }
    updateStatus();
    updateProgressBar();
    render();
}

function startTimer() {
    if (store.state.timerInterval) clearInterval(store.state.timerInterval);
    store.state.timerInterval = setInterval(() => {
        store.state.seconds++;
        const mins = Math.floor(store.state.seconds / 60).toString().padStart(2, '0');
        const secs = (store.state.seconds % 60).toString().padStart(2, '0');
        const timerElem = document.getElementById('timer');
        if (timerElem) timerElem.innerText = `${mins}:${secs}`;
    }, 1000);
}

function render(empty = false) {
    const columns = store.state.columns;
    for (let i = 0; i < columns.length; i++) {
        const colDiv = document.getElementById(`col-${i}`);
        if (!colDiv) continue;
        colDiv.innerHTML = '';
        if (empty) continue;

        let currentTop = 0;
        const colLength = columns[i].length;
        let faceUpGap = 35;
        let faceDownGap = 12;

        if (colLength > 15) {
            faceUpGap = 20;
            faceDownGap = 8;
        }

        columns[i].forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            const isRed = card.suit === '♥' || card.suit === '♦';
            cardDiv.className = `card ${card.faceUp ? '' : 'face-down'} ${isRed ? 'red' : 'black'}`;
            cardDiv.style.top = `${currentTop}px`;
            currentTop += card.faceUp ? faceUpGap : faceDownGap;

            if (card.faceUp) {
                cardDiv.draggable = isMovableSequence(i, idx);
                cardDiv.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
                cardDiv.ondragstart = (event) => drag(event, i, idx);
                cardDiv.onclick = (event) => { event.stopPropagation(); autoMove(i, idx); };
            }
            colDiv.appendChild(cardDiv);
        });
    }

    const deckCountElem = document.getElementById('deck-count');
    if (deckCountElem) deckCountElem.innerText = Math.ceil(store.state.deck.length / 10);
    checkSequences();
}

function initGame() {
    if (store.state.isDealing) return;
    hideNewGameOptions();
    if (store.state.timerInterval) clearInterval(store.state.timerInterval);

    store.reset();

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.disabled = true;

    const timerElem = document.getElementById('timer');
    if (timerElem) timerElem.innerText = '00:00';

    updateStatus();
    updateProgressBar();

    const msg = document.getElementById('message');
    if (msg) msg.style.display = 'none';

    const suitCountInput = document.getElementById('suit-count');
    const suitCount = suitCountInput ? parseInt(suitCountInput.value, 10) : 2;
    const selectedSuits = suitCount === 1 ? ['♠'] : (suitCount === 2 ? ['♠', '♥'] : ['♠', '♥', '♣', '♦']);

    const totalSuitsNeeded = 8;
    const copiesPerSuit = totalSuitsNeeded / selectedSuits.length;

    const deck = [];
    for (let s = 0; s < copiesPerSuit; s++) {
        selectedSuits.forEach((suit) => {
            store.state.ranks.forEach((rank) => {
                deck.push({ rank, suit, faceUp: false });
            });
        });
    }

    deck.sort(() => Math.random() - 0.5);
    store.state.deck = deck;
    store.state.columns = Array.from({ length: 10 }, () => []);

    render(true);
    store.state.isDealing = true;

    const dealCards = async () => {
        for (let i = 0; i < 54; i++) {
            const card = store.state.deck.pop();
            store.state.columns[i % 10].push(card);
            if (i >= 44) card.faceUp = true;
            render();
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        store.state.isDealing = false;
        startTimer();
    };

    dealCards();
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

function checkSequences() {
    const columns = store.state.columns;
    columns.forEach((col, idx) => {
        if (col.length < 13) return;
        const last13 = col.slice(-13);
        if (last13.every((c) => c.faceUp) && isComplete(last13)) {
            store.state.columns[idx].splice(-13);
            store.state.completedSuits.push(last13[0].suit);
            if (store.state.columns[idx].length > 0) {
                store.state.columns[idx][store.state.columns[idx].length - 1].faceUp = true;
            }
            store.state.score += 100;
            updateStatus();
            updateProgressBar();
            render();

            if (store.state.completedSuits.length === 8) {
                if (store.state.timerInterval) clearInterval(store.state.timerInterval);
                playVictorySound();
                const msgDiv = document.getElementById('message');
                if (msgDiv) msgDiv.style.display = 'block';
            }
        }
    });
}

function isComplete(cards) {
    if (!Array.isArray(cards) || cards.length !== 13) return false;
    const activeRanks = getActiveRanks();
    const suit = cards[0].suit;
    for (let i = 0; i < 13; i++) {
        if (cards[i].suit !== suit || activeRanks.indexOf(cards[i].rank) !== (12 - i)) {
            return false;
        }
    }
    return true;
}

function autoMove(from, idx) {
    if (!isMovableSequence(from, idx)) return;
    for (let to = 0; to < store.state.columns.length; to++) {
        if (to !== from && canDrop(store.state.columns[from][idx], store.state.columns[to])) {
            moveCards(from, idx, to);
            return;
        }
    }
}

function drop(event) {
    event.preventDefault();
    const from = parseInt(event.dataTransfer.getData('from'), 10);
    const idx = parseInt(event.dataTransfer.getData('index'), 10);
    if (Number.isNaN(from) || Number.isNaN(idx)) return;

    const targetCol = event.target.closest('.column');
    if (!targetCol) return;

    const to = parseInt(targetCol.id.split('-')[1], 10);
    if (!Number.isNaN(to) && from !== to && canDrop(store.state.columns[from][idx], store.state.columns[to])) {
        moveCards(from, idx, to);
    } else {
        playErrorSound();
    }
}

function moveCards(from, idx, to) {
    saveState();
    const cardsToMove = store.state.columns[from].splice(idx);
    store.state.columns[to] = store.state.columns[to].concat(cardsToMove);
    if (store.state.columns[from].length > 0) {
        store.state.columns[from][store.state.columns[from].length - 1].faceUp = true;
    }
    store.state.score--;
    updateStatus();
    render();
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

async function drawFromDeck() {
    if (store.state.deck.length === 0 || store.state.isDealing || store.state.columns.some((c) => c.length === 0)) {
        playErrorSound();
        return;
    }
    saveState();
    store.state.isDealing = true;
    for (let i = 0; i < 10; i++) {
        const card = store.state.deck.pop();
        card.faceUp = true;
        store.state.columns[i].push(card);
        render();
        await new Promise((resolve) => setTimeout(resolve, 40));
    }
    store.state.isDealing = false;
}

function getHint() {
    for (let from = 0; from < store.state.columns.length; from++) {
        const column = store.state.columns[from];
        for (let idx = 0; idx < column.length; idx++) {
            if (!isMovableSequence(from, idx)) continue;
            for (let to = 0; to < store.state.columns.length; to++) {
                if (from !== to && canDrop(column[idx], store.state.columns[to])) {
                    console.info(`Dica: mova ${column[idx].rank}${column[idx].suit} da coluna ${from + 1} para a coluna ${to + 1}.`);
                    return;
                }
            }
        }
    }
    playErrorSound();
}

if (isNode) {
    module.exports = {
        canDrop,
        isMovableSequence,
        isComplete,
        getHint,
        initGame,
        drawFromDeck,
        moveCards,
        saveState,
        undoMove,
        updateStatus
    };
}
