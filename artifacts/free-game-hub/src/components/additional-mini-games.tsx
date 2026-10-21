import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

type MiniGame = { id: string; name: string };
const COLORS = ['#eb7659', '#e5c34e', '#67a789', '#6c99bd', '#a47db3'];
const LETTER_WORDS = ['PLANET', 'PUZZLE', 'GARDEN'];
const randomInt = (max: number) => Math.floor(Math.random() * max);
const makeGrid = (size: number, max: number) => Array.from({ length: size }, () => randomInt(max));
const makeLetterRack = (word: string) => shuffle(word.split('').map((letter, index) => letter.charCodeAt(0) + index * 256));
const shuffle = (items: number[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function AdditionalMiniGame({ game }: { game: MiniGame }) {
  switch (game.id) {
    case 'hexa-merge': return <HexaMerge/>;
    case 'color-cascade': return <ColorCascade/>;
    case 'pattern-recall': return <PatternGame title="Pattern Recall"/>;
    case 'simon-sequence': return <PatternGame title="Simon Sequence"/>;
    case 'maze-dash': return <MazeDash/>;
    case 'word-builder': return <WordBuilder/>;
    case 'math-blitz': return <MathBlitz/>;
    case 'paper-plane-flight': return <PaperPlane/>;
    case 'balloon-buster': return <BalloonBuster/>;
    case 'stack-tower': return <StackTower/>;
    case 'gravity-flip': return <GravityFlip/>;
    case 'nim': return <NimGame/>;
    case 'mastermind': return <Mastermind/>;
    case 'lights-circuit': return <LightsCircuit/>;
    case 'number-sequence': return <NumberSequence/>;
    case 'odd-shape': return <OddShape/>;
    case 'jigsaw-shuffle': return <JigsawShuffle/>;
    case 'bubble-shooter': return <BubbleShooter/>;
    case 'dino-run': return <DinoRun/>;
    case 'snowboard-slalom': return <SnowboardSlalom/>;
    case 'fishing-frenzy': return <FishingFrenzy/>;
    case 'pinball': return <Pinball/>;
    case 'orbital-dodger': return <OrbitalDodger/>;
    case 'fruit-catcher': return <FruitCatcher/>;
    default: return <div className="exp-score">Choose a game from the catalog to play.</div>;
  }
}

function HexaMerge() {
  const [tiles, setTiles] = useState(() => makeGrid(25, 4).map((value) => value + 1));
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Select two neighboring tiles with the same number.');
  const tap = (index: number) => {
    if (selected === null) { setSelected(index); return; }
    const adjacent = Math.abs(Math.floor(index / 5) - Math.floor(selected / 5)) + Math.abs(index % 5 - selected % 5) === 1;
    if (selected === index) { setSelected(null); return; }
    if (adjacent && tiles[index] === tiles[selected]) {
      const next = [...tiles];
      next[index] = Math.min(9, next[index] + 1);
      next[selected] = randomInt(4) + 1;
      setTiles(next);
      setScore((value) => value + next[index] * 2);
      setMessage(`Merged into ${next[index]}. Keep going!`);
      setSelected(null);
    } else {
      setSelected(index);
      setMessage('Pick a neighboring tile with the same number.');
    }
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="hexa-board">{tiles.map((tile, index) => <button key={index} className={`hexa-tile value-${tile} ${selected === index ? 'selected' : ''}`} onClick={() => tap(index)} data-testid={`hexa-tile-${index}`}>{tile}</button>)}</div>
    <div className="exp-score">Merge score <b>{score}</b></div>
  </div>;
}

function ColorCascade() {
  const [tiles, setTiles] = useState(() => makeGrid(36, 5));
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Tap a group of two or more connected matching colors.');
  const clearGroup = (start: number) => {
    const color = tiles[start];
    const queue = [start];
    const group = new Set<number>(queue);
    while (queue.length) {
      const index = queue.pop()!;
      const row = Math.floor(index / 6); const col = index % 6;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const r = row + dr; const c = col + dc; const next = r * 6 + c;
        if (r >= 0 && r < 6 && c >= 0 && c < 6 && !group.has(next) && tiles[next] === color) {
          group.add(next); queue.push(next);
        }
      }
    }
    if (group.size < 2) { setMessage('Try a larger matching group.'); return; }
    const next = [...tiles];
    group.forEach((index) => { next[index] = -1; });
    for (let col = 0; col < 6; col++) {
      const remaining = Array.from({ length: 6 }, (_, row) => next[row * 6 + col]).filter((value) => value >= 0);
      const fillers = Array.from({ length: 6 - remaining.length }, () => randomInt(5));
      const column = [...fillers, ...remaining];
      column.forEach((value, row) => { next[row * 6 + col] = value; });
    }
    setTiles(next); setScore((value) => value + group.size * group.size);
    setMessage(`${group.size} tiles cleared.`);
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="cascade-board">{tiles.map((tile, index) => <button key={index} className="cascade-tile" style={{ background: COLORS[tile] }} onClick={() => clearGroup(index)} aria-label={`Color tile ${index + 1}`} data-testid={`cascade-tile-${index}`}/>)}</div>
    <div className="exp-score">Cascade score <b>{score}</b></div>
  </div>;
}

function PatternGame({ title }: { title: string }) {
  const total = title === 'Simon Sequence' ? 4 : 9;
  const [pattern, setPattern] = useState<number[]>([]);
  const [phase, setPhase] = useState<'ready' | 'show' | 'input'>('ready');
  const [lit, setLit] = useState<number | null>(null);
  const [inputCount, setInputCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('Press start and remember the flashing pattern.');
  useEffect(() => {
    if (phase !== 'show') return;
    let index = 0;
    setLit(pattern[0] ?? null);
    const timer = window.setInterval(() => {
      index++;
      if (index >= pattern.length) {
        setLit(null); setPhase('input'); window.clearInterval(timer);
      } else setLit(pattern[index]);
    }, 650);
    return () => window.clearInterval(timer);
  }, [phase, pattern]);
  const start = () => {
    const next = Array.from({ length: Math.min(2 + level, total) }, () => randomInt(total));
    setPattern(next); setInputCount(0); setMessage(`Level ${level}: watch carefully.`); setPhase('show');
  };
  const tap = (index: number) => {
    if (phase !== 'input') return;
    if (pattern[inputCount] !== index) {
      setMessage(`Not quite. You reached level ${level}.`); setLevel(1); setPhase('ready'); setLit(null); return;
    }
    const nextCount = inputCount + 1;
    if (nextCount === pattern.length) {
      setLevel((value) => value + 1); setMessage('Perfect! Start the next level.'); setPhase('ready'); setLit(null);
    } else setInputCount(nextCount);
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className={`pattern-board ${title === 'Simon Sequence' ? 'simon-sequence' : ''}`}>{Array.from({ length: total }, (_, index) => <button key={index} className={`pattern-cell pattern-${index % 5} ${lit === index ? 'lit' : ''}`} onClick={() => tap(index)} aria-label={`Pattern tile ${index + 1}`} data-testid={`${title.toLowerCase().replace(' ', '-')}-tile-${index}`}/>)}</div>
    <div className="exp-score">Level <b>{level}</b></div>
    {phase === 'ready' && <button className="mini-button" onClick={start} data-testid={`${title.toLowerCase().replace(' ', '-')}-start`}>{level === 1 ? 'Start' : 'Next pattern'}</button>}
  </div>;
}

const MAZE_WALLS = new Set(['0-3', '1-0', '2-1', '2-4', '3-1', '4-2', '4-5']);
function MazeDash() {
  const [position, setPosition] = useState([0, 0]);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('Use the arrows to find the gold exit.');
  const move = (dr: number, dc: number) => {
    const row = position[0] + dr; const col = position[1] + dc;
    if (row < 0 || row > 5 || col < 0 || col > 5 || MAZE_WALLS.has(`${row}-${col}`)) return;
    setPosition([row, col]); setMoves((value) => value + 1);
    if (row === 5 && col === 5) setMessage('Exit found! Nice route.');
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="maze-dash-board">{Array.from({ length: 36 }, (_, index) => {
      const row = Math.floor(index / 6); const col = index % 6;
      const wall = MAZE_WALLS.has(`${row}-${col}`);
      return <span key={index} className={`maze-dash-cell ${wall ? 'wall' : ''} ${row === position[0] && col === position[1] ? 'player' : ''} ${row === 5 && col === 5 ? 'exit' : ''}`}>{row === position[0] && col === position[1] ? '●' : row === 5 && col === 5 ? '★' : ''}</span>;
    })}</div>
    <div className="exp-controls">
      <button className="mini-button" onClick={() => move(-1, 0)} aria-label="Move up"><ArrowUp size={17}/></button>
      <button className="mini-button" onClick={() => move(0, -1)} aria-label="Move left"><ArrowLeft size={17}/></button>
      <button className="mini-button" onClick={() => move(1, 0)} aria-label="Move down"><ArrowDown size={17}/></button>
      <button className="mini-button" onClick={() => move(0, 1)} aria-label="Move right"><ArrowRight size={17}/></button>
    </div>
    <div className="exp-score">Steps <b>{moves}</b></div>
  </div>;
}

function WordBuilder() {
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [message, setMessage] = useState('Use each letter tile to spell the word.');
  const [letters, setLetters] = useState(() => makeLetterRack(LETTER_WORDS[0]));
  const target = LETTER_WORDS[round % LETTER_WORDS.length];
  const letterAt = (value: number) => String.fromCharCode(value % 256);
  const check = () => {
    const word = chosen.map((index) => letterAt(letters[index])).join('');
    if (word === target) {
      setMessage(`${word} is correct!`);
      const nextRound = round + 1;
      setRound(nextRound);
      setLetters(makeLetterRack(LETTER_WORDS[nextRound % LETTER_WORDS.length]));
      setChosen([]);
    }
    else setMessage('That word does not match. Try rearranging the tiles.');
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p><div className="exp-score">Target <b>{target}</b></div>
    <div className="word-rack">{letters.map((letter, index) => <button key={letter} className="mini-button" disabled={chosen.includes(index)} onClick={() => setChosen((value) => [...value, index])} data-testid={`word-rack-${index}`}>{letterAt(letter)}</button>)}</div>
    <div className="word-answer">{chosen.map((index) => letterAt(letters[index])).join(' ') || 'Tap letters to build'}</div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setChosen([])}>Clear</button><button className="mini-button" onClick={check}>Check word</button></div>
  </div>;
}

function MathBlitz() {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(() => randomInt(9) + 2);
  const [message, setMessage] = useState('Choose the correct answer.');
  const a = (round * 3 + 2) % 12 + 2;
  const b = (round * 5 + 3) % 9 + 1;
  const answer = a + b;
  const choices = [answer, answer + 2, answer - 1].sort((x, y) => ((round + x) % 3) - ((round + y) % 3));
  const choose = (value: number) => {
    if (value === answer) { setScore((current) => current + 1); setMessage('Correct! Next one.'); }
    else setMessage(`Not quite — ${a} + ${b} = ${answer}.`);
    setRound((current) => current + 1);
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p><div className="math-blitz-equation">{a} + {b} = ?</div>
    <div className="exp-controls">{choices.map((value, index) => <button key={`${value}-${index}`} className="mini-button" onClick={() => choose(value)} data-testid={`math-answer-${index}`}>{value}</button>)}</div>
    <div className="exp-score">Correct answers <b>{score}</b></div>
  </div>;
}

function PaperPlane() {
  const [power, setPower] = useState(65);
  const [angle, setAngle] = useState(38);
  const [distance, setDistance] = useState(0);
  const [best, setBest] = useState(0);
  const launch = () => {
    const result = Math.round(power * Math.sin(angle * Math.PI / 180) * 1.65 + Math.max(0, 36 - Math.abs(angle - 38)) * .8);
    setDistance(result); setBest((value) => Math.max(value, result));
  };
  return <div className="exp-game">
    <p className="exp-hint">Adjust the throw, then launch the plane.</p>
    <div className="plane-sky"><span className="paper-plane" style={{ left: `${Math.min(82, distance * 1.25)}%`, transform: `rotate(${-angle / 4}deg)` }}>➤</span><span className="plane-ground"/></div>
    <label className="range-control">Power {power}<input type="range" min="20" max="100" value={power} onChange={(event) => setPower(Number(event.target.value))}/></label>
    <label className="range-control">Angle {angle}°<input type="range" min="15" max="70" value={angle} onChange={(event) => setAngle(Number(event.target.value))}/></label>
    <button className="mini-button" onClick={launch}>Launch plane</button>
    <div className="exp-score">Distance <b>{distance} m</b> · Best <b>{best} m</b></div>
  </div>;
}

function BalloonBuster() {
  const [balloons, setBalloons] = useState<number[]>([]);
  const [time, setTime] = useState(20);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) { setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const start = () => { setBalloons(makeGrid(18, 5)); setTime(20); setScore(0); setRunning(true); };
  return <div className="exp-game">
    <p className="exp-hint">{running ? 'Pop as many balloons as you can before time runs out.' : time === 0 ? 'Round over. Start another burst!' : 'Start the round and pop the balloons.'}</p>
    <div className="balloon-field">{balloons.map((color, index) => <button key={index} className="balloon" style={{ background: COLORS[color] }} onClick={() => { if (!running) return; setBalloons((current) => current.filter((_, cell) => cell !== index)); setScore((value) => value + 1); }} aria-label="Pop balloon" data-testid={`balloon-${index}`}/>)}</div>
    <div className="exp-score">Time <b>{time}s</b> · Popped <b>{score}</b></div>
    {!running && <button className="mini-button" onClick={start}>Start round</button>}
  </div>;
}

function StackTower() {
  const [position, setPosition] = useState(3);
  const [direction, setDirection] = useState(1);
  const [width, setWidth] = useState(7);
  const [blocks, setBlocks] = useState<number[]>([3]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('Drop the block when it lines up with the tower.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setPosition((value) => {
      const next = value + direction;
      if (next <= 0 || next >= 10) setDirection((current) => -current);
      return Math.max(0, Math.min(10, next));
    }), 100);
    return () => window.clearInterval(timer);
  }, [running, direction]);
  const drop = () => {
    if (!running) { setRunning(true); setMessage(''); return; }
    const overlap = width - Math.abs(position - (blocks.at(-1) ?? 3));
    if (overlap <= 0) { setRunning(false); setMessage('Tower toppled. Start again!'); return; }
    setWidth(overlap); setBlocks((current) => [...current, position]); setMessage('Nice stack. Drop the next block.');
  };
  const reset = () => { setPosition(3); setDirection(1); setWidth(7); setBlocks([3]); setRunning(false); setMessage('Drop the block when it lines up with the tower.'); };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="tower-stage">{blocks.slice(-7).map((block, index) => <span key={`${block}-${index}`} className="tower-block" style={{ width: `${width * 8}%`, left: `${block * 8}%`, bottom: `${index * 25}px`}}/>)}{running && <span className="tower-block moving" style={{ width: `${width * 8}%`, left: `${position * 8}%`}}/>}</div>
    <div className="exp-score">Blocks <b>{blocks.length}</b></div>
    <div className="exp-controls"><button className="mini-button" onClick={drop}>{running ? 'Drop block' : 'Start tower'}</button><button className="mini-button" onClick={reset}>Reset</button></div>
  </div>;
}

function GravityFlip() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [gravity, setGravity] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Flip between the floor and ceiling to dodge.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTick((value) => {
        const next = value + 1;
        const hazardSide = next % 2;
        if (next % 3 === 0) {
          if (gravity === hazardSide) { setRunning(false); setMessage('Bonk! Flip at the next obstacle.'); }
          else setScore((current) => current + 1);
        }
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [running, gravity]);
  const start = () => { setTick(0); setScore(0); setGravity(0); setMessage(''); setRunning(true); };
  return <div className="exp-game">
    <p className="exp-hint">{message || 'Tap Flip or press Space to change gravity.'}</p>
    <div className={`gravity-lane ${gravity ? 'ceiling' : ''}`}><span className="gravity-runner">●</span><span className={`gravity-hazard side-${tick % 2}`}>◆</span></div>
    <div className="exp-score">Obstacles passed <b>{score}</b></div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setGravity((value) => 1 - value)}>Flip gravity</button>{!running && <button className="mini-button" onClick={start}>{tick ? 'Try again' : 'Start run'}</button>}</div>
  </div>;
}

function NimGame() {
  const [piles, setPiles] = useState([3, 4, 5]);
  const [message, setMessage] = useState('Choose a pile, then take 1–3 tokens.');
  const [selected, setSelected] = useState(0);
  const [ended, setEnded] = useState(false);
  const take = (count: number) => {
    if (ended || count > piles[selected] || count < 1) return;
    const next = [...piles]; next[selected] -= count;
    if (next.every((value) => value === 0)) { setPiles(next); setMessage('You took the last token. You win!'); setEnded(true); return; }
    let xor = next.reduce((sum, value) => sum ^ value, 0);
    let aiPile = next.findIndex((value) => value > 0);
    let aiTake = 1;
    if (xor) {
      const target = next.findIndex((value) => value && (value ^ xor) < value);
      if (target >= 0) { aiPile = target; aiTake = next[target] - (next[target] ^ xor); }
    }
    next[aiPile] -= aiTake;
    setPiles(next);
    if (next.every((value) => value === 0)) { setMessage(`Computer took ${aiTake}. Computer wins.`); setEnded(true); }
    else setMessage(`Computer took ${aiTake} from pile ${aiPile + 1}. Your turn.`);
    setSelected(aiPile);
  };
  const reset = () => { setPiles([3, 4, 5]); setMessage('Choose a pile, then take 1–3 tokens.'); setSelected(0); setEnded(false); };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="nim-piles">{piles.map((pile, index) => <button key={index} className={`nim-pile ${selected === index ? 'selected' : ''}`} onClick={() => setSelected(index)} aria-label={`Select pile ${index + 1}`} data-testid={`nim-pile-${index}`}>{Array.from({ length: pile }, (_, token) => <i key={token}/>)}</button>)}</div>
    <div className="exp-controls">{[1, 2, 3].map((count) => <button key={count} className="mini-button" onClick={() => take(count)} data-testid={`nim-take-${count}`}>Take {count}</button>)}<button className="mini-button" onClick={reset}>New game</button></div>
  </div>;
}

function Mastermind() {
  const [secret, setSecret] = useState(() => makeGrid(4, 5));
  const [guess, setGuess] = useState<number[]>([0, 1, 2, 3]);
  const [attempts, setAttempts] = useState<{ guess: number[]; exact: number; close: number }[]>([]);
  const [message, setMessage] = useState('Set four colors, then check your code.');
  const solved = attempts.some((attempt) => attempt.exact === 4);
  const submit = () => {
    const exact = guess.filter((value, index) => value === secret[index]).length;
    let remainingSecret = secret.filter((value, index) => value !== guess[index]);
    let close = 0;
    guess.forEach((value, index) => { if (value !== secret[index]) { const found = remainingSecret.indexOf(value); if (found >= 0) { close++; remainingSecret.splice(found, 1); } } });
    const next = [...attempts, { guess, exact, close }];
    setAttempts(next); setGuess([0, 1, 2, 3]);
    setMessage(exact === 4 ? 'Code cracked!' : next.length >= 8 ? 'Out of tries. Start a new code.' : `${exact} exact · ${close} right color, wrong spot.`);
  };
  const reset = () => { setSecret(makeGrid(4, 5)); setGuess([0, 1, 2, 3]); setAttempts([]); setMessage('Set four colors, then check your code.'); };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="mastermind-guess">{guess.map((color, index) => <button key={index} className="code-peg" style={{ background: COLORS[color] }} onClick={() => setGuess((current) => current.map((value, i) => i === index ? (value + 1) % 5 : value))} aria-label={`Change color peg ${index + 1}`}/>)}</div>
    <div className="exp-controls"><button className="mini-button" onClick={submit} disabled={solved || attempts.length >= 8}>Check code</button><button className="mini-button" onClick={reset}>New code</button></div>
    <div className="mastermind-history">{attempts.map((attempt, index) => <div key={index}>{attempt.guess.map((color, cell) => <i className="code-peg small" key={cell} style={{ background: COLORS[color] }}/>) }<span>{attempt.exact} exact · {attempt.close} close</span></div>)}</div>
    <p className="exp-hint">Colors may repeat. You have eight guesses.</p>
  </div>;
}

type CircuitTile = 'end' | 'line' | 'corner';
const CIRCUIT_TYPES: CircuitTile[] = ['end', 'line', 'corner', 'line', 'corner', 'line', 'corner', 'line', 'end'];
const CIRCUIT_START = [0, 0, 0, 0, 0, 0, 0, 0, 0];
function circuitEdges(type: CircuitTile, rotation: number) {
  const base = type === 'end' ? [0] : type === 'line' ? [0, 2] : [0, 1];
  return base.map((edge) => (edge + rotation) % 4);
}
function circuitConnected(rotations: number[]) {
  const queue = [0]; const seen = new Set(queue);
  while (queue.length) {
    const cell = queue.shift()!;
    if (cell === 8) return true;
    const row = Math.floor(cell / 3); const col = cell % 3;
    for (const edge of circuitEdges(CIRCUIT_TYPES[cell], rotations[cell])) {
      const dr = [-1, 0, 1, 0][edge]; const dc = [0, 1, 0, -1][edge];
      const r = row + dr; const c = col + dc; const next = r * 3 + c; const opposite = (edge + 2) % 4;
      if (r >= 0 && r < 3 && c >= 0 && c < 3 && circuitEdges(CIRCUIT_TYPES[next], rotations[next]).includes(opposite) && !seen.has(next)) {
        seen.add(next); queue.push(next);
      }
    }
  }
  return false;
}
function LightsCircuit() {
  const [rotations, setRotations] = useState(CIRCUIT_START);
  const [message, setMessage] = useState('Rotate the wires to connect the battery to the lamp.');
  const connected = circuitConnected(rotations);
  const rotate = (index: number) => {
    const next = [...rotations]; next[index] = (next[index] + 1) % 4; setRotations(next);
    if (circuitConnected(next)) setMessage('Circuit connected! The lamp is on.');
  };
  const glyph = (index: number, rotation: number) => {
    const type = CIRCUIT_TYPES[index];
    if (type === 'end') return ['↑', '→', '↓', '←'][rotation];
    if (type === 'line') return rotation % 2 ? '━' : '┃';
    return ['└', '┌', '┐', '┘'][rotation];
  };
  return <div className="exp-game">
    <p className="exp-hint">{connected ? 'Circuit connected! The lamp is on.' : message}</p>
    <div className="circuit-board">{rotations.map((rotation, index) => <button key={index} className={`circuit-tile ${connected ? 'powered' : ''}`} onClick={() => rotate(index)} aria-label={`Rotate wire ${index + 1}`} data-testid={`circuit-tile-${index}`}>{index === 0 ? '🔋' : index === 8 ? connected ? '💡' : '✧' : glyph(index, rotation)}</button>)}</div>
  </div>;
}

function NumberSequence() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Choose the missing number.');
  const step = round % 3 + 2;
  const start = round + 1;
  const missing = start + step * 3;
  const sequence = [start, start + step, start + step * 2, '?', start + step * 4];
  const select = (value: number) => {
    if (value === missing) { setScore((value) => value + 1); setMessage('That is the pattern!'); }
    else setMessage(`The sequence increases by ${step}.`);
    setRound((value) => value + 1);
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p><div className="number-sequence">{sequence.map((value, index) => <span key={index}>{value}</span>)}</div>
    <div className="exp-controls">{[missing, missing + step, Math.max(1, missing - 1)].map((value, index) => <button key={`${value}-${index}`} className="mini-button" onClick={() => select(value)}>{value}</button>)}</div>
    <div className="exp-score">Solved <b>{score}</b></div>
  </div>;
}

function OddShape() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const odd = (round * 7 + 4) % 9;
  const shapes = ['●', '●', '●', '●', '●', '●', '●', '●', '●'];
  shapes[odd] = '◆';
  const choose = (index: number) => {
    if (index === odd) { setScore((value) => value + 1); }
    setRound((value) => value + 1);
  };
  return <div className="exp-game">
    <p className="exp-hint">Tap the shape that is different.</p>
    <div className="odd-shape-board">{shapes.map((shape, index) => <button key={index} className="odd-shape-cell" onClick={() => choose(index)} aria-label={`Shape ${index + 1}`} data-testid={`odd-shape-${index}`}>{shape}</button>)}</div>
    <div className="exp-score">Score <b>{score}</b> · Round <b>{round + 1}</b></div>
  </div>;
}

function JigsawShuffle() {
  const [tiles, setTiles] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 0]));
  const [moves, setMoves] = useState(0);
  const solved = tiles.join(',') === '1,2,3,4,5,6,7,8,0';
  const tap = (index: number) => {
    const blank = tiles.indexOf(0);
    if (Math.abs(Math.floor(index / 3) - Math.floor(blank / 3)) + Math.abs(index % 3 - blank % 3) !== 1) return;
    const next = [...tiles]; [next[index], next[blank]] = [next[blank], next[index]];
    setTiles(next); setMoves((value) => value + 1);
  };
  return <div className="exp-game">
    <p className="exp-hint">{solved ? 'Picture restored!' : 'Slide adjacent tiles into number order.'}</p>
    <div className="jigsaw-board">{tiles.map((tile, index) => <button key={index} className={`jigsaw-tile ${tile === 0 ? 'empty' : ''}`} onClick={() => tap(index)}>{tile || ''}</button>)}</div>
    <div className="exp-score">Moves <b>{moves}</b></div>
    {solved && <button className="mini-button" onClick={() => { setTiles(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 0])); setMoves(0); }}>New puzzle</button>}
  </div>;
}

