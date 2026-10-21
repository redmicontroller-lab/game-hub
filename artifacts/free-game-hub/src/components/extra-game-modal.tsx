import { Fragment, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gamepad2, RotateCcw, X } from 'lucide-react';

type ExtraGameInfo = { id: string; name: string };

const WORDS = ['ARCADE', 'BUTTON', 'GALAXY', 'PUZZLE', 'PIXEL', 'ROCKET', 'SPRINT', 'PLANET'];
const COLORS = [
  { name: 'coral', value: '#ec7658' },
  { name: 'mint', value: '#65a68d' },
  { name: 'gold', value: '#e3b844' },
  { name: 'blue', value: '#6588b7' },
];
const RPS = ['Rock', 'Paper', 'Scissors'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomWord() {
  return WORDS[randomInt(WORDS.length)];
}

function scramble(word: string) {
  let result = word;
  while (result === word) {
    result = [...word].sort(() => Math.random() - 0.5).join('');
  }
  return result;
}

function newMinefield() {
  const mines = new Set<number>();
  while (mines.size < 5) mines.add(randomInt(25));
  return [...mines];
}

function countNeighborMines(mines: number[], index: number) {
  const row = Math.floor(index / 5);
  const col = index % 5;
  let count = 0;
  for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
      if (mines.includes(r * 5 + c)) count++;
    }
  }
  return count;
}

function flipLights(board: boolean[], index: number) {
  const next = [...board];
  const row = Math.floor(index / 5);
  const col = index % 5;
  [index, row > 0 ? index - 5 : -1, row < 4 ? index + 5 : -1, col > 0 ? index - 1 : -1, col < 4 ? index + 1 : -1]
    .filter((cell) => cell >= 0)
    .forEach((cell) => { next[cell] = !next[cell]; });
  return next;
}

function newLightsBoard() {
  let board = Array(25).fill(false) as boolean[];
  for (let i = 0; i < 12; i++) board = flipLights(board, randomInt(25));
  if (!board.some(Boolean)) board = flipLights(board, 12);
  return board;
}

function connectWinner(board: number[]) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const value = board[row * 7 + col];
      if (!value) continue;
      for (const [dr, dc] of directions) {
        const endRow = row + dr * 3;
        const endCol = col + dc * 3;
        if (endRow < 0 || endRow > 5 || endCol < 0 || endCol > 6) continue;
        if ([1, 2, 3].every((step) => board[(row + dr * step) * 7 + col + dc * step] === value)) return value;
      }
    }
  }
  return board.every(Boolean) ? 3 : 0;
}

function edgeId(kind: 'h' | 'v', row: number, col: number) {
  return `${kind}-${row}-${col}`;
}

function adjacentBoxes(kind: 'h' | 'v', row: number, col: number) {
  return kind === 'h'
    ? [[row - 1, col], [row, col]]
    : [[row, col - 1], [row, col]];
}

function boxEdges(row: number, col: number) {
  return [
    edgeId('h', row, col),
    edgeId('h', row + 1, col),
    edgeId('v', row, col),
    edgeId('v', row, col + 1),
  ];
}

function getRpsResult(player: string, computer: string) {
  if (player === computer) return 'It’s a draw.';
  const wins = (player === 'Rock' && computer === 'Scissors') ||
    (player === 'Paper' && computer === 'Rock') ||
    (player === 'Scissors' && computer === 'Paper');
  return wins ? 'You win this round.' : 'The computer wins this round.';
}

function PanelButton({ children, onClick, disabled = false, testId, className = '' }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
  className?: string;
}) {
  return <button className={`mini-button ${className}`} onClick={onClick} disabled={disabled} data-testid={testId}>{children}</button>;
}

function ScoreLine({ children }: { children: ReactNode }) {
  return <div className="mini-score" data-testid="text-extra-game-score">{children}</div>;
}

