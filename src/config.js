const appConfig = {
    ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    suits: ['♠', '♥', '♣', '♦'],
    totalSuitsNeeded: 8,
    dealColumns: 10,
    initialDealCount: 54,
    drawCount: 10,
    gaps: {
        default: { faceUp: 35, faceDown: 12 },
        crowded: { faceUp: 20, faceDown: 8 }
    }
};

if (typeof window !== 'undefined') {
    window.appConfig = appConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