function BubbleShooter() {
  const [bubbles, setBubbles] = useState(() => [...makeGrid(28, 5), ...Array(14).fill(-1)]);
  const [lane, setLane] = useState(3);
  const [shotColor, setShotColor] = useState(() => randomInt(5));
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Choose a lane, then shoot to connect three matching bubbles.');
  const shoot = () => {
    let row = 0;
    while (row < 6 && bubbles[row * 7 + lane] >= 0) row++;
    if (row >= 6) { setMessage('That lane is full. Pick another lane.'); return; }
    const start = row * 7 + lane;
    const board = [...bubbles];
    board[start] = shotColor;
    const queue = [start]; const group = new Set(queue);
    while (queue.length) {
      const current = queue.pop()!;
      for (const next of [current - 7, current + 7, current - 1, current + 1]) {
        const sameRow = Math.floor(current / 7) === Math.floor(next / 7);
        if (next < 0 || next >= 42 || (Math.abs(current - next) === 1 && !sameRow) || group.has(next) || board[next] !== shotColor) continue;
        group.add(next); queue.push(next);
      }
    }
    if (group.size < 3) setMessage('Bubble placed. Line up another shot to make a group.');
    else {
      group.forEach((index) => { board[index] = -1; });
      setScore((value) => value + group.size * 10);
      setMessage(`${group.size} bubbles popped!`);
    }
    setBubbles(board);
    setShotColor(randomInt(5));
  };
  return <div className="exp-game">
    <p className="exp-hint">{bubbles.every((bubble) => bubble < 0) ? 'Field cleared! Start a fresh bubble wall.' : message}</p>
    <div className="bubble-shooter-board">{bubbles.map((bubble, index) => <span key={index} className={`shooter-bubble ${bubble < 0 ? 'empty' : ''}`} style={{ background: bubble < 0 ? 'transparent' : COLORS[bubble] }} aria-label={`Bubble ${index + 1}`} data-testid={`shooter-bubble-${index}`}/>)}</div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setLane((value) => Math.max(0, value - 1))} aria-label="Aim left"><ArrowLeft size={17}/></button><span className="bubble-cannon" style={{ borderColor: COLORS[shotColor] }}>▲</span><button className="mini-button" onClick={() => setLane((value) => Math.min(6, value + 1))} aria-label="Aim right"><ArrowRight size={17}/></button><button className="mini-button" onClick={shoot}>Shoot</button></div>
    <div className="exp-score">Score <b>{score}</b></div>
    <button className="mini-button" onClick={() => { setBubbles([...makeGrid(28, 5), ...Array(14).fill(-1)]); setLane(3); setShotColor(randomInt(5)); setScore(0); setMessage('Choose a lane, then shoot to connect three matching bubbles.'); }}>New bubble wall</button>
  </div>;
}

