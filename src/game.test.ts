import { describe, expect, it } from 'vitest';
import {
  COLUMNS, PIECE_TYPES, ROWS, clearLines, collides, createBoard, createPiece, dropInterval,
  levelForLines, lineClearScore, mergePiece, rotate, shuffledBag, type Board,
} from './game';

function fillRow(board: Board, y: number): void {
  board[y] = Array(COLUMNS).fill('I');
}

describe('createBoard', () => {
  it('creates an empty 10x20 board', () => {
    const board = createBoard();
    expect(board).toHaveLength(ROWS);
    board.forEach((row) => {
      expect(row).toHaveLength(COLUMNS);
      expect(row.every((cell) => cell === null)).toBe(true);
    });
  });
});

describe('shuffledBag', () => {
  it('contains every piece exactly once', () => {
    expect([...shuffledBag()].sort()).toEqual([...PIECE_TYPES].sort());
  });

  it('is deterministic for a fixed random source', () => {
    expect(shuffledBag(() => 0)).toEqual(shuffledBag(() => 0));
  });
});

describe('createPiece', () => {
  it('spawns centered at the top', () => {
    const piece = createPiece('I');
    expect(piece.y).toBe(0);
    expect(piece.x).toBe(3);
    expect(createPiece('O').x).toBe(4);
  });

  it('copies the shape so the template is not mutated', () => {
    const piece = createPiece('T');
    piece.matrix[0][0] = 9;
    expect(createPiece('T').matrix[0][0]).toBe(0);
  });
});

describe('rotate', () => {
  it('turns a horizontal I piece vertical', () => {
    expect(rotate([[1, 1, 1, 1]])).toEqual([[1], [1], [1], [1]]);
  });

  it('rotates T clockwise', () => {
    expect(rotate([[0, 1, 0], [1, 1, 1]])).toEqual([[1, 0], [1, 1], [1, 0]]);
  });

  it('returns to the original after four rotations', () => {
    const l = [[0, 0, 1], [1, 1, 1]];
    expect(rotate(rotate(rotate(rotate(l))))).toEqual(l);
  });
});

describe('collides', () => {
  it('does not collide on an empty board', () => {
    expect(collides(createBoard(), createPiece('T'))).toBe(false);
  });

  it('detects the left and right walls', () => {
    const board = createBoard();
    const piece = { ...createPiece('O'), x: 0 };
    expect(collides(board, piece, -1, 0)).toBe(true);
    expect(collides(board, { ...piece, x: COLUMNS - 2 }, 1, 0)).toBe(true);
  });

  it('detects the floor', () => {
    const piece = { ...createPiece('O'), y: ROWS - 2 };
    expect(collides(createBoard(), piece)).toBe(false);
    expect(collides(createBoard(), piece, 0, 1)).toBe(true);
  });

  it('detects locked blocks', () => {
    const board = createBoard();
    board[1][4] = 'Z';
    expect(collides(board, createPiece('O'))).toBe(true);
  });
});

describe('mergePiece', () => {
  it('writes the piece cells into the board', () => {
    const board = createBoard();
    mergePiece(board, { ...createPiece('O'), y: ROWS - 2 });
    expect(board[ROWS - 1][4]).toBe('O');
    expect(board[ROWS - 2][5]).toBe('O');
    expect(board[ROWS - 1].filter(Boolean)).toHaveLength(2);
  });
});

describe('clearLines', () => {
  it('clears nothing when no row is full', () => {
    const { cleared, board } = clearLines(createBoard());
    expect(cleared).toBe(0);
    expect(board).toHaveLength(ROWS);
  });

  it('removes full rows and shifts the rest down', () => {
    const board = createBoard();
    fillRow(board, ROWS - 1);
    fillRow(board, ROWS - 2);
    board[ROWS - 3][0] = 'T';
    const result = clearLines(board);
    expect(result.cleared).toBe(2);
    expect(result.board).toHaveLength(ROWS);
    expect(result.board[ROWS - 1][0]).toBe('T');
    expect(result.board[0].every((cell) => cell === null)).toBe(true);
  });
});

describe('scoring and levels', () => {
  it('rewards line clears multiplied by level', () => {
    expect(lineClearScore(0, 1)).toBe(0);
    expect(lineClearScore(1, 1)).toBe(100);
    expect(lineClearScore(4, 1)).toBe(800);
    expect(lineClearScore(2, 3)).toBe(900);
  });

  it('levels up every 10 lines', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it('drops faster per level but never below 90 ms', () => {
    expect(dropInterval(1)).toBe(800);
    expect(dropInterval(2)).toBe(735);
    expect(dropInterval(50)).toBe(90);
  });
});
