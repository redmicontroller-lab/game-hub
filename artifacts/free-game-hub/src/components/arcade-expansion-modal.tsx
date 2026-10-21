import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gamepad2, RotateCcw, X } from 'lucide-react';

type ExpansionGame = { id: string; name: string };

const RACE_IDS = new Set(['highway-racer', 'drift-circuit', 'rally-rush', 'turbo-time-trial']);
const THREE_D_IDS = new Set(['maze-explorer-3d', 'tunnel-runner-3d', 'block-stack-3d', 'ball-maze-3d']);
const CAR_WALLS = new Set(['1-0', '1-1', '3-2', '2-4', '4-2']);
const MAZE_MAP = [
  '1111111',
  '1000001',
  '1111101',
  '1000001',
  '1011101',
  '1000001',
  '1111111',
];
const WORD_LIST = ['ROCKET', 'ARCADE', 'GALAXY'];
const WORD_GRID = [
  'R O C K E T',
  'A X B Q L M',
  'G A L A X Y',
  'P N S U V W',
  'A R C A D E',
  'H J K L M N',
].map((row) => row.split(' '));

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function Control({ children, onClick, label, testId }: { children: ReactNode; onClick: () => void; label: string; testId: string }) {
  return <button className="mini-button" onClick={onClick} aria-label={label} data-testid={testId}>{children}</button>;
}

function ExpansionBody({ game }: { game: ExpansionGame }) {
  if (RACE_IDS.has(game.id)) return <RaceGame game={game}/>;
  if (game.id === 'parking-panic') return <ParkingGame/>;
  if (game.id === 'maze-explorer-3d') return <Maze3D/>;
  if (game.id === 'tunnel-runner-3d') return <TunnelRunner3D/>;
  if (game.id === 'block-stack-3d') return <BlockStack3D/>;
  if (game.id === 'ball-maze-3d') return <BallMaze3D/>;
  return <QuickExpansionGame game={game}/>;
}