function GamePanel({ game }: { game: ExtraGameInfo }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [mole, setMole] = useState(4);
  const [rpsPlayer, setRpsPlayer] = useState('');
  const [rpsComputer, setRpsComputer] = useState('');
  const [coinResult, setCoinResult] = useState('');
  const [card, setCard] = useState(7);
  const [guess, setGuess] = useState('');
  const [numberTarget] = useState(() => 1 + randomInt(50));
  const [word, setWord] = useState(randomWord);
  const [scrambledWord, setScrambledWord] = useState(() => scramble(word));
  const [wordInput, setWordInput] = useState('');
  const [hangWord, setHangWord] = useState(randomWord);
  const [hangLetters, setHangLetters] = useState<string[]>([]);
  const [mines, setMines] = useState(newMinefield);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [flags, setFlags] = useState<number[]>([]);
  const [flagMode, setFlagMode] = useState(false);
  const [mineLost, setMineLost] = useState(false);
  const [lights, setLights] = useState(newLightsBoard);
  const [simon, setSimon] = useState<number[]>([randomInt(4), randomInt(4), randomInt(4)]);
  const [simonInput, setSimonInput] = useState<number[]>([]);
  const [simonShow, setSimonShow] = useState(false);
  const [simonLit, setSimonLit] = useState(-1);
  const [connect, setConnect] = useState(Array(42).fill(0) as number[]);
  const [connectTurn, setConnectTurn] = useState(1);
  const [dots, setDots] = useState<string[]>([]);
  const [boxes, setBoxes] = useState(Array(9).fill(0) as number[]);
  const [dotsTurn, setDotsTurn] = useState(1);
  const [pongBall, setPongBall] = useState({ x: 50, y: 40, vx: 1.3, vy: 1.15 });
  const [pongPaddle, setPongPaddle] = useState(50);
  const [pongScore, setPongScore] = useState(0);
  const [pongLost, setPongLost] = useState(false);
  const [bricks, setBricks] = useState(Array(18).fill(true) as boolean[]);
  const [brickBall, setBrickBall] = useState({ x: 50, y: 72, vx: 1.2, vy: -1.3 });
  const [brickPaddle, setBrickPaddle] = useState(50);
  const [brickScore, setBrickScore] = useState(0);
  const [brickLost, setBrickLost] = useState(false);
  const [flyY, setFlyY] = useState(50);
  const [flyVelocity, setFlyVelocity] = useState(0);
  const [obstacleX, setObstacleX] = useState(95);
  const [gapCenter, setGapCenter] = useState(50);
  const [flyLost, setFlyLost] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathNumbers, setMathNumbers] = useState(() => [2 + randomInt(8), 2 + randomInt(8)]);
  const [colorRound, setColorRound] = useState(() => createColorRound());
  const [oddRound, setOddRound] = useState(() => createOddRound());

  const isTimed = ['reaction-tap', 'mole-pop', 'typing-sprint', 'quick-math'].includes(game.id);
  const timeLimit = game.id === 'mole-pop' ? 20 : game.id === 'typing-sprint' ? 30 : game.id === 'quick-math' ? 20 : 15;

  useEffect(() => {
    if (!running || !isTimed) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, isTimed]);

  useEffect(() => {
    if (!simonShow || game.id !== 'simon-says') return;
    let step = 0;
    const timer = window.setInterval(() => {
      if (step >= simon.length) {
        window.clearInterval(timer);
        setSimonLit(-1);
        setSimonShow(false);
        setFeedback('Repeat the pattern in order.');
        return;
      }
      setSimonLit(simon[step]);
      window.setTimeout(() => setSimonLit(-1), 330);
      step++;
    }, 560);
    return () => window.clearInterval(timer);
  }, [simonShow, simon, game.id]);

  useEffect(() => {
    if (!running || game.id !== 'pong') return;
    const timer = window.setInterval(() => {
      setPongBall((ball) => {
        let x = ball.x + ball.vx;
        let y = ball.y + ball.vy;
        let vx = ball.vx;
        let vy = ball.vy;
        if (x < 3 || x > 97) vx *= -1;
        if (y < 5) vy = Math.abs(vy);
        if (y > 86 && ball.y <= 86) {
          if (Math.abs(x - pongPaddle) < 12) {
            vy = -Math.abs(vy);
            setPongScore((value) => value + 1);
          } else {
            setRunning(false);
            setPongLost(true);
            return ball;
          }
        }
        return { x: Math.max(3, Math.min(97, x)), y: Math.min(96, y), vx, vy };
      });
    }, 34);
    return () => window.clearInterval(timer);
  }, [running, pongPaddle, game.id]);

  useEffect(() => {
    if (!running || game.id !== 'breakout') return;
    const timer = window.setInterval(() => {
      setBrickBall((ball) => {
        let x = ball.x + ball.vx;
        let y = ball.y + ball.vy;
        let vx = ball.vx;
        let vy = ball.vy;
        if (x < 3 || x > 97) vx *= -1;
        if (y >= 4 && y <= 31) {
          const brickRow = Math.floor((y - 4) / 8);
          const brickColumn = Math.min(5, Math.floor(x / (100 / 6)));
          const brickIndex = brickRow * 6 + brickColumn;
          if (brickRow >= 0 && brickRow < 3 && bricks[brickIndex]) {
            setBricks((values) => values.map((value, index) => index === brickIndex ? false : value));
            setBrickScore((value) => value + 10);
            vy = -vy;
          }
        }
        if (y > 82 && ball.y <= 82) {
          if (Math.abs(x - brickPaddle) < 13) vy = -Math.abs(vy);
          else {
            setRunning(false);
            setBrickLost(true);
            return ball;
          }
        }
        return { x: Math.max(3, Math.min(97, x)), y: Math.min(96, y), vx, vy };
      });
    }, 34);
    return () => window.clearInterval(timer);
  }, [running, brickPaddle, bricks, game.id]);

  useEffect(() => {
    if (!running || game.id !== 'flappy-flyer') return;
    const timer = window.setInterval(() => {
      setFlyY((y) => {
        const velocity = Math.min(flyVelocity + 0.6, 7);
        setFlyVelocity(velocity);
        const nextY = y + velocity * 0.7;
        setObstacleX((x) => {
          if (x < 12) {
            setPoints((value) => value + 1);
            setGapCenter(25 + randomInt(50));
            return 105;
          }
          if (x < 37 && x > 20 && (nextY < gapCenter - 19 || nextY > gapCenter + 19)) {
            setRunning(false);
            setFlyLost(true);
          }
          return x - 1.8;
        });
        if (nextY < 4 || nextY > 96) {
          setRunning(false);
          setFlyLost(true);
          return Math.max(4, Math.min(96, nextY));
        }
        return nextY;
      });
    }, 45);
    return () => window.clearInterval(timer);
  }, [running, flyVelocity, gapCenter, game.id]);

  useEffect(() => {
    if (!['pong', 'breakout'].includes(game.id) || !running) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' ? -8 : 8;
      if (game.id === 'pong') setPongPaddle((value) => Math.max(10, Math.min(90, value + delta)));
      else setBrickPaddle((value) => Math.max(10, Math.min(90, value + delta)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game.id, running]);

  useEffect(() => {
    if (game.id !== 'flappy-flyer' || !running) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === 'ArrowUp') {
        event.preventDefault();
        setFlyVelocity(-7);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game.id, running]);

  const startTimedGame = () => {
    setSeconds(timeLimit);
    setPoints(0);
    setFeedback('');
    setRunning(true);
    if (game.id === 'mole-pop') setMole(randomInt(9));
    if (game.id === 'typing-sprint') setTypingText('');
    if (game.id === 'quick-math') {
      setMathNumbers([2 + randomInt(8), 2 + randomInt(8)]);
      setMathAnswer('');
    }
  };

  const guessNumber = () => {
    const value = Number(guess);
    if (!value || value < 1 || value > 50) {
      setFeedback('Choose a number from 1 to 50.');
      return;
    }
    if (value === numberTarget) setFeedback(`You found it in ${points + 1} guesses.`);
    else {
      setPoints((count) => count + 1);
      setFeedback(value < numberTarget ? 'Too low. Try a higher number.' : 'Too high. Try a lower number.');
    }
  };

  const submitWord = () => {
    if (wordInput.trim().toUpperCase() === word) setFeedback('That’s it. Nicely solved.');
    else setFeedback('Not quite. Take another look at the letters.');
  };

  const guessHangLetter = (letter: string) => {
    if (hangLetters.includes(letter) || hangWord.split('').every((char) => hangLetters.includes(char)) || hangLetters.filter((char) => !hangWord.includes(char)).length >= 6) return;
    setHangLetters((current) => [...current, letter]);
  };

  const tapMine = (index: number) => {
    if (mineLost || revealed.includes(index) || flags.includes(index)) return;
    if (mines.includes(index)) {
      setMineLost(true);
      setFeedback('Boom — reset and try a new field.');
      return;
    }
    setRevealed((current) => [...current, index]);
    if (revealed.length === 19) setFeedback('Field cleared. You found every safe square.');
  };

  const clickSimon = (index: number) => {
    if (simonShow) return;
    const nextInput = [...simonInput, index];
    setSimonInput(nextInput);
    if (nextInput[nextInput.length - 1] !== simon[nextInput.length - 1]) {
      setFeedback('That pattern slipped. Watch the new one.');
      setSimon([randomInt(4), randomInt(4), randomInt(4)]);
      setSimonInput([]);
      setSimonShow(true);
    } else if (nextInput.length === simon.length) {
      setPoints((value) => value + 1);
      setFeedback('Perfect. One more color.');
      setSimon((current) => [...current, randomInt(4)]);
      setSimonInput([]);
      setSimonShow(true);
    }
  };

  const dropConnect = (column: number) => {
    if (connectWinner(connect)) return;
    const row = Array.from({ length: 6 }, (_, index) => 5 - index).find((r) => !connect[r * 7 + column]);
    if (row === undefined) return;
    setConnect((current) => {
      const next = [...current];
      next[row * 7 + column] = connectTurn;
      return next;
    });
    setConnectTurn((turn) => turn === 1 ? 2 : 1);
  };

  const drawDotEdge = (kind: 'h' | 'v', row: number, col: number) => {
    const id = edgeId(kind, row, col);
    if (dots.includes(id) || boxes.every(Boolean)) return;
    const nextDots = [...dots, id];
    setDots(nextDots);
    let claimed = false;
    const nextBoxes = [...boxes];
    for (const [r, c] of adjacentBoxes(kind, row, col)) {
      if (r < 0 || r > 2 || c < 0 || c > 2) continue;
      const boxIndex = r * 3 + c;
      if (!nextBoxes[boxIndex] && boxEdges(r, c).every((edge) => nextDots.includes(edge))) {
        nextBoxes[boxIndex] = dotsTurn;
        claimed = true;
      }
    }
    setBoxes(nextBoxes);
    if (!claimed) setDotsTurn((turn) => turn === 1 ? 2 : 1);
  };

  const submitMath = () => {
    if (Number(mathAnswer) === mathNumbers[0] + mathNumbers[1]) {
      setPoints((value) => value + 1);
      setFeedback('Correct.');
    } else setFeedback('Try the next one.');
    setMathNumbers([2 + randomInt(8), 2 + randomInt(8)]);
    setMathAnswer('');
  };

  const answerColor = (match: boolean) => {
    if (match === colorRound.matches) setPoints((value) => value + 1);
    else setPoints((value) => Math.max(0, value - 1));
    setFeedback(match === colorRound.matches ? 'Good eye.' : 'Not this time.');
    setColorRound(createColorRound());
  };

  const answerOdd = (index: number) => {
    if (index === oddRound.oddIndex) {
      setPoints((value) => value + 1);
      setFeedback('Found it.');
    } else {
      setPoints((value) => Math.max(0, value - 1));
      setFeedback('That one matches the others.');
    }
    setOddRound(createOddRound());
  };

  const typingWords = useMemo(() => {
    const source = 'Quick games make little breaks better. Keep your eyes on the next word and find a steady rhythm.';
    return source;
  }, []);

  const content = () => {
    switch (game.id) {
      case 'reaction-tap':
        return <div className="mini-game-content"><ScoreLine>Time <b>{seconds}s</b> <span>·</span> Taps <b>{points}</b></ScoreLine>
          {running ? <button className="reaction-target" onClick={() => setPoints((value) => value + 1)} data-testid="button-reaction-tap">TAP!</button>
            : <StartButton onClick={startTimedGame} ended={seconds === 0} />}
        </div>;
      case 'mole-pop':
        return <div className="mini-game-content"><ScoreLine>Time <b>{seconds}s</b> <span>·</span> Moles <b>{points}</b></ScoreLine>
          <div className="mole-grid">{Array.from({ length: 9 }, (_, index) => <button key={index} className={`mole-hole ${running && mole === index ? 'mole-up' : ''}`} onClick={() => {
            if (running && mole === index) { setPoints((value) => value + 1); setMole((value) => (value + 1 + randomInt(8)) % 9); }
          }} aria-label={running && mole === index ? 'Whack mole' : 'Empty mole hole'} data-testid={`button-mole-${index}`}>{running && mole === index ? '●' : ''}</button>)}</div>
          {!running && <StartButton onClick={startTimedGame} ended={seconds === 0} />}
        </div>;
      case 'rock-paper-scissors':
        return <div className="mini-game-content"><div className="choice-display"><strong>{rpsPlayer || 'Choose your move'}</strong><span>{rpsComputer ? `vs ${rpsComputer}` : 'Best of luck.'}</span></div>
          <div className="mini-choice-row">{RPS.map((choice) => <PanelButton key={choice} onClick={() => { const computer = RPS[randomInt(3)]; setRpsPlayer(choice); setRpsComputer(computer); setFeedback(getRpsResult(choice, computer)); if (getRpsResult(choice, computer).startsWith('You win')) setPoints((value) => value + 1); }} testId={`button-rps-${choice.toLowerCase()}`}>{choice}</PanelButton>)}</div>
          <ScoreLine>Rounds won <b>{points}</b></ScoreLine>
        </div>;
      case 'coin-toss':
        return <div className="mini-game-content"><div className="coin-visual">{coinResult || '?'}</div><p className="mini-prompt">Call it before the coin lands.</p>
          <div className="mini-choice-row">{['Heads', 'Tails'].map((side) => <PanelButton key={side} onClick={() => { const result = Math.random() < 0.5 ? 'Heads' : 'Tails'; setCoinResult(result); setFeedback(result === side ? `It’s ${result}. You called it.` : `It’s ${result}. Try again.`); if (result === side) setPoints((value) => value + 1); }} testId={`button-coin-${side.toLowerCase()}`}>{side}</PanelButton>)}</div><ScoreLine>Correct calls <b>{points}</b></ScoreLine>
        </div>;
      case 'higher-lower':
        return <div className="mini-game-content"><div className="playing-card">{card}</div><p className="mini-prompt">Will the next card be higher or lower?</p>
          <div className="mini-choice-row"><PanelButton onClick={() => chooseHigherLower('higher', card, setCard, setPoints, setFeedback)} testId="button-higher">Higher</PanelButton><PanelButton onClick={() => chooseHigherLower('lower', card, setCard, setPoints, setFeedback)} testId="button-lower">Lower</PanelButton></div><ScoreLine>Streak <b>{points}</b></ScoreLine>
        </div>;
      case 'number-guess':
        return <div className="mini-game-content"><div className="number-target">?</div><p className="mini-prompt">Find the secret number between 1 and 50.</p>
          <div className="mini-inline-form"><input type="number" min="1" max="50" value={guess} onChange={(event) => setGuess(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') guessNumber(); }} aria-label="Your guess" data-testid="input-number-guess"/><PanelButton onClick={guessNumber} testId="button-submit-guess">Guess</PanelButton></div><ScoreLine>Guesses <b>{feedback.startsWith('You found') ? points + 1 : points}</b></ScoreLine>
        </div>;
      case 'word-scramble':
        return <div className="mini-game-content"><div className="scramble-word">{scrambledWord}</div><p className="mini-prompt">Put the letters back in order.</p>
          <div className="mini-inline-form"><input value={wordInput} onChange={(event) => setWordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitWord(); }} aria-label="Unscrambled word" data-testid="input-word-scramble"/><PanelButton onClick={() => { if (wordInput.trim().toUpperCase() === word) { const nextWord = randomWord(); setPoints((value) => value + 1); setWord(nextWord); setScrambledWord(scramble(nextWord)); setWordInput(''); setFeedback('Correct. Here comes another.'); } else submitWord(); }} testId="button-submit-word">Check</PanelButton></div><ScoreLine>Solved <b>{points}</b></ScoreLine>
        </div>;
      case 'hangman':
        return <div className="mini-game-content"><div className="hang-word">{hangWord.split('').map((letter, index) => <span key={index}>{hangLetters.includes(letter) ? letter : '＿'}</span>)}</div>
          <p className="mini-prompt">{hangWord.split('').every((letter) => hangLetters.includes(letter)) ? 'You solved it!' : hangLetters.filter((letter) => !hangWord.includes(letter)).length >= 6 ? `The word was ${hangWord}.` : `Misses: ${hangLetters.filter((letter) => !hangWord.includes(letter)).length} / 6`}</p>
          <div className="letter-grid">{LETTERS.map((letter) => <button key={letter} className="letter-button" disabled={hangLetters.includes(letter) || hangLetters.filter((char) => !hangWord.includes(char)).length >= 6 || hangWord.split('').every((char) => hangLetters.includes(char))} onClick={() => guessHangLetter(letter)} data-testid={`button-hangman-${letter.toLowerCase()}`}>{letter}</button>)}</div>
          <PanelButton onClick={() => { setHangWord(randomWord()); setHangLetters([]); setFeedback('New word, fresh start.'); }} testId="button-new-hangman-word">New word</PanelButton>
        </div>;
      case 'minesweeper':
        return <div className="mini-game-content"><ScoreLine>Safe squares <b>{revealed.length}</b> <span>·</span> Flags <b>{flags.length}</b></ScoreLine>
          <div className="mine-grid">{Array.from({ length: 25 }, (_, index) => <button key={index} className={`mine-cell ${revealed.includes(index) ? 'revealed' : ''} ${flags.includes(index) ? 'flagged' : ''}`} onContextMenu={(event) => { event.preventDefault(); if (!revealed.includes(index) && !mineLost) setFlags((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index]); }} onClick={() => {
            if (flagMode) {
              if (!revealed.includes(index) && !mineLost) setFlags((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index]);
            } else tapMine(index);
          }} aria-label={flags.includes(index) ? 'Flagged square' : revealed.includes(index) ? `Revealed ${countNeighborMines(mines, index)} nearby mines` : 'Hidden square'} data-testid={`button-mine-${index}`}>{flags.includes(index) ? '⚑' : revealed.includes(index) ? countNeighborMines(mines, index) || '·' : ''}</button>)}</div>
          <div className="mini-choice-row"><PanelButton onClick={() => setFlagMode((value) => !value)} testId="button-toggle-flag-mode">{flagMode ? 'Flag mode on' : 'Flag a square'}</PanelButton>{mineLost && <PanelButton onClick={() => { setMines(newMinefield()); setRevealed([]); setFlags([]); setMineLost(false); setFeedback('New field ready.'); }} testId="button-new-minefield">New field</PanelButton>}</div>
        </div>;
      case 'lights-out':
        return <div className="mini-game-content"><ScoreLine>Lights remaining <b>{lights.filter(Boolean).length}</b></ScoreLine>
          <div className="lights-grid">{lights.map((on, index) => <button key={index} className={`light-cell ${on ? 'on' : ''}`} onClick={() => { const next = flipLights(lights, index); setLights(next); if (!next.some(Boolean)) { setPoints((value) => value + 1); setFeedback('All lights out. You solved it.'); } }} aria-label={`Toggle light ${index + 1}`} data-testid={`button-light-${index}`}/>)}</div>
          {!lights.some(Boolean) && <PanelButton onClick={() => setLights(newLightsBoard())} testId="button-new-lights">New board</PanelButton>}
        </div>;
      case 'simon-says':
        return <div className="mini-game-content"><ScoreLine>Round <b>{points + 1}</b></ScoreLine>
          <div className="simon-grid">{COLORS.map((color, index) => <button key={color.name} className={`simon-pad ${simonLit === index ? 'lit' : ''}`} style={{ backgroundColor: color.value }} onClick={() => clickSimon(index)} aria-label={`${color.name} pad`} data-testid={`button-simon-${color.name}`}/>)}</div>
          {!points && !simonShow && !simonInput.length && <PanelButton onClick={() => { setFeedback('Watch the colors, then repeat them.'); setSimonShow(true); }} testId="button-start-simon">Show pattern</PanelButton>}
        </div>;
      case 'connect-four': {
        const winner = connectWinner(connect);
        return <div className="mini-game-content"><ScoreLine>{winner === 1 ? 'Coral wins!' : winner === 2 ? 'Mint wins!' : winner === 3 ? 'It’s a draw.' : `Player ${connectTurn}'s turn`}</ScoreLine>
          <div className="connect-board">{Array.from({ length: 7 }, (_, col) => <button key={col} className="connect-drop" onClick={() => dropConnect(col)} aria-label={`Drop piece in column ${col + 1}`} data-testid={`button-connect-column-${col}`}>↓</button>)}
            {connect.map((cell, index) => <div key={index} className={`connect-cell ${cell === 1 ? 'coral' : cell === 2 ? 'mint' : ''}`} data-testid={`cell-connect-${index}`}/>)}</div>
          <PanelButton onClick={() => { setConnect(Array(42).fill(0)); setConnectTurn(1); }} testId="button-reset-connect">New match</PanelButton>
        </div>;
      }
      case 'dots-and-boxes':
        return <div className="mini-game-content"><ScoreLine>Coral <b>{boxes.filter((value) => value === 1).length}</b> <span>·</span> Mint <b>{boxes.filter((value) => value === 2).length}</b> <span>·</span> Player {dotsTurn}'s turn</ScoreLine>
          <div className="dots-board">{Array.from({ length: 4 }, (_, row) => <div className="dots-row" key={row}>
            {Array.from({ length: 3 }, (_, col) => <Fragment key={col}><span className="dot-node"/><button className={`dot-edge horizontal ${dots.includes(edgeId('h', row, col)) ? 'drawn' : ''}`} onClick={() => drawDotEdge('h', row, col)} aria-label={`Draw horizontal line ${row}-${col}`} data-testid={`button-dot-h-${row}-${col}`}/></Fragment>)}<span className="dot-node"/>
            {row < 3 && <div className="dots-row vertical-row">{Array.from({ length: 4 }, (_, col) => <Fragment key={col}><button className={`dot-edge vertical ${dots.includes(edgeId('v', row, col)) ? 'drawn' : ''}`} onClick={() => drawDotEdge('v', row, col)} aria-label={`Draw vertical line ${row}-${col}`} data-testid={`button-dot-v-${row}-${col}`}/>{col < 3 && <span className={`box-fill ${boxes[row * 3 + col] === 1 ? 'coral' : boxes[row * 3 + col] === 2 ? 'mint' : ''}`}/>}</Fragment>)}</div>}
          </div>)}</div><PanelButton onClick={() => { setDots([]); setBoxes(Array(9).fill(0)); setDotsTurn(1); }} testId="button-reset-dots">New match</PanelButton>
        </div>;
      case 'pong':
        return <div className="mini-game-content"><ScoreLine>Returns <b>{pongScore}</b> {pongLost && <span>· Round over</span>}</ScoreLine>
          <div className="pong-court" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setPongPaddle(Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100))); }} data-testid="board-pong">
            <span className="pong-ball" style={{ left: `${pongBall.x}%`, top: `${pongBall.y}%` }}/><span className="pong-paddle" style={{ left: `${pongPaddle}%` }}/>
          </div><div className="mini-choice-row"><PanelButton onClick={() => setPongPaddle((value) => Math.max(10, value - 10))} testId="button-pong-left"><ArrowLeft size={17}/></PanelButton><PanelButton onClick={() => setPongPaddle((value) => Math.min(90, value + 10))} testId="button-pong-right"><ArrowRight size={17}/></PanelButton></div>
          {!running && <StartButton onClick={() => { setPongBall({ x: 50, y: 40, vx: 1.3, vy: 1.15 }); setPongScore(0); setPongLost(false); setRunning(true); }} ended={pongLost} />}
        </div>;
      case 'breakout':
        return <div className="mini-game-content"><ScoreLine>Bricks <b>{brickScore}</b> <span>·</span> Left <b>{bricks.filter(Boolean).length}</b></ScoreLine>
          <div className="breakout-court" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setBrickPaddle(Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100))); }} data-testid="board-breakout">
            <div className="brick-row">{bricks.map((alive, index) => <span key={index} className={`brick ${alive ? '' : 'broken'}`}/>)}</div><span className="breakout-ball" style={{ left: `${brickBall.x}%`, top: `${brickBall.y}%` }}/><span className="pong-paddle" style={{ left: `${brickPaddle}%` }}/>
          </div><div className="mini-choice-row"><PanelButton onClick={() => setBrickPaddle((value) => Math.max(10, value - 10))} testId="button-breakout-left"><ArrowLeft size={17}/></PanelButton><PanelButton onClick={() => setBrickPaddle((value) => Math.min(90, value + 10))} testId="button-breakout-right"><ArrowRight size={17}/></PanelButton></div>
          {!running && <StartButton onClick={() => { setBricks(Array(18).fill(true)); setBrickBall({ x: 50, y: 72, vx: 1.2, vy: -1.3 }); setBrickScore(0); setBrickLost(false); setRunning(true); }} ended={brickLost} />}
        </div>;
      case 'flappy-flyer':
        return <div className="mini-game-content"><ScoreLine>Gates passed <b>{points}</b> {flyLost && <span>· Flight over</span>}</ScoreLine>
          <button className="flappy-court" onClick={() => { if (running) setFlyVelocity(-7); }} data-testid="board-flappy">
            <span className="fly-gate" style={{ left: `${obstacleX}%` }}><i style={{ top: 0, height: `${gapCenter - 19}%` }}/><i style={{ bottom: 0, height: `${100 - gapCenter - 19}%` }}/></span><span className="fly-bird" style={{ top: `${flyY}%` }}/>
          </button><p className="mini-prompt">Tap, click, or press space to flap.</p>
          {!running && <StartButton onClick={() => { setFlyY(50); setFlyVelocity(0); setObstacleX(95); setGapCenter(50); setPoints(0); setFlyLost(false); setRunning(true); }} ended={flyLost} />}
        </div>;
      case 'typing-sprint':
        return <div className="mini-game-content"><ScoreLine>Time <b>{seconds}s</b> <span>·</span> Characters <b>{typingText.length}</b></ScoreLine>
          <p className="typing-prompt">{typingWords}</p>
          {running ? <textarea value={typingText} onChange={(event) => setTypingText(event.target.value)} autoFocus aria-label="Type the sentence" data-testid="input-typing-sprint"/> : <StartButton onClick={startTimedGame} ended={seconds === 0} />}
          {seconds === 0 && <p className="mini-prompt">Sprint complete — {typingText.trim().split(/\s+/).filter(Boolean).length} words typed.</p>}
        </div>;
      case 'quick-math':
        return <div className="mini-game-content"><ScoreLine>Time <b>{seconds}s</b> <span>·</span> Correct <b>{points}</b></ScoreLine>
          <div className="math-equation">{mathNumbers[0]} + {mathNumbers[1]} = ?</div>
          {running ? <div className="mini-inline-form"><input type="number" value={mathAnswer} onChange={(event) => setMathAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitMath(); }} aria-label="Math answer" data-testid="input-math-answer"/><PanelButton onClick={submitMath} testId="button-submit-math">Go</PanelButton></div> : <StartButton onClick={startTimedGame} ended={seconds === 0} />}
        </div>;
      case 'color-match':
        return <div className="mini-game-content"><ScoreLine>Score <b>{points}</b></ScoreLine><p className="mini-prompt">Does the word match its ink color?</p>
          <div className="color-word" style={{ color: colorRound.ink.value }}>{colorRound.word.name.toUpperCase()}</div>
          <div className="mini-choice-row"><PanelButton onClick={() => answerColor(true)} testId="button-color-match">Match</PanelButton><PanelButton onClick={() => answerColor(false)} testId="button-color-mismatch">No match</PanelButton></div>
        </div>;
      case 'odd-one-out':
        return <div className="mini-game-content"><ScoreLine>Score <b>{points}</b></ScoreLine><p className="mini-prompt">Tap the one shape that doesn’t belong.</p>
          <div className="odd-grid">{oddRound.shapes.map((shape, index) => <PanelButton key={index} onClick={() => answerOdd(index)} testId={`button-odd-${index}`} className="odd-shape">{shape}</PanelButton>)}</div>
        </div>;
      default:
        return <div className="mini-game-content"><p>Choose a game to play.</p></div>;
    }
  };

  return <div className="extra-game-panel" data-testid={`panel-extra-${game.id}`}>
    <div className="mini-feedback" aria-live="polite" data-testid={`status-extra-${game.id}`}>{feedback || gameHint(game.id, running, seconds)}</div>
    {content()}
  </div>;
}

