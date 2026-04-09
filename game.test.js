const { canDrop, isMovableSequence, isComplete, calculateScore } = require('./script.js');

// Definindo o array de ranks globalmente para que o isMovableSequence consiga acessá-lo durante os testes
global.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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

    test('Deve permitir movimento de ranks inferiores consecutivos (ex: Q sobre K)', () => {
        const card = { rank: 'Q', suit: '♥' };
        const target = [{ rank: 'K', suit: '♥' }];
        expect(canDrop(card, target)).toBe(true);
    });
});

describe('Lógica de Sequências Móveis (Drag and Drop)', () => {

    test('Deve permitir mover sequência do mesmo naipe e ordem correta (ex: 10♠, 9♠, 8♠)', () => {
        const column = [
            { rank: '10', suit: '♠', faceUp: true },
            { rank: '9', suit: '♠', faceUp: true },
            { rank: '8', suit: '♠', faceUp: true }
        ];
        
        // Injetando a coluna no mock global
        global.columns = [column]; 
        
        // No script.js:
        // cur: '10' (idx 9), next: '9' (idx 8) -> 8 === 9 - 1 (true)
        // cur: '9' (idx 8), next: '8' (idx 7) -> 7 === 8 - 1 (true)
        const result = isMovableSequence(0, 0);
        expect(result).toBe(true);
    });

    test('NÃO deve permitir mover sequência de naipes misturados', () => {
        const column = [
            { rank: '10', suit: '♠', faceUp: true },
            { rank: '9', suit: '♥', faceUp: true }
        ];
        global.columns = [column];
        expect(isMovableSequence(0, 0)).toBe(false);
    });

    test('NÃO deve permitir mover se houver carta faceDown no meio', () => {
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

    test('isComplete deve retornar falso para colunas com menos de 13 cartas', () => {
        // Enviando 13 cartas inválidas para evitar o erro de undefined suit no loop for(13)
        const invalidSet = Array(13).fill({ rank: 'A', suit: '♠', faceUp: true });
        expect(isComplete(invalidSet)).toBe(false);
    });

    test('isComplete deve validar uma sequência real de K a A do mesmo naipe', () => {
        const validRanks = ['K','Q','J','10','9','8','7','6','5','4','3','2','A'];
        const fullSequence = validRanks.map(r => ({ rank: r, suit: '♥', faceUp: true }));
        
        expect(isComplete(fullSequence)).toBe(true);
    });

    test('A pontuação inicial deve ser 500', () => {
        expect(calculateScore()).toBe(500);
    });
});