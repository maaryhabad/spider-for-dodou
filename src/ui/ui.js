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

function playErrorSound() {
    try {
        if (!store.state.audioCtx) {
            store.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = store.state.audioCtx.createOscillator();
        const gain = store.state.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(store.state.audioCtx.destination);
        osc.frequency.setValueAtTime(150, store.state.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, store.state.audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(store.state.audioCtx.currentTime + 0.2);
    } catch (e) {
        // áudio não suportado
    }
}

function playVictorySound() {
    try {
        if (!store.state.audioCtx) {
            store.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = store.state.audioCtx.createOscillator();
            const gain = store.state.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(store.state.audioCtx.destination);
            osc.frequency.setValueAtTime(freq, store.state.audioCtx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.1, store.state.audioCtx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, store.state.audioCtx.currentTime + i * 0.15 + 0.5);
            osc.start(store.state.audioCtx.currentTime + i * 0.15);
            osc.stop(store.state.audioCtx.currentTime + i * 0.15 + 0.5);
        });
    } catch (e) {
        // áudio não suportado
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event, colIndex, cardIndex) {
    event.dataTransfer.setData('from', colIndex.toString());
    event.dataTransfer.setData('index', cardIndex.toString());
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showNewGameOptions, hideNewGameOptions, toggleMusicModal, closeMusicModal, playErrorSound, playVictorySound, allowDrop, drag };
}