function StartButton({ onClick, ended = false }: { onClick: () => void; ended?: boolean }) {
  return <PanelButton onClick={onClick} testId="button-start-extra-game">{ended ? 'Play again' : 'Start game'}</PanelButton>;
}

function chooseHigherLower(direction: 'higher' | 'lower', current: number, setCard: Dispatch<SetStateAction<number>>, setPoints: Dispatch<SetStateAction<number>>, setFeedback: Dispatch<SetStateAction<string>>) {
  const next = 1 + randomInt(13);
  const correct = direction === 'higher' ? next > current : next < current;
  setCard(next);
  setPoints((value) => correct ? value + 1 : 0);
  setFeedback(correct ? 'Good call. Keep the streak alive.' : 'Streak ended. Make the next call.');
}

function createColorRound() {
  const word = COLORS[randomInt(COLORS.length)];
  const ink = Math.random() < 0.5 ? word : COLORS[(COLORS.indexOf(word) + 1 + randomInt(COLORS.length - 1)) % COLORS.length];
  return { word, ink, matches: word.name === ink.name };
}

function createOddRound() {
  const shapes = ['●', '▲', '■', '◆'];
  const main = shapes[randomInt(shapes.length)];
  const odd = shapes[(shapes.indexOf(main) + 1 + randomInt(shapes.length - 1)) % shapes.length];
  const oddIndex = randomInt(6);
  return { shapes: Array.from({ length: 6 }, (_, index) => index === oddIndex ? odd : main), oddIndex };
}