function DinoRun() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [jump, setJump] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Start running and jump over the rocks.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTick((value) => {
        const next = value + 1;
        if (next % 4 === 0) {
          if (jump > 0) setScore((current) => current + 1);
          else { setRunning(false); setMessage('Rock! Jump a little later next time.'); }
        } else setScore((current) => current + 1);
        return next;
      });
      setJump((value) => Math.max(0, value - 1));
    }, 500);
    return () => window.clearInterval(timer);
  }, [running, jump]);
  const start = () => { setTick(0); setJump(0); setScore(0); setMessage(''); setRunning(true); };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p><div className="dino-track"><span className={`dino-runner ${jump > 0 ? 'jumping' : ''}`}>🦖</span><span className="dino-rock" style={{ left: `${15 + (tick % 4) * 20}%` }}>◆</span></div>
    <div className="exp-score">Distance <b>{score}</b></div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setJump(2)} disabled={!running}>Jump</button>{!running && <button className="mini-button" onClick={start}>{tick ? 'Run again' : 'Start run'}</button>}</div>
  </div>;
}

function SnowboardSlalom() {
  const [running, setRunning] = useState(false);
  const [lane, setLane] = useState(1);
  const [gate, setGate] = useState(1);
  const [passed, setPassed] = useState(0);
  const [missed, setMissed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setGate((value) => {
        if (lane === value) setPassed((count) => count + 1);
        else setMissed((count) => count + 1);
        const next = randomInt(3);
        if (passed + missed >= 11) setRunning(false);
        return next;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [running, lane, passed, missed]);
  const start = () => { setLane(1); setGate(randomInt(3)); setPassed(0); setMissed(0); setRunning(true); };
  return <div className="exp-game">
    <p className="exp-hint">{running ? 'Move into the open gate before it passes.' : passed + missed ? `Run complete · ${passed} gates · ${missed} misses` : 'Choose a lane and line up with each gate.'}</p>
    <div className="slalom-board">{[0, 1, 2].map((col) => <button key={col} className={`slalom-lane ${lane === col ? 'rider' : ''} ${gate === col ? 'gate' : ''}`} onClick={() => setLane(col)} aria-label={`Choose lane ${col + 1}`}>{lane === col ? '●' : gate === col ? 'Ⅱ' : ''}</button>)}</div>
    <div className="exp-score">Gates <b>{passed}</b> · Misses <b>{missed}</b></div>
    {!running && <button className="mini-button" onClick={start}>Start slalom</button>}
  </div>;
}

function FishingFrenzy() {
  const [running, setRunning] = useState(false);
  const [fish, setFish] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Cast your line when a fish reaches the center.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setFish((value) => (value + 1) % 5), 280);
    return () => window.clearInterval(timer);
  }, [running]);
  const cast = () => {
    if (!running) return;
    if (fish === 2) { setScore((value) => value + 1); setMessage('Fish on! Nice timing.'); }
    else setMessage('No bite. Wait until the fish crosses the middle.');
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="fishing-water">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`fish-lane ${fish === index ? 'fish-here' : ''}`}>{fish === index ? '🐟' : '·'}</span>)}<span className="fishing-hook">⌄</span></div>
    <div className="exp-score">Fish caught <b>{score}</b></div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setRunning(true)}>Cast line</button><button className="mini-button" onClick={cast} disabled={!running}>Reel in</button><button className="mini-button" onClick={() => { setRunning(false); setScore(0); setFish(0); setMessage('Cast your line when a fish reaches the center.'); }}>Reset</button></div>
  </div>;
}

