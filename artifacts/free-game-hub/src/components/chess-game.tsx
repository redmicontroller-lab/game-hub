import { useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';

const GLYPHS: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};
const FILES = 'abcdefgh';

export default function ChessGame() {
  const engineRef = useRef<Chess | null>(null);
  if (!engineRef.current) engineRef.current = new Chess();
  const engine = engineRef.current;
  const [fen, setFen] = useState(engine.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const lastMove = engine.history({ verbose: true }).at(-1);
  const ended = engine.isGameOver();
  const status = engine.isCheckmate()
    ? `${engine.turn() === 'w' ? 'Black' : 'White'} wins by checkmate.`
    : engine.isStalemate() ? 'Draw by stalemate.'
      : engine.isThreefoldRepetition() ? 'Draw by repetition.'
        : engine.isDraw() ? 'The game is a draw.'
          : `${engine.turn() === 'w' ? 'White' : 'Black'} to move${engine.isCheck() ? ' · Check!' : ''}`;

  const refresh = () => {
    setFen(engine.fen());
    setSelected(null);
    setTargets([]);
  };

  const clickSquare = (square: Square) => {
    if (ended) return;
    if (selected && targets.includes(square)) {
      try {
        engine.move({ from: selected, to: square, promotion: 'q' });
        refresh();
      } catch {
        setSelected(null);
        setTargets([]);
      }
      return;
    }
    const piece = engine.get(square);
    if (piece?.color === engine.turn()) {
      setSelected(square);
      setTargets(engine.moves({ square, verbose: true }).map((move) => move.to));
      return;
    }
    setSelected(null);
    setTargets([]);
  };

  const undo = () => {
    engine.undo();
    refresh();
  };

  const reset = () => {
    engine.reset();
    refresh();
  };

  return <div className="chess-game">
    <p className="exp-hint">{status}</p>
    <div className="chess-board" data-testid="chess-board">
      {engine.board().flatMap((row, rowIndex) => row.map((piece, colIndex) => {
        const square = `${FILES[colIndex]}${8 - rowIndex}` as Square;
        const isDark = (rowIndex + colIndex) % 2 === 1;
        const isLastMove = lastMove?.from === square || lastMove?.to === square;
        return <button
          key={square}
          className={`chess-square ${isDark ? 'dark' : 'light'} ${selected === square ? 'selected' : ''} ${targets.includes(square) ? 'target' : ''} ${isLastMove ? 'last-move' : ''}`}
          onClick={() => clickSquare(square)}
          aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
          data-testid={`chess-square-${square}`}
        >{piece ? GLYPHS[`${piece.color}${piece.type}`] : ''}</button>;
      }))}
    </div>
    <div className="chess-tools">
      <span className="exp-score">Turn <b>{engine.moveNumber()}</b>{lastMove && <> · Last move <b>{lastMove.san}</b></>}</span>
      <div className="exp-controls">
        <button className="mini-button" onClick={undo} disabled={!engine.history().length} data-testid="button-chess-undo">Undo</button>
        <button className="mini-button" onClick={reset} data-testid="button-chess-reset">New game</button>
      </div>
    </div>
    <p className="exp-hint">Local two-player chess. Tap a piece to see legal moves; pawns promote to queens.</p>
    <span className="sr-only" aria-live="polite">{fen}</span>
  </div>;
}
