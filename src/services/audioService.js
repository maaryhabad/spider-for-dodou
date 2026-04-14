const isNode = typeof module !== 'undefined' && module.exports;
let audioCtx = null;

function getAudioCtx() {
    if (audioCtx) return audioCtx;
    if (typeof window === 'undefined') return null;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    } catch (e) {
        return null;
    }
}

function playErrorSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        // audio not supported
    }
}

function playVictorySound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.5);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.5);
        });
    } catch (e) {
        // audio not supported
    }
}

if (typeof window !== 'undefined') {
    window.audioService = { playErrorSound, playVictorySound };
}

if (isNode) {
    module.exports = { playErrorSound, playVictorySound };
}
