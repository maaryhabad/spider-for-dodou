const { canDrop, isMovableSequence, isComplete, calculateScore } = require('./script.js');

describe('Lógica de Movimentação de Cartas', () => {
    
    test('Deve permitir colocar qualquer carta em uma coluna vazia', () => {
        const card = { rank: 'K', suit: '♠' };
        const targetEmptyColumn = [];
        expect(canDrop(card, targetEmptyColumn)).toBe(true);
    });

    test('Deve impedir movimento se o rank não for imediatamente inferior (ex: 7 sobre 9)', () => {
        const card = { rank: '7', suit: '♠' };
        const target = [{ rank: '9', suit: '♠' }];
        expect(canDrop(card, target)).toBe(false);
    });

    test('Deve permitir movimento de ranks diferentes mas naipes iguais', () => {
        const card = { rank: 'Q', suit: '♥' };
        const target = [{ rank: 'K', suit: '♥' }];
        expect(canDrop(card, target)).toBe(true);
    });
});

describe('Lógica de Sequências Móveis (Drag and Drop)', () => {

    test('Deve permitir mover sequência do mesmo naipe (ex: 10♠, 9♠, 8♠)', () => {
        const column = [
            { rank: '10', suit: '♠', faceUp: true },
            { rank: '9', suit: '♠', faceUp: true },
            { rank: '8', suit: '♠', faceUp: true }
        ];
        // Mocking columns array globally as script.js uses it
        global.columns = [column]; 
        expect(isMovableSequence(0, 0)).toBe(true);
    });

    test('NÃO deve permitir mover sequência de naipes misturados (ex: 10♠, 9♥)', () => {
        const column = [
            { rank: '10', suit: '♠', faceUp: true },
            { rank: '9', suit: '♥', faceUp: true }
        ];
        global.columns = [column];
        expect(isMovableSequence(0, 0)).toBe(false);
    });

    test('NÃO deve permitir mover se houver carta faceDown no meio da sequência', () => {
        const column = [
            { rank: '10', suit: '♠', faceUp: true },
            { rank: '9', suit: '♠', faceUp: false },
            { rank: '8', suit: '♠', faceUp: true }
        ];
        global.columns = [column];
        expect(isMovableSequence(0, 0)).toBe(false);
    });
});

describe('Lógica de Vitória e Pontuação', () => {

    test('isComplete deve retornar falso para sequências incompletas', () => {
        const partial = [{ rank: 'K', suit: '♠' }, { rank: 'Q', suit: '♠' }];
        expect(isComplete(partial)).toBe(false);
    });

    test('isComplete deve validar sequência correta de 13 cartas', () => {
        const ranks = ['K','Q','J','10','9','8','7','6','5','4','3','2','A'];
        const full = ranks.map(r => ({ rank: r, suit: '♣', faceUp: true }));
        expect(isComplete(full)).toBe(true);
    });

    test('A pontuação inicial deve ser 500', () => {
        expect(calculateScore()).toBe(500);
    });
});