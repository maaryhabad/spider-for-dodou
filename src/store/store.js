const isNode = typeof module !== 'undefined' && module.exports;
const config = isNode ? require('../config.js') : window.appConfig;

const gameState = {
    ranks: config.ranks,
    deck: [],
    columns: Array.from({ length: config.dealColumns }, () => []),
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
    subscribers: [],

    reset() {
        this.state.deck = [];
        this.state.columns = Array.from({ length: config.dealColumns }, () => []);
        this.state.score = 500;
        this.state.seconds = 0;
        this.state.history = [];
        this.state.completedSuits = [];
        this.state.isDealing = false;
        this.notify();
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
        this.notify();
    },

    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
        }
    },

    notify() {
        this.subscribers.forEach((callback) => callback(this.state));
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
    window.subscribeToState = store.subscribe.bind(store);
}

if (isNode) {
    module.exports = { store, getActiveRanks, getActiveColumns };
}