function gameHint(id: string, running: boolean, seconds: number) {
  if (id === 'reaction-tap') return running ? `Tap as many times as you can. ${seconds} seconds left.` : 'Ready, set, tap.';
  if (id === 'mole-pop') return running ? 'Catch the dot before it moves.' : 'A quick little whack-a-mole round.';
  if (id === 'simon-says') return 'Watch the color sequence and repeat it.';
  if (id === 'connect-four') return 'Take turns and line up four pieces.';
  if (id === 'dots-and-boxes') return 'Draw edges to complete a box. Claim the most.';
  if (id === 'pong') return 'Keep the ball in play with your paddle.';
  if (id === 'breakout') return 'Clear the bricks without losing the ball.';
  if (id === 'flappy-flyer') return 'Fly through the gap without hitting a gate.';
  if (id === 'typing-sprint') return running ? `${seconds} seconds left. Type the sentence above.` : 'Type as many words as you can in 30 seconds.';
  if (id === 'quick-math') return running ? `${seconds} seconds left. Solve as many as you can.` : 'A quick round of addition.';
  if (id === 'minesweeper') return 'Reveal every safe square. Right-click to flag a mine.';
  if (id === 'lights-out') return 'Turn off every light. Each tap flips its neighbors too.';
  if (id === 'hangman') return 'Guess the hidden word before six misses.';
  if (id === 'word-scramble') return 'Unscramble the letters to find the word.';
  if (id === 'number-guess') return 'Find the secret number in as few guesses as you can.';
  if (id === 'color-match') return 'Look at the word and the ink color.';
  if (id === 'odd-one-out') return 'Find the shape that is different.';
  if (id === 'higher-lower') return 'Guess whether the next card is higher or lower.';
  if (id === 'coin-toss') return 'Pick heads or tails before the flip.';
  return 'Choose a move and see who wins this round.';
}

export default function ExtraGameModal({ game, onClose }: { game: ExtraGameInfo; onClose: () => void }) {
  const [round, setRound] = useState(0);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);

  return <div className="game-overlay" data-testid="dialog-game" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="game-modal extra-game-modal" role="dialog" aria-modal="true" aria-label={`${game.name} game`}>
      <header className="modal-head">
        <div className="modal-title-group"><div className="art-icon extra-modal-icon"><Gamepad2 size={20}/></div>
          <div><h2 data-testid={`title-game-${game.id}`}>{game.name}</h2><p>Free to play · right here in your browser</p></div>
        </div>
        <div className="extra-modal-actions"><button className="icon-button" onClick={() => setRound((value) => value + 1)} aria-label="Reset game" data-testid={`button-reset-${game.id}`}><RotateCcw size={16}/></button><button className="icon-button" onClick={onClose} aria-label="Close game" data-testid="button-close-game"><X size={19}/></button></div>
      </header>
      <div className="modal-body">
        <GamePanel key={`${game.id}-${round}`} game={game}/>
      </div>
    </section>
  </div>;
}