function Pinball() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Launch, then tap the flipper when the ball reaches the bottom.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setStep((value) => {
      const next = value + 1;
      if (next >= 6) { setRunning(false); setMessage('Ball drained. Launch another ball!'); return 0; }
      return next;
    }), 500);
    return () => window.clearInterval(timer);
  }, [running]);
  const flip = () => {
    if (!running) return;
    if (step >= 4) { setScore((value) => value + 100); setStep(0); setMessage('Flipper save! Keep it going.'); }
    else setScore((value) => value + 10);
  };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="pinball-table"><span className="pinball-bumper bumper-one">✦</span><span className="pinball-bumper bumper-two">✦</span><span className="pinball-ball" style={{ top: `${10 + step * 13}%` }}>●</span><span className="pinball-flipper left"/><span className="pinball-flipper right"/></div>
    <div className="exp-score">Score <b>{score}</b></div>
    <div className="exp-controls">{!running ? <button className="mini-button" onClick={() => { setStep(0); setRunning(true); setMessage('Ball in play!'); }}>Launch ball</button> : <><button className="mini-button" onClick={flip}>Left flipper</button><button className="mini-button" onClick={flip}>Right flipper</button></>}</div>
  </div>;
}

function OrbitalDodger() {
  const [running, setRunning] = useState(false);
  const [orbit, setOrbit] = useState(0);
  const [hazard, setHazard] = useState(2);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Switch orbital lanes to avoid the red debris.');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setHazard((current) => {
        const next = (current + 1 + randomInt(2)) % 4;
        if (next === orbit) { setRunning(false); setMessage('Debris hit! Try a different orbit.'); }
        else setScore((value) => value + 1);
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [running, orbit]);
  const start = () => { setOrbit(0); setHazard(2); setScore(0); setMessage(''); setRunning(true); };
  return <div className="exp-game">
    <p className="exp-hint">{message}</p>
    <div className="orbit-board"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-center">✦</div><span className="orbit-player" style={{ transform: `rotate(${orbit * 90}deg) translateY(-88px)` }}>◆</span><span className="orbit-debris" style={{ transform: `rotate(${hazard * 90}deg) translateY(-57px)` }}>●</span></div>
    <div className="exp-score">Ticks survived <b>{score}</b></div>
    <div className="exp-controls"><button className="mini-button" onClick={() => setOrbit((value) => (value + 3) % 4)} disabled={!running}>Orbit left</button><button className="mini-button" onClick={() => setOrbit((value) => (value + 1) % 4)} disabled={!running}>Orbit right</button>{!running && <button className="mini-button" onClick={start}>Start orbit</button>}</div>
  </div>;
}

