// Pure game logic, no DOM access, so it can be unit tested.

export const COLUMNS = 10;
export const ROWS = 20;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Matrix = number[][];
export type Piece = { type: PieceType; matrix: Matrix; x: number; y: number };
export type Board = (PieceType | null)[][];

export const SHAPES: Record<PieceType, Matrix> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

export const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];

export function emptyRow(): (PieceType | null)[] {
  return Array<PieceType | null>(COLUMNS).fill(null);
}

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => emptyRow());
}

/** Returns the seven piece types in random order (Fisher-Yates). */
export function shuffledBag(random: () => number = Math.random): PieceType[] {
  const types = [...PIECE_TYPES];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

export function createPiece(type: PieceType): Piece {
  const matrix = SHAPES[type].map((row) => [...row]);
  return { type, matrix, x: Math.floor((COLUMNS - matrix[0].length) / 2), y: 0 };
}

export function collides(board: Board, piece: Piece, dx = 0, dy = 0, matrix = piece.matrix): boolean {
  return matrix.some((row, rowIndex) => row.some((value, columnIndex) => {
    if (!value) return false;
    const x = piece.x + columnIndex + dx;
    const y = piece.y + rowIndex + dy;
    return x < 0 || x >= COLUMNS || y >= ROWS || (y >= 0 && board[y][x] !== null);
  }));
}

/** Rotates a matrix 90 degrees clockwise. */
export function rotate(matrix: Matrix): Matrix {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]).reverse());
}

/** Writes the piece into the board in place. */
export function mergePiece(board: Board, piece: Piece): void {
  piece.matrix.forEach((row, y) => row.forEach((value, x) => {
    const boardY = piece.y + y;
    if (value && boardY >= 0) board[boardY][piece.x + x] = piece.type;
  }));
}

/** Removes full rows and refills the top with empty rows. */
export function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => !row.every((cell) => cell !== null));
  const cleared = board.length - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(emptyRow());
  return { board: remaining, cleared };
}

const LINE_REWARDS = [0, 100, 300, 500, 800];

export function lineClearScore(cleared: number, level: number): number {
  if (cleared <= 0) return 0;
  return (LINE_REWARDS[cleared] ?? 800) * level;
}

export function levelForLines(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

/** Milliseconds between automatic drops; gets faster per level, never below 90 ms. */
export function dropInterval(level: number): number {
  return Math.max(90, 800 - (level - 1) * 65);
}
