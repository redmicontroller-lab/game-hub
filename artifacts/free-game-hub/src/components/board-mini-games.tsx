import { useState } from 'react';

type Checker = { side: 'coral' | 'blue'; king: boolean } | null;
type CheckerMove = { row: number; col: number; captured?: [number, number] };
const CHECKER_START: Checker[] = Array.from({ length: 64 }, (_, index) => {
  const row = Math.floor(index / 8);
  const col = index % 8;
  if ((row + col) % 2 === 0) return null;
  if (row < 3) return { side: 'blue', king: false };
  if (row > 4) return { side: 'coral', king: false };
  return null;
});

function checkerMoves(board: Checker[], row: number, col: number): CheckerMove[] {
  const piece = board[row * 8 + col];
  if (!piece) return [];
  const directions = piece.king ? [-1, 1] : piece.side === 'coral' ? [-1] : [1];
  const moves: CheckerMove[] = [];
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
      if (!board[r * 8 + c]) moves.push({ row: r, col: c });
      else if (board[r * 8 + c]?.side !== piece.side) {
        const jumpRow = r + dr;
        const jumpCol = c + dc;
        if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !board[jumpRow * 8 + jumpCol]) {
          moves.push({ row: jumpRow, col: jumpCol, captured: [r, c] });
        }
      }
    }
  }
  return moves;
}