function RaceGame({ game }: { game: ExpansionGame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [lane, setLane] = useState(1);
  const [traffic, setTraffic] = useState<{ lane: number; depth: number; id: number }[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!running) return;
    let ticks = 0;
    const speed = game.id === 'turbo-time-trial' ? 0.035 : game.id === 'rally-rush' ? 0.024 : 0.03;
    const timer = window.setInterval(() => {
      ticks++;
      setTraffic((current) => {
        const moved = current.map((car) => ({ ...car, depth: car.depth + speed }));
        if (ticks % (game.id === 'turbo-time-trial' ? 14 : 10) === 0) {
          moved.push({ lane: randomInt(3), depth: 0.02, id: ticks });
        }
        if (moved.some((car) => car.lane === lane && car.depth > 0.86 && car.depth < 1.02)) {
          setRunning(false);
          setEnded(true);
        }
        const cleared = moved.some((car) => car.depth >= 1.02);
        if (cleared) setScore((value) => value + 1);
        return moved.filter((car) => car.depth < 1.05);
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [running, lane, game.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!running || !['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) return;
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a' ? -1 : 1;
      setLane((value) => Math.max(0, Math.min(2, value + delta)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const w = canvas.width;
    const h = canvas.height;
    context.clearRect(0, 0, w, h);
    context.fillStyle = game.id === 'rally-rush' ? '#d7e4bd' : '#d8e7ed';
    context.fillRect(0, 0, w, h);
    context.fillStyle = '#98bd8e';
    context.fillRect(0, 105, w, h - 105);
    context.fillStyle = '#4a4c52';
    context.beginPath();
    context.moveTo(255, 92);
    context.lineTo(345, 92);
    context.lineTo(535, h);
    context.lineTo(65, h);
    context.closePath();
    context.fill();
    context.strokeStyle = '#f5edce';
    context.lineWidth = 3;
    for (let divider = 1; divider <= 2; divider++) {
      const topX = 255 + divider * 30;
      const bottomX = 65 + divider * (470 / 3);
      context.setLineDash([15, 13]);
      context.beginPath();
      context.moveTo(topX, 100);
      context.lineTo(bottomX, h);
      context.stroke();
    }
    context.setLineDash([]);
    const drawCar = (x: number, y: number, scale: number, color: string) => {
      const carW = 30 * scale;
      const carH = 46 * scale;
      context.fillStyle = '#252b40';
      context.fillRect(x - carW / 2, y - carH / 2 + 4 * scale, carW, carH);
      context.fillStyle = color;
      context.fillRect(x - carW / 2 + 3 * scale, y - carH / 2, carW - 6 * scale, carH);
      context.fillStyle = '#c6d9e8';
      context.fillRect(x - carW / 2 + 7 * scale, y - carH / 2 + 7 * scale, carW - 14 * scale, 11 * scale);
      context.fillStyle = '#f3d879';
      context.fillRect(x - carW / 2 + 4 * scale, y + carH / 2 - 7 * scale, 5 * scale, 3 * scale);
      context.fillRect(x + carW / 2 - 9 * scale, y + carH / 2 - 7 * scale, 5 * scale, 3 * scale);
    };
    traffic.forEach((car) => {
      const scale = 0.35 + car.depth * 0.75;
      const roadHalf = 48 + car.depth * 185;
      const x = w / 2 + (car.lane - 1) * roadHalf * 0.64;
      drawCar(x, 108 + car.depth * 210, scale, '#e3b844');
    });
    drawCar(w / 2 + (lane - 1) * 124, h - 48, 1.3, game.id === 'drift-circuit' ? '#74b59a' : '#ec7658');
    context.fillStyle = '#252b40';
    context.font = '700 13px sans-serif';
    context.fillText(game.id === 'drift-circuit' ? 'DRIFT CIRCUIT' : game.id === 'rally-rush' ? 'RALLY RUSH' : game.id === 'turbo-time-trial' ? 'TIME TRIAL' : 'HIGHWAY RACER', 16, 24);
  }, [traffic, lane, game.id]);

  const start = () => {
    setTraffic([]);
    setLane(1);
    setScore(0);
    setEnded(false);
    setRunning(true);
  };
  const steer = (direction: number) => setLane((value) => Math.max(0, Math.min(2, value + direction)));

  return <div className="exp-game">
    <div className="exp-score">Distance <b>{score}</b>{ended && <span> · Run over</span>}</div>
    <canvas ref={canvasRef} className="race-canvas" width={600} height={360} data-testid={`canvas-${game.id}`}/>
    <p className="exp-hint">{game.id === 'drift-circuit' ? 'Slide between lanes and keep your drift going.' : 'Steer around traffic. Use the arrow keys or controls.'}</p>
    <div className="exp-controls"><Control label="Steer left" onClick={() => steer(-1)} testId={`button-${game.id}-left`}><ArrowLeft size={18}/></Control><Control label="Steer right" onClick={() => steer(1)} testId={`button-${game.id}-right`}><ArrowRight size={18}/></Control></div>
    {!running && <Control label={ended ? 'Race again' : 'Start race'} onClick={start} testId={`button-${game.id}-start`}>{ended ? 'Race again' : 'Start race'}</Control>}
  </div>;
}

function ParkingGame() {
  const [car, setCar] = useState([4, 4]);
  const [moves, setMoves] = useState(0);
  const parked = car[0] === 0 && car[1] === 2;
  const move = (dr: number, dc: number) => {
    if (parked) return;
    const row = car[0] + dr;
    const col = car[1] + dc;
    if (row < 0 || row > 4 || col < 0 || col > 4 || CAR_WALLS.has(`${row}-${col}`)) return;
    setCar([row, col]);
    setMoves((value) => value + 1);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault();
      move(...directions[event.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return <div className="exp-game">
    <div className="exp-score">{parked ? `Parked in ${moves} moves.` : `Moves <b>${moves}</b> · Find the green parking bay.`}</div>
    <div className="parking-board">{Array.from({ length: 25 }, (_, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const isCar = car[0] === row && car[1] === col;
      const isGoal = row === 0 && col === 2;
      const isWall = CAR_WALLS.has(`${row}-${col}`);
      return <button key={index} className={`parking-cell ${isGoal ? 'goal' : ''} ${isWall ? 'wall' : ''} ${isCar ? 'car' : ''}`} onClick={() => {
        if (isCar) return;
        if (row === car[0] - 1 && col === car[1]) move(-1, 0);
        if (row === car[0] + 1 && col === car[1]) move(1, 0);
        if (row === car[0] && col === car[1] - 1) move(0, -1);
        if (row === car[0] && col === car[1] + 1) move(0, 1);
      }} aria-label={isCar ? 'Your car' : isGoal ? 'Parking bay' : isWall ? 'Barrier' : `Road square ${index + 1}`} data-testid={`parking-cell-${index}`}>{isCar ? 'CAR' : isGoal ? 'P' : isWall ? '■' : ''}</button>;
    })}</div>
    <div className="exp-controls parking-controls"><Control label="Move up" onClick={() => move(-1, 0)} testId="button-parking-up"><ArrowUp size={18}/></Control><Control label="Move left" onClick={() => move(0, -1)} testId="button-parking-left"><ArrowLeft size={18}/></Control><Control label="Move down" onClick={() => move(1, 0)} testId="button-parking-down"><ArrowDown size={18}/></Control><Control label="Move right" onClick={() => move(0, 1)} testId="button-parking-right"><ArrowRight size={18}/></Control></div>
    {parked && <Control label="Play again" onClick={() => { setCar([4, 4]); setMoves(0); }} testId="button-parking-replay">Play again</Control>}
  </div>;
}

function Maze3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState({ x: 1.5, y: 1.5, angle: 0 });
  const [won, setWon] = useState(false);
  const move = (key: string) => {
    if (won) return;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      setPlayer((current) => ({ ...current, angle: current.angle + (key === 'ArrowLeft' ? -0.18 : 0.18) }));
      return;
    }
    const sign = key === 'ArrowUp' ? 1 : -1;
    setPlayer((current) => {
      const x = current.x + Math.cos(current.angle) * 0.18 * sign;
      const y = current.y + Math.sin(current.angle) * 0.18 * sign;
      if (MAZE_MAP[Math.floor(y)]?.[Math.floor(x)] === '1') return current;
      if (x > 5 && y > 5) setWon(true);
      return { ...current, x, y };
    });
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(event.key)) return;
      event.preventDefault();
      const translated = ({ w: 'ArrowUp', s: 'ArrowDown', a: 'ArrowLeft', d: 'ArrowRight' } as Record<string, string>)[event.key] ?? event.key;
      move(translated);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    ctx.fillStyle = '#c9dce3'; ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = '#b5c29f'; ctx.fillRect(0, height / 2, width, height / 2);
    const rays = 120;
    for (let column = 0; column < rays; column++) {
      const angle = player.angle - 0.55 + (column / rays) * 1.1;
      let distance = 0;
      while (distance < 10) {
        distance += 0.025;
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;
        if (MAZE_MAP[Math.floor(y)]?.[Math.floor(x)] === '1') break;
      }
      const corrected = Math.max(0.15, distance * Math.cos(angle - player.angle));
      const wallHeight = Math.min(height, height / corrected * 0.76);
      const shade = Math.max(54, 205 - corrected * 21);
      ctx.fillStyle = `rgb(${shade},${shade + 8},${shade - 4})`;
      ctx.fillRect(column * (width / rays), (height - wallHeight) / 2, width / rays + 1, wallHeight);
    }
    ctx.fillStyle = '#252b40'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('FIND THE EXIT', 16, 24);
  }, [player]);
  return <div className="exp-game">
    <div className="exp-score">{won ? 'You found the exit!' : 'First-person maze · reach the far room.'}</div>
    <canvas ref={canvasRef} className="race-canvas maze-canvas" width={600} height={360} data-testid="canvas-maze-explorer-3d"/>
    <p className="exp-hint">Turn with left/right, walk with up/down or WASD.</p>
    <div className="exp-controls"><Control label="Turn left" onClick={() => move('ArrowLeft')} testId="button-maze-left"><ArrowLeft size={18}/></Control><Control label="Forward" onClick={() => move('ArrowUp')} testId="button-maze-forward"><ArrowUp size={18}/></Control><Control label="Turn right" onClick={() => move('ArrowRight')} testId="button-maze-right"><ArrowRight size={18}/></Control></div>
    {won && <Control label="Start again" onClick={() => { setPlayer({ x: 1.5, y: 1.5, angle: 0 }); setWon(false); }} testId="button-maze-replay">Start again</Control>}
  </div>;
}

function TunnelRunner3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [obstacles, setObstacles] = useState<{ lane: number; depth: number; id: number }[]>([]);
  useEffect(() => {
    if (!running) return;
    let tick = 0;
    const timer = window.setInterval(() => {
      tick++;
      setObstacles((current) => {
        const moved = current.map((item) => ({ ...item, depth: item.depth + 0.035 }));
        if (tick % 12 === 0) moved.push({ lane: randomInt(3), depth: 0.05, id: tick });
        if (moved.some((item) => item.lane === lane && item.depth > 0.88)) { setRunning(false); setOver(true); }
        if (moved.some((item) => item.depth >= 1.02)) setScore((value) => value + 1);
        return moved.filter((item) => item.depth < 1.06);
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [running, lane]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!running || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      setLane((value) => Math.max(0, Math.min(2, value + (event.key === 'ArrowLeft' ? -1 : 1))));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const w = canvas.width; const h = canvas.height;
    ctx.fillStyle = '#202c46'; ctx.fillRect(0, 0, w, h);
    for (let ring = 0; ring < 8; ring++) {
      const z = (ring + 1) / 9;
      const halfW = 35 + z * 260;
      const halfH = 22 + z * 150;
      ctx.strokeStyle = ring % 2 ? '#6d86bd' : '#eb835f';
      ctx.lineWidth = 3;
      ctx.strokeRect(w / 2 - halfW, h / 2 - halfH, halfW * 2, halfH * 2);
    }
    obstacles.forEach((item) => {
      const scale = 0.3 + item.depth * 1.1;
      const x = w / 2 + (item.lane - 1) * (30 + item.depth * 230);
      const y = h / 2 + item.depth * 125;
      ctx.fillStyle = '#f3d879';
      ctx.fillRect(x - 14 * scale, y - 12 * scale, 28 * scale, 24 * scale);
    });
    ctx.fillStyle = '#78d0ad';
    ctx.beginPath();
    ctx.moveTo(w / 2 + (lane - 1) * 135, h - 50);
    ctx.lineTo(w / 2 + (lane - 1) * 135 - 19, h - 12);
    ctx.lineTo(w / 2 + (lane - 1) * 135 + 19, h - 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('3D TUNNEL RUNNER', 16, 24);
  }, [obstacles, lane]);
  return <div className="exp-game">
    <div className="exp-score">Gates passed <b>{score}</b>{over && <span> · Crash!</span>}</div>
    <canvas ref={canvasRef} className="race-canvas" width={600} height={360} data-testid="canvas-tunnel-runner-3d"/>
    <p className="exp-hint">Dodge the blocks as they rush toward you.</p>
    <div className="exp-controls"><Control label="Move left" onClick={() => setLane((value) => Math.max(0, value - 1))} testId="button-tunnel-left"><ArrowLeft size={18}/></Control><Control label="Move right" onClick={() => setLane((value) => Math.min(2, value + 1))} testId="button-tunnel-right"><ArrowRight size={18}/></Control></div>
    {!running && <Control label="Start tunnel run" onClick={() => { setLane(1); setScore(0); setOver(false); setObstacles([]); setRunning(true); }} testId="button-tunnel-start">{over ? 'Run again' : 'Start run'}</Control>}
  </div>;
}

function BlockStack3D() {
  const [moving, setMoving] = useState(50);
  const movingDirection = useRef(1);
  const [target, setTarget] = useState(50);
  const [height, setHeight] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setMoving((current) => {
        let next = current + movingDirection.current * 2.4;
        if (next > 88 || next < 12) {
          movingDirection.current *= -1;
          next = Math.max(12, Math.min(88, next));
        }
        return next;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [running]);
  const drop = () => {
    if (!running) return;
    if (Math.abs(moving - target) > 17) {
      setRunning(false);
      setOver(true);
      return;
    }
    const next = height + 1;
    setTarget(moving);
    setHeight(next);
    if (next >= 8) setRunning(false);
  };
  return <div className="exp-game">
    <div className="exp-score">Blocks <b>{height}</b> / 8 {over && <span>· Stack slipped</span>}{height >= 8 && <span>· Tower complete!</span>}</div>
    <div className="cube-stage">
      <div className="cube-pile">{Array.from({ length: height }, (_, index) => <div key={index} className="cube3d stacked-cube" style={{ transform: `translate(-50%, ${-index * 32}px) rotateX(58deg) rotateZ(45deg)`, zIndex: index + 1 }}><CubeFaces/></div>)}
        {running && <div className="cube3d moving-cube" style={{ left: `${moving}%`, transform: 'translateX(-50%) rotateX(58deg) rotateZ(45deg)' }}><CubeFaces/></div>}
      </div>
    </div>
    <p className="exp-hint">Drop each moving block on top of the last. The view is in 3D.</p>
    {!running && height < 8 && <Control label={over ? 'Restart tower' : 'Start stacking'} onClick={() => {
      if (over) { setHeight(0); setTarget(50); setMoving(50); setOver(false); }
      setRunning(true);
    }} testId="button-block-stack-start">{over ? 'Try again' : 'Start stacking'}</Control>}
    {running && <Control label="Drop block" onClick={drop} testId="button-drop-block">Drop block</Control>}
    {height >= 8 && <Control label="Build another tower" onClick={() => { setHeight(0); setMoving(50); setTarget(50); setOver(false); }} testId="button-block-stack-replay">Build another</Control>}
  </div>;
}

function CubeFaces() {
  return <><span className="cube-face front"/><span className="cube-face back"/><span className="cube-face right"/><span className="cube-face left"/><span className="cube-face top"/><span className="cube-face bottom"/></>;
}

const BALL_MAZE_WALLS = new Set(['1-1', '1-2', '3-1', '2-3', '3-3']);

function BallMaze3D() {
  const [ball, setBall] = useState([0, 0]);
  const complete = ball[0] === 4 && ball[1] === 4;
  const move = (dr: number, dc: number) => {
    if (complete) return;
    const row = ball[0] + dr;
    const col = ball[1] + dc;
    if (row < 0 || row > 4 || col < 0 || col > 4 || BALL_MAZE_WALLS.has(`${row}-${col}`)) return;
    setBall([row, col]);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault();
      move(...directions[event.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return <div className="exp-game">
    <div className="exp-score">{complete ? 'The ball reached the goal.' : 'Tilt the 3D maze and guide the ball to the star.'}</div>
    <div className="ball-maze-perspective"><div className="ball-maze-board">{Array.from({ length: 25 }, (_, index) => {
      const row = Math.floor(index / 5); const col = index % 5;
      const isBall = ball[0] === row && ball[1] === col;
      const isGoal = row === 4 && col === 4;
      const isWall = BALL_MAZE_WALLS.has(`${row}-${col}`);
      return <div key={index} className={`ball-maze-cell ${isWall ? 'wall' : ''} ${isGoal ? 'goal' : ''} ${isBall ? 'ball' : ''}`} data-testid={`ball-maze-cell-${index}`}>{isBall ? <span/> : isGoal ? '★' : ''}</div>;
    })}</div></div>
    <div className="exp-controls"><Control label="Tilt up" onClick={() => move(-1, 0)} testId="button-ballmaze-up"><ArrowUp size={18}/></Control><Control label="Tilt left" onClick={() => move(0, -1)} testId="button-ballmaze-left"><ArrowLeft size={18}/></Control><Control label="Tilt down" onClick={() => move(1, 0)} testId="button-ballmaze-down"><ArrowDown size={18}/></Control><Control label="Tilt right" onClick={() => move(0, 1)} testId="button-ballmaze-right"><ArrowRight size={18}/></Control></div>
    {complete && <Control label="Play again" onClick={() => setBall([0, 0])} testId="button-ballmaze-replay">Play again</Control>}
  </div>;
}

function QuickExpansionGame({ game }: { game: ExpansionGame }) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [lane, setLane] = useState(2);
  const [aliens, setAliens] = useState(Array(15).fill(true) as boolean[]);
  const [bubbles, setBubbles] = useState(Array.from({ length: 18 }, (_, index) => index));
  const [fruits, setFruits] = useState(Array.from({ length: 12 }, (_, index) => index));
  const [fruitTime, setFruitTime] = useState(15);
  const [fruitRunning, setFruitRunning] = useState(false);
  const [tiles, setTiles] = useState(shuffledPuzzle);
  const [golfAim, setGolfAim] = useState(38);
  const [golfPower, setGolfPower] = useState(3);
  const [basketAngle, setBasketAngle] = useState(45);
  const [basketPower, setBasketPower] = useState(60);
  const [treasure, setTreasure] = useState(() => randomInt(25));
  const [opened, setOpened] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [catchLane, setCatchLane] = useState(2);
  const [starLane, setStarLane] = useState(randomInt(5));
  const [starRow, setStarRow] = useState(0);
  const [starTime, setStarTime] = useState(20);
  const [starRunning, setStarRunning] = useState(false);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<number[]>([]);
  const [rocketAltitude, setRocketAltitude] = useState(12);
  const [rocketSpeed, setRocketSpeed] = useState(2);
  const [rocketFuel, setRocketFuel] = useState(6);
  const [rocketEnded, setRocketEnded] = useState(false);
  const [asteroids, setAsteroids] = useState(Array.from({ length: 6 }, (_, index) => index));

  useEffect(() => {
    if (!fruitRunning) return;
    const timer = window.setInterval(() => setFruitTime((value) => {
      if (value <= 1) { setFruitRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [fruitRunning]);

  useEffect(() => {
    if (!starRunning) return;
    const timer = window.setInterval(() => {
      setStarRow((row) => {
        if (row >= 5) {
          if (catchLane === starLane) setScore((value) => value + 1);
          else setMisses((value) => value + 1);
          setStarLane(randomInt(5));
          return 0;
        }
        return row + 1;
      });
      setStarTime((value) => {
        if (value <= 1) { setStarRunning(false); return 0; }
        return value - 1;
      });
      setMisses((value) => {
        if (value >= 4) setStarRunning(false);
        return value;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [starRunning, catchLane, starLane]);

  const clickAlien = (column: number) => {
    const index = [...aliens].map((alive, i) => alive && i % 5 === column ? i : -1).filter((i) => i >= 0).pop();
    if (index === undefined) { setFeedback('No invader in that lane.'); return; }
    setAliens((current) => current.map((alive, i) => i === index ? false : alive));
    setScore((value) => value + 1);
  };

  const clickPuzzleTile = (index: number) => {
    const blank = tiles.indexOf(0);
    const adjacent = Math.abs(Math.floor(index / 3) - Math.floor(blank / 3)) + Math.abs(index % 3 - blank % 3) === 1;
    if (!adjacent) return;
    const next = [...tiles]; [next[blank], next[index]] = [next[index], next[blank]];
    setTiles(next);
    if (next.join(',') === '1,2,3,4,5,6,7,8,0') setFeedback('Puzzle solved!');
  };

  const searchLetter = (index: number) => {
    if (foundWords.includes(Math.floor(index / 6))) return;
    const currentRow = Math.floor(index / 6);
    const previousRow = selectedLetters.length ? Math.floor(selectedLetters[0] / 6) : currentRow;
    const next = previousRow === currentRow ? [...selectedLetters, index] : [index];
    if (next.length > 6) {
      setSelectedLetters([index]);
      return;
    }
    setSelectedLetters(next);
    if (next.length === 6) {
      const word = next.map((cell) => WORD_GRID[Math.floor(cell / 6)][cell % 6]).join('');
      if (WORD_LIST.includes(word)) {
        setFoundWords((values) => [...values, currentRow]);
        setScore((value) => value + 1);
        setFeedback(`Found ${word}.`);
        setSelectedLetters([]);
      } else setFeedback('That row is not one of the words.');
    }
  };

  const fireAsteroid = (index: number) => {
    if (!asteroids.includes(index)) return;
    const next = asteroids.filter((item) => item !== index);
    if (!next.length) {
      setAsteroids(Array.from({ length: 6 }, (_, item) => item));
      setFeedback('Asteroid field cleared. New wave!');
    } else setAsteroids(next);
    setScore((value) => value + 1);
  };

  const moveRocket = (thrust: boolean) => {
    if (rocketEnded) return;
    const speed = thrust ? Math.max(0, rocketSpeed - 0.75) : rocketSpeed + 0.45;
    const altitude = Math.max(0, rocketAltitude - (thrust ? 1 : 2));
    setRocketSpeed(speed);
    setRocketAltitude(altitude);
    if (thrust) setRocketFuel((value) => Math.max(0, value - 1));
    if (altitude === 0) {
      setRocketEnded(true);
      setFeedback(speed <= 2 && rocketFuel > 0 ? 'Soft landing! You made it.' : 'Hard landing. Try using more thrust.');
    }
  };

  let content: ReactNode = null;
  switch (game.id) {
    case 'asteroids':
      content = <><p className="exp-hint">Click the drifting rocks before they fill the field.</p><div className="asteroid-field">{Array.from({ length: 6 }, (_, index) => <button key={index} className={`asteroid-target asteroid-${index} ${asteroids.includes(index) ? '' : 'hit'}`} onClick={() => fireAsteroid(index)} aria-label={`Shoot asteroid ${index + 1}`} data-testid={`button-asteroid-${index}`}>✦</button>)}</div><div className="exp-score">Hits <b>{score}</b></div></>;
      break;
    case 'space-invaders':
      content = <><p className="exp-hint">Move your ship under a column and fire.</p><div className="invader-board">{aliens.map((alive, index) => <button key={index} className={`invader ${alive ? '' : 'destroyed'}`} onClick={() => clickAlien(index % 5)} aria-label={`Invader row ${Math.floor(index / 5) + 1}, column ${index % 5 + 1}`} data-testid={`button-invader-${index}`}>{alive ? '◆' : ''}</button>)}<span className="player-ship" style={{ gridColumn: lane + 1, gridRow: 4 }}>▲</span></div><div className="exp-controls"><Control label="Move ship left" onClick={() => setLane((value) => Math.max(0, value - 1))} testId="button-invaders-left"><ArrowLeft size={18}/></Control><Control label="Move ship right" onClick={() => setLane((value) => Math.min(4, value + 1))} testId="button-invaders-right"><ArrowRight size={18}/></Control><Control label="Fire" onClick={() => clickAlien(lane)} testId="button-invaders-fire">Fire</Control></div><div className="exp-score">Invaders cleared <b>{score}</b> / 15</div>{!aliens.some(Boolean) && <Control label="Start another wave" onClick={() => { setAliens(Array(15).fill(true)); setScore(0); }} testId="button-invaders-replay">New wave</Control>}</>;
      break;
    case 'bubble-pop':
      content = <><p className="exp-hint">Pop every bubble to reveal a new batch.</p><div className="bubble-field">{bubbles.map((bubble) => <button key={bubble} className={`bubble bubble-${bubble % 6}`} onClick={() => { setBubbles((current) => current.filter((item) => item !== bubble)); setScore((value) => value + 1); }} aria-label={`Pop bubble ${bubble + 1}`} data-testid={`button-bubble-${bubble}`}/>)}</div><div className="exp-score">Bubbles popped <b>{score}</b></div>{!bubbles.length && <Control label="Start another batch" onClick={() => setBubbles(Array.from({ length: 18 }, (_, index) => index + score))} testId="button-bubble-replay">Another batch</Control>}</>;
      break;
    case 'fruit-slice':
      content = <><div className="exp-score">Time <b>{fruitTime}s</b> · Fruit <b>{score}</b></div><p className="exp-hint">Tap the fruit as it appears. No blade needed.</p><div className="fruit-field">{fruits.map((fruit, index) => <button key={`${fruit}-${index}`} className={`fruit fruit-${fruit % 5}`} onClick={() => { if (!fruitRunning) return; setFruits((current) => current.filter((_, i) => i !== index)); setScore((value) => value + 1); }} aria-label="Slice fruit" data-testid={`button-fruit-${index}`}>{['●', '◆', '●', '■', '◆'][fruit % 5]}</button>)}</div>{!fruitRunning && <Control label="Start fruit slice" onClick={() => { setFruitTime(15); setScore(0); setFruits(Array.from({ length: 12 }, (_, index) => index + randomInt(5))); setFruitRunning(true); }} testId="button-fruit-start">{fruitTime === 0 ? 'Play again' : 'Start slicing'}</Control>}</>;
      break;
    case 'sliding-puzzle':
      content = <><p className="exp-hint">{feedback || 'Slide tiles into order, leaving the blank in the corner.'}</p><div className="sliding-board">{tiles.map((tile, index) => <button key={index} className={`sliding-tile ${tile === 0 ? 'blank' : ''}`} onClick={() => clickPuzzleTile(index)} aria-label={tile ? `Tile ${tile}` : 'Empty square'} data-testid={`button-sliding-${index}`}>{tile || ''}</button>)}</div><div className="exp-score">Moves <b>{score}</b></div><Control label="Shuffle puzzle" onClick={() => { setTiles(shuffledPuzzle()); setScore(0); setFeedback(''); }} testId="button-sliding-shuffle">Shuffle</Control></>;
      break;
    case 'mini-golf':
      content = <><div className="exp-score">Strokes <b>{score}</b></div><div className="golf-green"><span className="golf-hole"/><span className="golf-ball" style={{ left: `${Math.max(10, Math.min(88, 15 + score * 12))}%` }}/></div><p className="exp-hint">{feedback || 'Aim near the flag and pick a medium swing.'}</p><div className="exp-controls"><Control label="Aim left" onClick={() => setGolfAim((value) => Math.max(0, value - 5))} testId="button-golf-left"><ArrowLeft size={18}/></Control><span className="exp-score">Aim {golfAim}° · Power {golfPower}</span><Control label="Aim right" onClick={() => setGolfAim((value) => Math.min(90, value + 5))} testId="button-golf-right"><ArrowRight size={18}/></Control></div><div className="exp-controls"><Control label="Less power" onClick={() => setGolfPower((value) => Math.max(1, value - 1))} testId="button-golf-power-down">−</Control><Control label="Take a shot" onClick={() => { setScore((value) => value + 1); setFeedback(Math.abs(golfAim - 40) < 11 && golfPower >= 2 && golfPower <= 4 ? 'On the green! Tap again to sink it.' : 'A little off. Adjust your aim and power.'); }} testId="button-golf-shot">Take shot</Control><Control label="More power" onClick={() => setGolfPower((value) => Math.min(5, value + 1))} testId="button-golf-power-up">+</Control></div></>;
      break;
    case 'basketball-shot':
      content = <><div className="exp-score">Buckets <b>{score}</b></div><div className="basket-court"><span className="basket-hoop"/><span className="basket-ball"/></div><p className="exp-hint">{feedback || 'Set your arc and power, then shoot.'}</p><div className="exp-controls"><Control label="Lower arc" onClick={() => setBasketAngle((value) => Math.max(20, value - 5))} testId="button-basket-angle-down">Arc −</Control><span className="exp-score">{basketAngle}° · {basketPower}%</span><Control label="Higher arc" onClick={() => setBasketAngle((value) => Math.min(80, value + 5))} testId="button-basket-angle-up">Arc +</Control></div><div className="exp-controls"><Control label="Less power" onClick={() => setBasketPower((value) => Math.max(20, value - 5))} testId="button-basket-power-down">Power −</Control><Control label="Shoot basket" onClick={() => { const made = Math.abs(basketAngle - 50) + Math.abs(basketPower - 65) < 21; if (made) setScore((value) => value + 1); setFeedback(made ? 'Nothing but net!' : 'Missed. Try a different arc or power.'); }} testId="button-basket-shoot">Shoot</Control><Control label="More power" onClick={() => setBasketPower((value) => Math.min(100, value + 5))} testId="button-basket-power-up">Power +</Control></div></>;
      break;
    case 'treasure-hunt':
      content = <><div className="exp-score">Tries left <b>{Math.max(0, 8 - opened.length)}</b></div><p className="exp-hint">{feedback || 'Find the hidden treasure in eight tries.'}</p><div className="treasure-grid">{Array.from({ length: 25 }, (_, index) => <button key={index} className={`treasure-cell ${opened.includes(index) ? 'open' : ''}`} onClick={() => { if (opened.includes(index) || opened.length >= 8) return; const next = [...opened, index]; setOpened(next); if (index === treasure) setFeedback('Treasure found!'); else { const distance = Math.abs(Math.floor(index / 5) - Math.floor(treasure / 5)) + Math.abs(index % 5 - treasure % 5); setFeedback(distance <= 1 ? 'Very close!' : distance <= 3 ? 'Getting warmer.' : 'Cold. Try another area.'); } }} aria-label={`Search square ${index + 1}`} data-testid={`button-treasure-${index}`}>{opened.includes(index) ? index === treasure ? '★' : '·' : '?'}</button>)}</div>{(opened.some((index) => index === treasure) || opened.length >= 8) && <Control label="Search again" onClick={() => { setTreasure(randomInt(25)); setOpened([]); setFeedback('New map ready.'); }} testId="button-treasure-replay">Search again</Control>}</>;
      break;
    case 'star-catcher':
      content = <><div className="exp-score">Time <b>{starTime}s</b> · Stars <b>{score}</b> · Misses <b>{misses}</b></div><div className="star-lanes">{Array.from({ length: 5 }, (_, col) => <div className="star-lane" key={col}><span className={`falling-star ${starLane === col && starRow < 5 ? `star-row-${starRow}` : 'hidden'}`}>★</span><span className={`star-basket ${catchLane === col ? 'active' : ''}`}/></div>)}</div><div className="exp-controls">{Array.from({ length: 5 }, (_, index) => <Control key={index} label={`Move catcher to lane ${index + 1}`} onClick={() => setCatchLane(index)} testId={`button-star-lane-${index}`}>{index + 1}</Control>)}</div>{!starRunning && <Control label="Start star catcher" onClick={() => { setScore(0); setMisses(0); setStarRow(0); setStarTime(20); setCatchLane(2); setStarRunning(true); }} testId="button-star-start">{starTime === 0 || misses >= 5 ? 'Play again' : 'Start catching'}</Control>}</>;
      break;
    case 'word-search':
      content = <><p className="exp-hint">Find the three hidden words by tapping a row left to right.</p><div className="word-search-grid">{WORD_GRID.flatMap((row, rowIndex) => row.map((letter, colIndex) => { const index = rowIndex * 6 + colIndex; return <button key={index} className={`word-cell ${selectedLetters.includes(index) ? 'selected' : ''} ${foundWords.includes(rowIndex) ? 'found' : ''}`} onClick={() => searchLetter(index)} aria-label={`Letter ${letter}, row ${rowIndex + 1}, column ${colIndex + 1}`} data-testid={`button-word-cell-${index}`}>{letter}</button>; }))}</div><div className="exp-score">Words found <b>{foundWords.length}</b> / 3</div>{foundWords.length === 3 && <Control label="Play again" onClick={() => { setFoundWords([]); setSelectedLetters([]); setScore(0); }} testId="button-word-search-replay">Play again</Control>}</>;
      break;
    case 'rocket-landing':
      content = <><div className="exp-score">Altitude <b>{rocketAltitude} km</b> · Speed <b>{rocketSpeed.toFixed(1)}</b> · Fuel <b>{rocketFuel}</b></div><div className="rocket-scene"><span className="rocket-icon" style={{ bottom: `${rocketAltitude * 6}%` }}>▲</span><span className="landing-pad"/></div><p className="exp-hint">{feedback || 'Use thrust to slow down before reaching the surface.'}</p><div className="exp-controls"><Control label="Coast down" onClick={() => moveRocket(false)} testId="button-rocket-coast">Coast</Control><Control label="Fire thrusters" onClick={() => moveRocket(true)} testId="button-rocket-thrust">Thrust</Control></div>{rocketEnded && <Control label="Restart landing" onClick={() => { setRocketAltitude(12); setRocketSpeed(2); setRocketFuel(6); setRocketEnded(false); setFeedback(''); }} testId="button-rocket-replay">Try again</Control>}</>;
      break;
    default:
      content = <div className="exp-score">Try one of the new games.</div>;
  }

  return <div className="exp-game">
    {game.id === 'fruit-slice' ? content : <>{game.id === 'asteroids' || game.id === 'space-invaders' || game.id === 'bubble-pop' || game.id === 'sliding-puzzle' || game.id === 'mini-golf' || game.id === 'basketball-shot' || game.id === 'treasure-hunt' || game.id === 'star-catcher' || game.id === 'word-search' || game.id === 'rocket-landing' ? null : <div className="exp-score">Score <b>{score}</b></div>}{content}</>}
  </div>;
}

function shuffledPuzzle() {
  const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  let blank = 8;
  for (let move = 0; move < 60; move++) {
    const row = Math.floor(blank / 3); const col = blank % 3;
    const choices = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
      .filter(([r, c]) => r >= 0 && r < 3 && c >= 0 && c < 3);
    const [nextRow, nextCol] = choices[randomInt(choices.length)];
    const next = nextRow * 3 + nextCol;
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
    blank = next;
  }
  return tiles;
}

export default function ArcadeExpansionModal({ game, onClose }: { game: ExpansionGame; onClose: () => void }) {
  const [round, setRound] = useState(0);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);
  return <div className="game-overlay" data-testid="dialog-game" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="game-modal expansion-modal" role="dialog" aria-modal="true" aria-label={`${game.name} game`}>
      <header className="modal-head"><div className="modal-title-group"><div className="art-icon expansion-modal-icon"><Gamepad2 size={20}/></div><div><h2 data-testid={`title-game-${game.id}`}>{game.name}</h2><p>Free to play · right here in your browser</p></div></div>
        <div className="extra-modal-actions"><button className="icon-button" onClick={() => setRound((value) => value + 1)} aria-label="Reset game" data-testid={`button-reset-${game.id}`}><RotateCcw size={16}/></button><button className="icon-button" onClick={onClose} aria-label="Close game" data-testid="button-close-game"><X size={19}/></button></div>
      </header>
      <div className="modal-body"><ExpansionBody key={`${game.id}-${round}`} game={game}/></div>
    </section>
  </div>;
}
