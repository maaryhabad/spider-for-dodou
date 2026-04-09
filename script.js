const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let deck = [];
let columns = [[],[],[],[],[],[],[],[],[],[]];
let score = 500;
let seconds = 0;
let timerInterval = null;
let audioCtx = null;
let isDealing = false;
let history = [];
let completedSuits = [];

// Exportação para testes (Node.js/Jest)
if (typeof module !== 'undefined') {
    module.exports = { 
        canDrop, 
        isMovableSequence, 
        isComplete, 
        calculateScore: () => score,
        ranks // Exportando explicitamente para o ambiente de teste
    };
}

function showNewGameOptions() {
    const opt = document.getElementById('new-game-options');
    opt.style.display = 'flex';
}

function hideNewGameOptions() {
    const opt = document.getElementById('new-game-options');
    opt.style.display = 'none';
}

function toggleMusicModal() {
    const modal = document.getElementById('music-modal');
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

function closeMusicModal(event) {
    if (event.target.id === 'music-modal') toggleMusicModal();
}

// Funções de Áudio
function playErrorSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
}

function playVictorySound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.15));
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime + (i * 0.15));
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i * 0.15) + 0.5);
            osc.start(audioCtx.currentTime + (i * 0.15));
            osc.stop(audioCtx.currentTime + (i * 0.15) + 0.5);
        });
    } catch(e) {}
}

// Histórico e Undo
function saveState() {
    history.push({ 
        deck: JSON.parse(JSON.stringify(deck)), 
        columns: JSON.parse(JSON.stringify(columns)), 
        score: score,
        completedSuits: JSON.parse(JSON.stringify(completedSuits))
    });
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.disabled = false;
}

function undoMove() {
    if (history.length === 0 || isDealing) return;
    const last = history.pop();
    deck = last.deck; 
    columns = last.columns; 
    score = last.score; 
    completedSuits = last.completedSuits;
    if (history.length === 0) {
        const btn = document.getElementById('undo-btn');
        if (btn) btn.disabled = true;
    }
    updateStatus(); 
    updateProgressBar();
    render(); 
}

// Inicialização
async function initGame() {
    if (isDealing) return;
    hideNewGameOptions();
    if (timerInterval) clearInterval(timerInterval);
    
    seconds = 0; 
    score = 500; 
    history = []; 
    completedSuits = [];
    
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.disabled = true;
    
    const timerElem = document.getElementById('timer');
    if (timerElem) timerElem.innerText = "00:00";
    
    updateStatus(); 
    updateProgressBar();
    
    const msg = document.getElementById('message');
    if (msg) msg.style.display = 'none';

    const suitCountInput = document.getElementById('suit-count');
    const suitCount = suitCountInput ? parseInt(suitCountInput.value) : 2;
    let selectedSuits = suitCount === 1 ? ['♠'] : (suitCount === 2 ? ['♠', '♥'] : ['♠', '♥', '♣', '♦']);
    
    deck = [];
    const totalSuitsNeeded = 8;
    const copiesPerSuit = totalSuitsNeeded / selectedSuits.length;

    for (let s = 0; s < copiesPerSuit; s++) {
        selectedSuits.forEach(suit => {
            ranks.forEach(rank => {
                deck.push({ rank, suit, faceUp: false });
            });
        });
    }
    
    deck.sort(() => Math.random() - 0.5);

    columns = Array.from({length: 10}, () => []);
    
    render(true);
    isDealing = true;
    
    for (let i = 0; i < 54; i++) {
        let card = deck.pop();
        columns[i % 10].push(card);
        if (i >= 44) card.faceUp = true;
        render(); 
        await new Promise(r => setTimeout(r, 10));
    }
    
    isDealing = false; 
    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        const timerElem = document.getElementById('timer');
        if (timerElem) timerElem.innerText = `${mins}:${secs}`;
    }, 1000);
}

function render(empty = false) {
    for (let i = 0; i < 10; i++) {
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
            const isRed = (card.suit === '♥' || card.suit === '♦');
            cardDiv.className = `card ${card.faceUp ? '' : 'face-down'} ${isRed ? 'red' : 'black'}`;
            cardDiv.style.top = currentTop + 'px';
            
            currentTop += card.faceUp ? faceUpGap : faceDownGap; 

            if (card.faceUp) {
                cardDiv.draggable = isMovableSequence(i, idx);
                cardDiv.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
                cardDiv.ondragstart = (e) => drag(e, i, idx);
                cardDiv.onclick = (e) => { e.stopPropagation(); autoMove(i, idx); };
            }
            colDiv.appendChild(cardDiv);
        });
    }
    
    const deckCountElem = document.getElementById('deck-count');
    if (deckCountElem) {
        deckCountElem.innerText = Math.ceil(deck.length / 10);
    }
    
    checkSequences();
}

function updateProgressBar() {
    const count = completedSuits.length;
    const percentage = (count / 8) * 100;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('completed-count');
    if (bar) bar.style.width = percentage + '%';
    if (text) text.innerText = count;
}

