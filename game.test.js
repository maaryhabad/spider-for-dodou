const { canDrop, isComplete } = require('./script.js');

test('Deve permitir colocar um 9 sobre um 10', () => {
    const card = { rank: '9', suit: '♠' };
    const target = [{ rank: '10', suit: '♠' }];
    expect(canDrop(card, target)).toBe(true);
});

test('Não deve permitir colocar um Rei sobre um Ás', () => {
    const card = { rank: 'K', suit: '♠' };
    const target = [{ rank: 'A', suit: '♠' }];
    expect(canDrop(card, target)).toBe(false);
});

test('Deve validar uma sequência completa de K a A', () => {
    const fullSequence = [
        {rank: 'K', suit: '♠'}, {rank: 'Q', suit: '♠'}, {rank: 'J', suit: '♠'},
        {rank: '10', suit: '♠'}, {rank: '9', suit: '♠'}, {rank: '8', suit: '♠'},
        {rank: '7', suit: '♠'}, {rank: '6', suit: '♠'}, {rank: '5', suit: '♠'},
        {rank: '4', suit: '♠'}, {rank: '3', suit: '♠'}, {rank: '2', suit: '♠'},
        {rank: 'A', suit: '♠'}
    ];
    expect(isComplete(fullSequence)).toBe(true);
});