function FruitCatcher() {
  const [running, setRunning] = useState(false);
  const [fruitLane, setFruitLane] = useState(1);
  const [basketLane, setBasketLane] = useState(1);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [time, setTime] = useState(20);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setFruitLane((lane) => {
        if (lane === basketLane) setScore((value) => value + 1);
        else setMisses((value) => value + 1);
        if (time <= 1) { setRunning(false); setTime(0); }
        return randomInt(5);
      });
      setTime((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, basketLane, time]);
  const start = () => { setRunning(true); setScore(0); setMisses(0); setTime(20); };
  return <div className="exp-game">
    <p className="exp-hint">{running ? 'Move your basket to catch the fruit.' : time === 0 ? 'Round over. Start a new harvest!' : 'Catch as many falling fruits as you can.'}</p>
    <div className="fruit-catcher-lanes">{Array.from({ length: 5 }, (_, index) => <button key={index} className={`fruit-catcher-lane ${basketLane === index ? 'basket' : ''}`} onClick={() => setBasketLane(index)} aria-label={`Move basket to lane ${index + 1}`}>{fruitLane === index ? '●' : ''}{basketLane === index ? <small>▱</small> : null}</button>)}</div>
    <div className="exp-score">Time <b>{time}s</b> · Caught <b>{score}</b> · Missed <b>{misses}</b></div>
    {!running && <button className="mini-button" onClick={start}>Start round</button>}
  </div>;
}