/**
 * Verifica se a partir de um índice a sequência é válida para ser movida.
 */
function isMovableSequence(colIdx, cardIdx) {
    const activeRanks = (typeof module !== 'undefined' && module.exports.ranks) ? module.exports.ranks : ranks;
    const activeColumns = (typeof global !== 'undefined' && global.columns) ? global.columns : columns;

    const col = activeColumns[colIdx] || [];
    if (col.length === 0 || cardIdx >= col.length) return false;
    
    for (let i = cardIdx; i < col.length - 1; i++) {
        const cur = col[i];
        const next = col[i+1];
        
        if (!cur.faceUp || !next.faceUp) return false;
        if (cur.suit !== next.suit) return false;
        
        const curRankIdx = activeRanks.indexOf(cur.rank);
        const nextRankIdx = activeRanks.indexOf(next.rank);
        
        if (nextRankIdx !== curRankIdx - 1) return false;
    }
    return true;
}

function checkSequences() {
    columns.forEach((col, idx) => {
        if (col.length < 13) return;
        const last13 = col.slice(-13);
        if (last13.every(c => c.faceUp) && isComplete(last13)) {
            columns[idx].splice(-13);
            completedSuits.push(last13[0].suit);
            if (columns[idx].length > 0) {
                columns[idx][columns[idx].length - 1].faceUp = true;
            }
            score += 100; 
            updateStatus(); 
            updateProgressBar();
            render(); 
            
            if (completedSuits.length === 8) {
                if (timerInterval) clearInterval(timerInterval); 
                playVictorySound();
                const msgDiv = document.getElementById('message');
                if (msgDiv) msgDiv.style.display = 'block';
            }
        }
    });
}

function isComplete(cards) {
    if (cards.length !== 13) return false;
    const activeRanks = (typeof module !== 'undefined' && module.exports.ranks) ? module.exports.ranks : ranks;
    const suit = cards[0].suit;
    for (let i = 0; i < 13; i++) {
        if (cards[i].suit !== suit || activeRanks.indexOf(cards[i].rank) !== (12 - i)) {
            return false;
        }
    }
    return true;
}

function autoMove(f, idx) {
    if (!isMovableSequence(f, idx)) return;
    for (let i = 0; i < 10; i++) {
        if (i !== f && canDrop(columns[f][idx], columns[i])) { 
            moveCards(f, idx, i); 
            return; 
        }
    }
}

function drag(e, c, i) { 
    e.dataTransfer.setData("f", c.toString()); 
    e.dataTransfer.setData("idx", i.toString()); 
}

function allowDrop(e) { e.preventDefault(); }

function drop(e) {
    e.preventDefault();
    const fStr = e.dataTransfer.getData("f");
    const idxStr = e.dataTransfer.getData("idx");
    if (!fStr || !idxStr) return;

    const f = parseInt(fStr);
    const idx = parseInt(idxStr);
    const targetCol = e.target.closest('.column');
    if (!targetCol) return;

    const t = parseInt(targetCol.id.split('-')[1]);
    if (!isNaN(t) && f !== t && canDrop(columns[f][idx], columns[t])) {
        moveCards(f, idx, t);
    } else {
        playErrorSound();
    }
}

function moveCards(f, idx, t) {
    saveState();
    const cardsToMove = columns[f].splice(idx);
    columns[t] = columns[t].concat(cardsToMove);
    if (columns[f].length > 0) {
        columns[f][columns[f].length - 1].faceUp = true;
    }
    score--; 
    updateStatus(); 
    render();
}

/**
 * Valida se uma carta pode ser solta sobre uma coluna alvo.
 */
function canDrop(card, target) {
    const activeRanks = (typeof module !== 'undefined' && module.exports.ranks) ? module.exports.ranks : ranks;
    
    if (target.length === 0) return true;
    
    const lastCard = target[target.length - 1];
    
    // Se faceUp não estiver definido (caso de teste mock), assumimos que está virada para cima
    const isFaceUp = lastCard.faceUp !== undefined ? lastCard.faceUp : true;
    if (!isFaceUp) return false;
    
    const movingRankIdx = activeRanks.indexOf(card.rank);
    const targetRankIdx = activeRanks.indexOf(lastCard.rank);
    
    // Deve ser exatamente um rank abaixo (ex: Q(11) sobre K(12))
    return movingRankIdx === targetRankIdx - 1;
}

async function drawFromDeck() {
    if (deck.length === 0 || isDealing || columns.some(c => c.length === 0)) { 
        playErrorSound(); 
        return; 
    }
    saveState(); 
    isDealing = true;
    for (let i = 0; i < 10; i++) {
        let c = deck.pop(); 
        c.faceUp = true; 
        columns[i].push(c);
        render(); 
        await new Promise(r => setTimeout(r, 40));
    }
    isDealing = false;
}

function updateStatus() { 
    const scoreElem = document.getElementById('score');
    if (scoreElem) scoreElem.innerText = score; 
}

if (typeof window !== 'undefined') {
    window.onload = initGame;
}