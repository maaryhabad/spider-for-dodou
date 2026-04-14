const isNode = typeof module !== 'undefined' && module.exports;

const gameState = {
    ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    deck: [],
    columns: Array.from({ length: 10 }, () => []),
    score: 500,
    seconds: 0,
    timerInterval: null,
    audioCtx: null,
    isDealing: false,
    history: [],
    completedSuits: []
};

const store = {
    state: gameState,

    reset() {
        this.state.deck = [];
        this.state.columns = Array.from({ length: 10 }, () => []);
        this.state.score = 500;
        this.state.seconds = 0;
        this.state.history = [];
        this.state.completedSuits = [];
        this.state.isDealing = false;
    },

    takeSnapshot() {
        return {
            deck: JSON.parse(JSON.stringify(this.state.deck)),
            columns: JSON.parse(JSON.stringify(this.state.columns)),
            score: this.state.score,
            completedSuits: JSON.parse(JSON.stringify(this.state.completedSuits))
        };
    },

    saveSnapshot() {
        this.state.history.push(this.takeSnapshot());
    },

    restoreSnapshot(snapshot) {
        this.state.deck = snapshot.deck;
        this.state.columns = snapshot.columns;
        this.state.score = snapshot.score;
        this.state.completedSuits = snapshot.completedSuits;
    }
};

function getActiveRanks() {
    if (typeof global !== 'undefined' && global.ranks) return global.ranks;
    return store.state.ranks;
}

function getActiveColumns() {
    if (typeof global !== 'undefined' && global.columns) return global.columns;
    return store.state.columns;
}

if (!isNode) {
    window.store = store;
    window.getActiveRanks = getActiveRanks;
    window.getActiveColumns = getActiveColumns;
}

if (!isNode) {
    window.store = store;
    window.getActiveRanks = getActiveRanks;
    window.getActiveColumns = getActiveColumns;
}

if (isNode) {
    module.exports = { store, getActiveRanks, getActiveColumns };
}