export function CheckersGame() {
  const [board, setBoard] = useState(CHECKER_START);
  const [turn, setTurn] = useState<'coral' | 'blue'>('coral');
  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<CheckerMove[]>([]);
  const [moves, setMoves] = useState(0);

  const clickCell = (index: number) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    if (selected !== null) {
      const target = targets.find((move) => move.row === row && move.col === col);
      if (target) {
        const next = [...board];
        const piece = next[selected];
        if (!piece) return;
        next[selected] = null;
        if (target.captured) next[target.captured[0] * 8 + target.captured[1]] = null;
        next[index] = { ...piece, king: piece.king || (piece.side === 'coral' ? row === 0 : row === 7) };
        setBoard(next);
        setTurn((side) => side === 'coral' ? 'blue' : 'coral');
        setMoves((count) => count + 1);
        setSelected(null);
        setTargets([]);
        return;
      }
    }
    const piece = board[index];
    if (piece?.side === turn) {
      setSelected(index);
      setTargets(checkerMoves(board, row, col));
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  const reset = () => { setBoard(CHECKER_START); setTurn('coral'); setSelected(null); setTargets([]); setMoves(0); };
  const coral = board.filter((piece) => piece?.side === 'coral').length;
  const blue = board.filter((piece) => piece?.side === 'blue').length;
  const winner = coral === 0 || blue === 0 ? `${coral ? 'Coral' : 'Blue'} wins!` : '';
  return <div className="exp-game board-game">
    <p className="exp-hint">{winner || `${turn === 'coral' ? 'Coral' : 'Blue'} to move · Captures are allowed`}</p>
    <div className="checkers-board">{board.map((piece, index) => <button key={index} className={`checkers-cell ${(Math.floor(index / 8) + index % 8) % 2 ? 'dark' : 'light'} ${selected === index ? 'selected' : ''} ${targets.some((move) => move.row * 8 + move.col === index) ? 'target' : ''}`} onClick={() => clickCell(index)} aria-label={`Checkers square ${Math.floor(index / 8) + 1}, ${index % 8 + 1}`} data-testid={`checkers-cell-${index}`}>{piece && <span className={`checker-piece ${piece.side} ${piece.king ? 'king' : ''}`}>{piece.king ? '♛' : ''}</span>}</button>)}</div>
    <div className="exp-score">Coral <b>{coral}</b> · Blue <b>{blue}</b> · Moves <b>{moves}</b></div>
    <button className="mini-button" onClick={reset} data-testid="button-checkers-reset">New game</button>
  </div>;
}

type Disc = 'B' | 'W' | null;
const REVERSI_DIRECTIONS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const REVERSI_START: Disc[] = Array(36).fill(null);
REVERSI_START[14] = 'W'; REVERSI_START[15] = 'B'; REVERSI_START[20] = 'B'; REVERSI_START[21] = 'W';

function reversiFlips(board: Disc[], cell: number, side: 'B' | 'W') {
  const row = Math.floor(cell / 6);
  const col = cell % 6;
  if (board[cell]) return [];
  const flips: number[] = [];
  for (const [dr, dc] of REVERSI_DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const line: number[] = [];
    while (r >= 0 && r < 6 && c >= 0 && c < 6 && board[r * 6 + c] && board[r * 6 + c] !== side) {
      line.push(r * 6 + c);
      r += dr; c += dc;
    }
    if (line.length && r >= 0 && r < 6 && c >= 0 && c < 6 && board[r * 6 + c] === side) flips.push(...line);
  }
  return flips;
}

export function ReversiGame() {
  const [board, setBoard] = useState<Disc[]>(REVERSI_START);
  const [turn, setTurn] = useState<'B' | 'W'>('B');
  const [message, setMessage] = useState('');
  const [passes, setPasses] = useState(0);
  const legal = board.map((cell, index) => !cell && reversiFlips(board, index, turn).length > 0 ? index : -1).filter((index) => index >= 0);
  const black = board.filter((piece) => piece === 'B').length;
  const white = board.filter((piece) => piece === 'W').length;
  const finished = passes >= 2 || board.every(Boolean);
  const play = (index: number) => {
    const flips = reversiFlips(board, index, turn);
    if (!flips.length || finished) return;
    const next = [...board];
    next[index] = turn;
    flips.forEach((cell) => { next[cell] = turn; });
    const other = turn === 'B' ? 'W' : 'B';
    const otherCanMove = next.some((piece, cell) => !piece && reversiFlips(next, cell, other).length);
    const currentCanMove = next.some((piece, cell) => !piece && reversiFlips(next, cell, turn).length);
    setBoard(next);
    if (otherCanMove) { setTurn(other); setPasses(0); setMessage(`${other === 'B' ? 'Black' : 'White'} to move.`); }
    else if (currentCanMove) { setPasses((value) => value + 1); setMessage(`${other === 'B' ? 'Black' : 'White'} has no move. Play again.`); }
    else setPasses(2);
  };
  const reset = () => { setBoard([...REVERSI_START]); setTurn('B'); setPasses(0); setMessage(''); };
  return <div className="exp-game board-game">
    <p className="exp-hint">{finished ? black === white ? 'The game is a draw.' : `${black > white ? 'Black' : 'White'} wins!` : message || `${turn === 'B' ? 'Black' : 'White'} to move`}</p>
    <div className="reversi-board">{board.map((disc, index) => <button key={index} className={`reversi-cell ${legal.includes(index) ? 'legal' : ''}`} onClick={() => play(index)} aria-label={`Reversi square ${Math.floor(index / 6) + 1}, ${index % 6 + 1}`} data-testid={`reversi-cell-${index}`}>{disc && <span className={`reversi-disc ${disc === 'B' ? 'black' : 'white'}`}/>}</button>)}</div>
    <div className="exp-score">Black <b>{black}</b> · White <b>{white}</b></div>
    <button className="mini-button" onClick={reset} data-testid="button-reversi-reset">New game</button>
  </div>;
}

const SHIPS = new Set([7, 8, 9, 22, 28, 34]);
export function BattleshipGame() {
  const [shots, setShots] = useState<number[]>([]);
  const hits = shots.filter((index) => SHIPS.has(index)).length;
  const sunk = hits === SHIPS.size;
  const shoot = (index: number) => { if (!shots.includes(index) && !sunk) setShots((current) => [...current, index]); };
  return <div className="exp-game board-game">
    <p className="exp-hint">{sunk ? 'Fleet sunk! You found every ship.' : 'Tap a coordinate to fire. Find all six hidden ship sections.'}</p>
    <div className="battleship-board">{Array.from({ length: 36 }, (_, index) => <button key={index} className={`battle-cell ${shots.includes(index) ? SHIPS.has(index) ? 'hit' : 'miss' : ''}`} onClick={() => shoot(index)} aria-label={`Fire at row ${Math.floor(index / 6) + 1}, column ${index % 6 + 1}`} data-testid={`battleship-cell-${index}`}>{shots.includes(index) ? SHIPS.has(index) ? '×' : '·' : ''}</button>)}</div>
    <div className="exp-score">Hits <b>{hits}</b> / 6 · Shots <b>{shots.length}</b></div>
    {sunk && <button className="mini-button" onClick={() => setShots([])} data-testid="button-battleship-reset">New fleet</button>}
  </div>;
}

function finishMancala(pits: number[]) {
  const next = [...pits];
  const firstEmpty = next.slice(0, 6).every((count) => count === 0);
  const secondEmpty = next.slice(7, 13).every((count) => count === 0);
  if (firstEmpty || secondEmpty) {
    for (let index = 0; index < 6; index++) { next[6] += next[index]; next[index] = 0; }
    for (let index = 7; index < 13; index++) { next[13] += next[index]; next[index] = 0; }
  }
  return { pits: next, finished: firstEmpty || secondEmpty };
}

export function MancalaGame() {
  const [pits, setPits] = useState<number[]>(Array.from({ length: 14 }, (_, index) => index === 6 || index === 13 ? 0 : 4));
  const [turn, setTurn] = useState<0 | 1>(0);
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState(false);

  const sow = (pit: number) => {
    if (finished || (turn === 0 ? pit > 5 : pit < 7 || pit > 12) || pits[pit] === 0) return;
    const next = [...pits];
    let stones = next[pit];
    next[pit] = 0;
    let index = pit;
    while (stones > 0) {
      index = (index + 1) % 14;
      if ((turn === 0 && index === 13) || (turn === 1 && index === 6)) continue;
      next[index]++;
      stones--;
    }
    if ((turn === 0 && index === 6) || (turn === 1 && index === 13)) {
      setMessage('Extra turn!');
    } else {
      const ownStart = turn === 0 ? 0 : 7;
      const ownEnd = turn === 0 ? 5 : 12;
      const opposite = 12 - index;
      if (index >= ownStart && index <= ownEnd && next[index] === 1 && next[opposite] > 0) {
        const store = turn === 0 ? 6 : 13;
        next[store] += next[index] + next[opposite];
        next[index] = 0; next[opposite] = 0;
        setMessage('Nice capture!');
      } else setMessage('');
    }
    const result = finishMancala(next);
    setPits(result.pits);
    if (result.finished) setFinished(true);
    else if (!((turn === 0 && index === 6) || (turn === 1 && index === 13))) setTurn((side) => side === 0 ? 1 : 0);
  };

  const reset = () => { setPits(Array.from({ length: 14 }, (_, index) => index === 6 || index === 13 ? 0 : 4)); setTurn(0); setFinished(false); setMessage(''); };
  return <div className="exp-game board-game">
    <p className="exp-hint">{finished ? pits[6] === pits[13] ? 'The game is a tie.' : `${pits[6] > pits[13] ? 'Player 1' : 'Player 2'} wins!` : message || `Player ${turn + 1} to move`}</p>
    <div className="mancala-board">
      <div className="mancala-store"><small>P2 store</small><b>{pits[13]}</b></div>
      <div className="mancala-pits">
        {[...Array.from({ length: 6 }, (_, i) => 12 - i), ...Array.from({ length: 6 }, (_, i) => i)].map((index) => <button key={index} className={`mancala-pit ${index > 5 ? 'player-one' : ''}`} onClick={() => sow(index)} disabled={finished} data-testid={`mancala-pit-${index}`} aria-label={`Pit has ${pits[index]} stones`}><span>{pits[index]}</span></button>)}
      </div>
      <div className="mancala-store"><small>P1 store</small><b>{pits[6]}</b></div>
    </div>
    <button className="mini-button" onClick={reset} data-testid="button-mancala-reset">New game</button>
  </div>;
}

const SUDOKU_SOLUTION = [
  5,3,4,6,7,8,9,1,2, 6,7,2,1,9,5,3,4,8, 1,9,8,3,4,2,5,6,7,
  8,5,9,7,6,1,4,2,3, 4,2,6,8,5,3,7,9,1, 7,1,3,9,2,4,8,5,6,
  9,6,1,5,3,7,2,8,4, 2,8,7,4,1,9,6,3,5, 3,4,5,2,8,6,1,7,9,
];
const SUDOKU_PUZZLE = [
  5,0,0,6,0,8,0,1,0, 0,7,2,0,9,0,3,0,8, 1,0,8,0,4,2,0,6,0,
  8,5,0,7,0,0,4,0,3, 0,2,6,0,5,3,0,9,0, 7,0,3,9,0,4,8,5,6,
  0,6,0,5,3,0,2,0,4, 2,0,7,4,0,9,0,3,5, 3,4,0,0,8,6,1,0,9,
];
export function SudokuGame() {
  const [values, setValues] = useState(SUDOKU_PUZZLE);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const fixed = (index: number) => SUDOKU_PUZZLE[index] !== 0;
  const chooseNumber = (value: number) => {
    if (selected === null || fixed(selected)) return;
    setValues((current) => current.map((digit, index) => index === selected ? value : digit));
    setMessage('');
  };
  const check = () => setMessage(values.every((value, index) => value === SUDOKU_SOLUTION[index]) ? 'Solved! Great work.' : 'Not quite yet. Check the rows, columns, and boxes.');
  const reset = () => { setValues(SUDOKU_PUZZLE); setSelected(null); setMessage(''); };
  return <div className="exp-game board-game">
    <p className="exp-hint">{message || 'Select an empty square, then choose a number.'}</p>
    <div className="sudoku-board">{values.map((value, index) => <button key={index} className={`sudoku-cell ${fixed(index) ? 'fixed' : ''} ${selected === index ? 'selected' : ''} ${Math.floor(Math.floor(index / 9) / 3) !== Math.floor((Math.floor(index / 9) - 1) / 3) ? 'box-top' : ''} ${Math.floor(index % 9 / 3) !== Math.floor((index % 9 - 1) / 3) ? 'box-left' : ''}`} onClick={() => setSelected(index)} aria-label={`Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}${value ? `, ${value}` : ', empty'}`} data-testid={`sudoku-cell-${index}`}>{value || ''}</button>)}</div>
    <div className="exp-controls sudoku-numbers">{Array.from({ length: 9 }, (_, index) => <button className="mini-button" key={index} onClick={() => chooseNumber(index + 1)} data-testid={`sudoku-number-${index + 1}`}>{index + 1}</button>)}<button className="mini-button" onClick={() => chooseNumber(0)} data-testid="sudoku-erase">Erase</button></div>
    <div className="exp-controls"><button className="mini-button" onClick={check} data-testid="button-sudoku-check">Check puzzle</button><button className="mini-button" onClick={reset} data-testid="button-sudoku-reset">Reset</button></div>
  </div>;
}
