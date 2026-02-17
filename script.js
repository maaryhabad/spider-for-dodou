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

function showNewGameOptions() {
    document.getElementById('new-game-options').style.display = 'flex';
    document.getElementById('main-new-btn').style.display = 'none';
}

function hideNewGameOptions() {
    document.getElementById('new-game-options').style.display = 'none';
    document.getElementById('main-new-btn').style.display = 'flex';
}

function toggleMusicModal() {
    const modal = document.getElementById('music-modal');
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

function closeMusicModal(event) {
    if (event.target.id === 'music-modal') toggleMusicModal();
}

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

function saveState() {
    history.push({ 
        deck: JSON.parse(JSON.stringify(deck)), 
        columns: JSON.parse(JSON.stringify(columns)), 
        score: score,
        completedSuits: JSON.parse(JSON.stringify(completedSuits))
    });
    document.getElementById('undo-btn').disabled = false;
}

function undoMove() {
    if (history.length === 0 || isDealing) return;
    const last = history.pop();
    deck = last.deck; 
    columns = last.columns; 
    score = last.score; 
    completedSuits = last.completedSuits;
    if (history.length === 0) document.getElementById('undo-btn').disabled = true;
    updateStatus(); 
    render(); 
    renderFoundations();
}

async function initGame() {
    if (isDealing) return;
    hideNewGameOptions();
    if (timerInterval) clearInterval(timerInterval);
    
    seconds = 0; 
    score = 500; 
    history = []; 
    completedSuits = [];
    
    document.getElementById('undo-btn').disabled = true;
    document.getElementById('timer').innerText = "00:00";
    updateStatus(); 
    document.getElementById('message').style.display = 'none';
    document.getElementById('foundations').innerHTML = '';

    const suitCount = parseInt(document.getElementById('suit-count').value);
    let selectedSuits = suitCount === 1 ? ['♠'] : (suitCount === 2 ? ['♠', '♥'] : ['♠', '♥', '♣', '♦']);
    
    deck = [];
    const iterations = 104 / (selectedSuits.length * 13);
    for (let s = 0; s < iterations; s++) {
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
        await new Promise(r => setTimeout(r, 15));
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
        document.getElementById('timer').innerText = `${mins}:${secs}`;
    }, 1000);
}

function render(empty = false) {
    for (let i = 0; i < 10; i++) {
        const colDiv = document.getElementById(`col-${i}`);
        if (!colDiv) continue;
        colDiv.innerHTML = '';
        if (empty) continue;
        
        let currentTop = 0;
        columns[i].forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            const isRed = (card.suit === '♥' || card.suit === '♦');
            cardDiv.className = `card ${card.faceUp ? '' : 'face-down'} ${isRed ? 'red' : 'black'}`;
            cardDiv.style.top = currentTop + 'px';
            currentTop += card.faceUp ? 35 : 12; 

            if (card.faceUp) {
                cardDiv.draggable = isMovableSequence(i, idx);
                cardDiv.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
                cardDiv.ondragstart = (e) => drag(e, i, idx);
                cardDiv.onclick = (e) => { e.stopPropagation(); autoMove(i, idx); };
            }
            colDiv.appendChild(cardDiv);
        });
    }
    const remainingPiles = Math.ceil(deck.length / 10);
    document.getElementById('deck-count').innerText = remainingPiles;
    document.getElementById('deck-container').style.display = (deck.length > 0) ? 'block' : 'none';
    checkSequences();
}

function renderFoundations() {
    const fDiv = document.getElementById('foundations');
    if (!fDiv) return;
    fDiv.innerHTML = '';
    completedSuits.forEach(() => {
        const pile = document.createElement('div');
        pile.className = 'foundation-pile';
        const card = document.createElement('div');
        card.className = 'foundation-card';
        pile.appendChild(card);
        fDiv.appendChild(pile);
    });
}

function isMovableSequence(colIdx, cardIdx) {
    const col = columns[colIdx];
    if (!col || !col[cardIdx] || !col[cardIdx].faceUp) return false;
    for (let i = cardIdx; i < col.length - 1; i++) {
        const cur = col[i];
        const next = col[i+1];
        if (!next.faceUp || next.suit !== cur.suit || ranks.indexOf(next.rank) !== ranks.indexOf(cur.rank) - 1) return false;
    }
    return true;
}

function checkSequences() {
    columns.forEach((col, idx) => {
        if (col.length < 13) return;
        for (let i = 0; i <= col.length - 13; i++) {
            let sub = col.slice(i, i + 13);
            if (sub.every(c => c.faceUp) && isComplete(sub)) {
                columns[idx].splice(i, 13);
                completedSuits.push(sub[0].suit);
                if (columns[idx].length > 0) {
                    columns[idx][columns[idx].length - 1].faceUp = true;
                }
                score += 100; 
                updateStatus(); 
                render(); 
                renderFoundations();
                if (completedSuits.length === 8) {
                    if (timerInterval) clearInterval(timerInterval); 
                    playVictorySound();
                    document.getElementById('message').style.display = 'block';
                }
                return;
            }
        }
    });
}

function isComplete(a) {
    if (a[0].rank !== 'K') return false;
    for (let i = 0; i < 13; i++) {
        if (a[i].suit !== a[0].suit || ranks.indexOf(a[i].rank) !== 12 - i) return false;
    }
    return true;
}

function getHint() {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < columns[i].length; j++) {
            if (isMovableSequence(i, j)) {
                for (let t = 0; t < 10; t++) {
                    if (i !== t && canDrop(columns[i][j], columns[t])) {
                        highlightHint(i, j, t); 
                        return;
                    }
                }
            }
        }
    }
    playErrorSound();
}

function highlightHint(s, si, t) {
    const column = document.getElementById(`col-${s}`);
    if (!column) return;
    const cardElem = column.children[si];
    if (cardElem) {
        cardElem.style.boxShadow = "0 0 20px 8px #ffd700";
        setTimeout(() => { if(cardElem) cardElem.style.boxShadow = ""; }, 1000);
    }
}

function autoMove(f, idx) {
    if (!isMovableSequence(f, idx)) return;
    for (let i = 0; i < 10; i++) {
        if (i !== f && canDrop(columns[f][idx], columns[i])) { 
            moveCards(f, idx, i); 
            return; 
        }
    }
    playErrorSound();
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

function canDrop(card, target) {
    if (target.length === 0) return true;
    const lastCard = target[target.length - 1];
    return ranks.indexOf(card.rank) === ranks.indexOf(lastCard.rank) - 1;
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
    document.getElementById('score').innerText = score; 
}

window.onload = initGame;