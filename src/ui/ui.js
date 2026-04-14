/* global isMovableSequence, autoMove, initializeGameState, undoMove, drawFromDeck, canDrop, moveCards, getHint */

const isNode = typeof module !== 'undefined' && module.exports;
const storeContainer = isNode ? require('../store/store.js') : window;
const config = isNode ? require('../config.js') : window.appConfig;
const audioService = isNode ? require('../services/audioService.js') : window.audioService;

const store = storeContainer.store;
let timerInterval = null;

function showNewGameOptions() {
    const opt = document.getElementById('new-game-options');
    if (opt) opt.style.display = 'flex';
}

function hideNewGameOptions() {
    const opt = document.getElementById('new-game-options');
    if (opt) opt.style.display = 'none';
}

function toggleMusicModal() {
    const modal = document.getElementById('music-modal');
    if (!modal) return;
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function closeMusicModal(event) {
    if (event.target.id === 'music-modal') toggleMusicModal();
}

function setUndoButton(enabled) {
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.disabled = !enabled;
}

function updateTimerDisplay(seconds) {
    const timerElem = document.getElementById('timer');
    if (timerElem) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerElem.innerText = `${mins}:${secs}`;
    }
}

function showVictoryMessage() {
    const msgDiv = document.getElementById('message');
    if (msgDiv) msgDiv.style.display = 'block';
}

function hideVictoryMessage() {
    const msgDiv = document.getElementById('message');
    if (msgDiv) msgDiv.style.display = 'none';
}

function renderState(empty = false) {
    const state = store.state;
    for (let i = 0; i < config.dealColumns; i++) {
        const colDiv = document.getElementById(`col-${i}`);
        if (!colDiv) continue;
        colDiv.innerHTML = '';
        if (empty) continue;

        let currentTop = 0;
        const cards = state.columns[i] || [];
        const gapConfig = cards.length > 15 ? config.gaps.crowded : config.gaps.default;

        cards.forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            const isRed = card.suit === '♥' || card.suit === '♦';
            cardDiv.className = `card ${card.faceUp ? '' : 'face-down'} ${isRed ? 'red' : 'black'}`;
            cardDiv.style.top = `${currentTop}px`;
            currentTop += card.faceUp ? gapConfig.faceUp : gapConfig.faceDown;

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
    if (deckCountElem) deckCountElem.innerText = Math.ceil(state.deck.length / config.dealColumns);

    const scoreElem = document.getElementById('score');
    if (scoreElem) scoreElem.innerText = state.score;

    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('completed-count');
    if (bar) bar.style.width = `${(state.completedSuits.length / config.totalSuitsNeeded) * 100}%`;
    if (text) text.innerText = state.completedSuits.length;

    setUndoButton(state.history.length > 0);

    if (state.completedSuits.length === config.totalSuitsNeeded) {
        showVictoryMessage();
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        store.state.seconds++;
        updateTimerDisplay(store.state.seconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function initGame() {
    if (store.state.isDealing) return;
    hideNewGameOptions();
    stopTimer();

    const suitCountInput = document.getElementById('suit-count');
    const suitCount = suitCountInput ? parseInt(suitCountInput.value, 10) : 2;
    const selectedSuits = suitCount === 1 ? ['♠'] : (suitCount === 2 ? ['♠', '♥'] : ['♠', '♥', '♣', '♦']);

    initializeGameState(selectedSuits);
    store.state.seconds = 0;
    updateTimerDisplay(0);
    hideVictoryMessage();
    setUndoButton(false);

    renderState(true);
    store.state.isDealing = true;

    const dealCards = async () => {
        for (let i = 0; i < config.initialDealCount; i++) {
            const card = store.state.deck.pop();
            store.state.columns[i % config.dealColumns].push(card);
            if (i >= config.initialDealCount - config.dealColumns) {
                card.faceUp = true;
            }
            store.notify();
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        store.state.isDealing = false;
        startTimer();
    };

    dealCards();
}

function undoMoveUI() {
    const hasHistory = undoMove();
    setUndoButton(hasHistory);
}

async function drawFromDeckUI() {
    const result = await drawFromDeck();
    if (!result || !result.success) {
        audioService.playErrorSound();
        return;
    }
    if (result.victory) {
        audioService.playVictorySound();
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
        const result = moveCards(from, idx, to);
        if (result.victory) {
            audioService.playVictorySound();
        }
    } else {
        audioService.playErrorSound();
    }
}

function getHintUI() {
    const hint = getHint();
    if (!hint) {
        audioService.playErrorSound();
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event, colIndex, cardIndex) {
    event.dataTransfer.setData('from', colIndex.toString());
    event.dataTransfer.setData('index', cardIndex.toString());
}

if (!isNode) {
    store.subscribe(() => renderState());
    window.showNewGameOptions = showNewGameOptions;
    window.hideNewGameOptions = hideNewGameOptions;
    window.toggleMusicModal = toggleMusicModal;
    window.closeMusicModal = closeMusicModal;
    window.allowDrop = allowDrop;
    window.drag = drag;
    window.drop = drop;
    window.initGame = initGame;
    window.undoMove = undoMoveUI;
    window.drawFromDeck = drawFromDeckUI;
    window.getHint = getHintUI;
}

if (isNode) {
    module.exports = {
        showNewGameOptions,
        hideNewGameOptions,
        toggleMusicModal,
        closeMusicModal,
        allowDrop,
        drag,
        initGame,
        undoMove: undoMoveUI,
        drawFromDeck: drawFromDeckUI,
        renderState
    };
}
