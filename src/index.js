/* global initGame */

const isNode = typeof module !== 'undefined' && module.exports;

if (isNode) {
    const { store } = require('./store/store.js');
    const logic = require('./game/logic.js');
    module.exports = {
        canDrop: logic.canDrop,
        isMovableSequence: logic.isMovableSequence,
        isComplete: logic.isComplete,
        calculateScore: () => store.state.score,
        ranks: store.state.ranks
    };
}

if (typeof window !== 'undefined' && typeof initGame === 'function') {
    window.onload = initGame;
}
