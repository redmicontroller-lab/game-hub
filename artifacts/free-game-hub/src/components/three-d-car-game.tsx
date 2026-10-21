import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type CarGame = { id: string };
type Item = { id: number; lane: number; depth: number; kind: 'traffic' | 'token' | 'ramp' };
type Mode = 'traffic' | 'collect' | 'drift' | 'stunt' | 'smash' | 'delivery' | 'survive';
type Track = {
  mode: Mode;
  sky: string;
  ground: string;
  road: string;
  car: string;
  accent: string;
  curve: number;
  speed: number;
  label: string;
};

const TRACKS: Record<string, Track> = {
  'neon-skyline-3d': { mode: 'traffic', sky: '#18223f', ground: '#3d4265', road: '#393b48', car: '#53dbda', accent: '#f28fca', curve: 0.18, speed: 0.023, label: 'NEON CITY' },
  'canyon-drift-3d': { mode: 'drift', sky: '#f3bd8b', ground: '#bd7853', road: '#55504d', car: '#f1d45f', accent: '#b44c36', curve: 0.8, speed: 0.021, label: 'CANYON DRIFT' },
  'alpine-rally-3d': { mode: 'traffic', sky: '#d4e5ed', ground: '#8bb09b', road: '#555b5e', car: '#e6674d', accent: '#f8f3df', curve: 0.67, speed: 0.021, label: 'ALPINE RALLY' },
  'coastal-cruise-3d': { mode: 'collect', sky: '#a6dce7', ground: '#74ad8a', road: '#62666a', car: '#ef855e', accent: '#f5da7d', curve: 0.35, speed: 0.019, label: 'COASTAL CRUISE' },
  'dune-dash-3d': { mode: 'traffic', sky: '#f5d49d', ground: '#d2a666', road: '#8e775c', car: '#4d7692', accent: '#ec7658', curve: 0.45, speed: 0.021, label: 'DUNE DASH' },
  'midnight-motorway-3d': { mode: 'survive', sky: '#11192d', ground: '#283244', road: '#383d46', car: '#f3cf55', accent: '#9bc1df', curve: 0.22, speed: 0.026, label: 'MIDNIGHT MOTORWAY' },
  'jungle-rally-3d': { mode: 'traffic', sky: '#b9d3a9', ground: '#527755', road: '#57594d', car: '#e36e50', accent: '#d5b85d', curve: 0.61, speed: 0.022, label: 'JUNGLE RALLY' },
  'arctic-ice-circuit-3d': { mode: 'drift', sky: '#d5e4ef', ground: '#a5c2d3', road: '#647582', car: '#e95f55', accent: '#f7fbff', curve: 0.67, speed: 0.018, label: 'ICE CIRCUIT' },
  'downtown-taxi-3d': { mode: 'delivery', sky: '#d9e4e8', ground: '#778b7f', road: '#55565b', car: '#f0cb4f', accent: '#f7eee1', curve: 0.25, speed: 0.019, label: 'TAXI DASH' },
  'grand-prix-apex-3d': { mode: 'traffic', sky: '#cae1e4', ground: '#76a77c', road: '#4b4f54', car: '#4b90d1', accent: '#f3df70', curve: 0.42, speed: 0.025, label: 'GRAND PRIX' },
  'traffic-weave-3d': { mode: 'traffic', sky: '#c9d7dd', ground: '#858f88', road: '#505358', car: '#ec7658', accent: '#f4e7cf', curve: 0.16, speed: 0.022, label: 'TRAFFIC WEAVE' },
  'turbo-tunnel-3d': { mode: 'survive', sky: '#303650', ground: '#202638', road: '#343946', car: '#efc84c', accent: '#64d9d0', curve: 0.1, speed: 0.03, label: 'TURBO TUNNEL' },
  'stunt-ramp-3d': { mode: 'stunt', sky: '#b6d9e8', ground: '#86b379', road: '#53585d', car: '#f07a4f', accent: '#f1d363', curve: 0.35, speed: 0.021, label: 'STUNT RAMPS' },
  'police-pursuit-3d': { mode: 'survive', sky: '#667c91', ground: '#53636f', road: '#41464c', car: '#e7d05c', accent: '#e85f61', curve: 0.38, speed: 0.025, label: 'POLICE PURSUIT' },
  'monster-truck-3d': { mode: 'smash', sky: '#c8dcdf', ground: '#92a875', road: '#605d54', car: '#7db5a1', accent: '#e69b4a', curve: 0.45, speed: 0.018, label: 'MONSTER TRUCK' },
  'formula-flash-3d': { mode: 'traffic', sky: '#d8e8ec', ground: '#84b188', road: '#41464d', car: '#df4e4c', accent: '#f6eee0', curve: 0.32, speed: 0.028, label: 'FORMULA FLASH' },
  'sunset-speedway-3d': { mode: 'traffic', sky: '#f2b08b', ground: '#9a826a', road: '#4c4c52', car: '#e8d05d', accent: '#db765b', curve: 0.54, speed: 0.022, label: 'SUNSET SPEEDWAY' },
  'rainstorm-road-3d': { mode: 'drift', sky: '#788da0', ground: '#617269', road: '#424b53', car: '#70b7c8', accent: '#d7e9e8', curve: 0.6, speed: 0.019, label: 'RAINSTORM ROAD' },
  'spaceway-racers-3d': { mode: 'collect', sky: '#15192e', ground: '#30364e', road: '#343543', car: '#a69af0', accent: '#f4d565', curve: 0.26, speed: 0.024, label: 'SPACEWAY RACERS' },
  'city-delivery-3d': { mode: 'delivery', sky: '#d4e1e7', ground: '#87988a', road: '#53565c', car: '#e78452', accent: '#f4d267', curve: 0.27, speed: 0.018, label: 'CITY DELIVERY' },
};

function laneFor(id: string, frame: number) {
  const seed = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return ((seed + frame * 7) % 5) - 2;
}

function drawCar(context: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  const width = 29 * scale;
  const height = 45 * scale;
  context.fillStyle = '#202637';
  context.fillRect(x - width / 2 - 3 * scale, y - height / 2 + 5 * scale, width + 6 * scale, height - 1 * scale);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x - width * .43, y + height * .42);
  context.lineTo(x - width * .38, y - height * .22);
  context.lineTo(x - width * .23, y - height * .49);
  context.lineTo(x + width * .23, y - height * .49);
  context.lineTo(x + width * .38, y - height * .22);
  context.lineTo(x + width * .43, y + height * .42);
  context.closePath();
  context.fill();
  context.fillStyle = '#cde5ec';
  context.fillRect(x - width * .24, y - height * .34, width * .48, height * .2);
  context.fillStyle = '#f8df87';
  context.fillRect(x - width * .32, y + height * .3, width * .16, height * .07);
  context.fillRect(x + width * .16, y + height * .3, width * .16, height * .07);
}

export default function ThreeDCarGame({ game }: { game: CarGame }) {
  const track = TRACKS[game.id] ?? TRACKS['neon-skyline-3d'];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const itemsRef = useRef<Item[]>([]);
  const laneRef = useRef(0);
  const jumpRef = useRef(0);
  const [frame, setFrame] = useState(0);
  const [lane, setLane] = useState(0);
  const [jump, setJump] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(35);
  const [message, setMessage] = useState('');
  laneRef.current = lane;
  jumpRef.current = jump;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const nextFrame = frameRef.current + 1;
      frameRef.current = nextFrame;
      setFrame(nextFrame);
      setJump((value) => Math.max(0, value - 1));
      const moved = itemsRef.current.map((item) => ({ ...item, depth: item.depth + track.speed }));
      if (nextFrame % 13 === 0) {
        const lane = laneFor(game.id, nextFrame);
        const kind: Item['kind'] = track.mode === 'collect' || track.mode === 'delivery'
          ? (nextFrame % 26 === 0 ? 'traffic' : 'token')
          : track.mode === 'stunt' && nextFrame % 39 === 0 ? 'ramp' : 'traffic';
        moved.push({ id: nextFrame, lane, depth: 0.02, kind });
      }
      let crashed = false;
      for (const item of moved) {
        if (item.depth < .86 || item.depth >= .98 || item.lane !== laneRef.current) continue;
        if (item.kind === 'token') {
          setScore((value) => value + (track.mode === 'delivery' ? 20 : 10));
          setMessage(track.mode === 'delivery' ? 'Parcel collected!' : 'Token collected!');
          item.depth = 1.1;
        } else if (item.kind === 'ramp') {
          if (jumpRef.current > 0) {
            setScore((value) => value + 25);
            setMessage('Great jump!');
          } else {
            crashed = true;
            setMessage('Missed the ramp. Try again!');
          }
          item.depth = 1.1;
        } else if (track.mode === 'smash') {
          setScore((value) => value + 15);
          setMessage('Obstacle smashed!');
          item.depth = 1.1;
        } else {
          crashed = true;
          setMessage(track.mode === 'survive' ? 'The pursuit caught up!' : 'Crash! Try another run.');
        }
      }
      itemsRef.current = moved.filter((item) => item.depth < 1.08);
      setItems(itemsRef.current);
      if (crashed) { setRunning(false); setEnded(true); }
      if (nextFrame % 15 === 0 && track.mode !== 'collect' && track.mode !== 'delivery') {
        setScore((value) => value + 1);
      }
      if (nextFrame % 13 === 0 && track.mode === 'survive' && nextFrame > 400) {
        setMessage('Escaped the pursuit!');
        setRunning(false);
        setEnded(true);
      }
      if (nextFrame % 13 === 0 && (track.mode === 'collect' || track.mode === 'delivery') && nextFrame > 455) {
        setMessage('Route complete!');
        setRunning(false);
        setEnded(true);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [running, game.id, track]);

  useEffect(() => {
    if (!running || (track.mode !== 'survive' && track.mode !== 'collect' && track.mode !== 'delivery')) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) {
        setRunning(false);
        setEnded(true);
        setMessage(track.mode === 'survive' ? 'You made it through the chase!' : 'Time is up. Great driving!');
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, track.mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const width = canvas.width;
    const height = canvas.height;
    const horizon = 92;
    context.clearRect(0, 0, width, height);
    context.fillStyle = track.sky;
    context.fillRect(0, 0, width, horizon);
    context.fillStyle = track.ground;
    context.fillRect(0, horizon, width, height - horizon);
    context.fillStyle = 'rgba(255,255,255,.17)';
    context.beginPath();
    context.ellipse(110, 45, 34, 10, -.1, 0, Math.PI * 2);
    context.ellipse(485, 32, 43, 12, .1, 0, Math.PI * 2);
    context.fill();

    const roadPoint = (progress: number) => {
      const perspective = progress * progress;
      const curve = Math.sin(frame / 42 + progress * 3.4) * track.curve * 78 * perspective;
      return {
        y: horizon + perspective * (height - horizon),
        center: width / 2 + curve,
        half: 48 + perspective * 218,
      };
    };
    for (let segment = 0; segment < 14; segment++) {
      const p1 = segment / 14;
      const p2 = (segment + 1) / 14;
      const a = roadPoint(p1);
      const b = roadPoint(p2);
      context.fillStyle = segment % 2 ? track.accent : '#f3eee0';
      const curbA = a.half * 1.13;
      const curbB = b.half * 1.13;
      context.beginPath();
      context.moveTo(a.center - curbA, a.y);
      context.lineTo(a.center + curbA, a.y);
      context.lineTo(b.center + curbB, b.y);
      context.lineTo(b.center - curbB, b.y);
      context.closePath();
      context.fill();
      context.fillStyle = track.road;
      context.beginPath();
      context.moveTo(a.center - a.half, a.y);
      context.lineTo(a.center + a.half, a.y);
      context.lineTo(b.center + b.half, b.y);
      context.lineTo(b.center - b.half, b.y);
      context.closePath();
      context.fill();
      if (segment % 2 === Math.floor(frame / 7) % 2) {
        context.fillStyle = 'rgba(247,239,215,.8)';
        for (let divider = 1; divider < 5; divider++) {
          const xa = a.center - a.half + (a.half * 2 * divider) / 5;
          const xb = b.center - b.half + (b.half * 2 * divider) / 5;
          context.beginPath();
          context.moveTo(xa - 1, a.y);
          context.lineTo(xa + 1, a.y);
          context.lineTo(xb + 2, b.y);
          context.lineTo(xb - 2, b.y);
          context.fill();
        }
      }
    }

    for (let side = 0; side < 8; side++) {
      const y = horizon + ((side * 47 + frame * 3) % 205);
      const progress = (y - horizon) / (height - horizon);
      const point = roadPoint(progress);
      const size = 5 + progress * 17;
      context.fillStyle = side % 2 ? track.accent : track.ground;
      for (const sign of [-1, 1]) {
        const x = point.center + sign * (point.half + size * 1.8);
        if (game.id.includes('jungle') || game.id.includes('alpine') || game.id.includes('monster')) {
          context.beginPath();
          context.arc(x, y - size * .5, size, 0, Math.PI * 2);
          context.fill();
          context.fillRect(x - size * .25, y - size * .25, size * .5, size);
        } else {
          context.fillRect(x - size * .45, y - size, size * .9, size * 1.4);
          context.fillStyle = '#f7edd3';
          context.fillRect(x - size * .3, y - size * .75, size * .6, size * .25);
          context.fillStyle = side % 2 ? track.accent : track.ground;
        }
      }
    }

    items.forEach((item) => {
      const point = roadPoint(item.depth);
      const x = point.center + item.lane * point.half * .39;
      const scale = .32 + item.depth * 1.2;
      if (item.kind === 'token') {
        context.fillStyle = track.accent;
        context.beginPath();
        context.arc(x, point.y - 12 * scale, 8 * scale, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#fff2c8';
        context.lineWidth = 2;
        context.stroke();
      } else if (item.kind === 'ramp') {
        context.fillStyle = '#ec7658';
        context.beginPath();
        context.moveTo(x - 20 * scale, point.y + 13 * scale);
        context.lineTo(x + 20 * scale, point.y + 13 * scale);
        context.lineTo(x + 14 * scale, point.y - 8 * scale);
        context.lineTo(x - 14 * scale, point.y - 8 * scale);
        context.closePath();
        context.fill();
      } else drawCar(context, x, point.y, scale, '#d3b755');
    });

    const camera = roadPoint(.93);
    const carX = camera.center + lane * camera.half * .39;
    const carY = 275 - (jump > 0 ? Math.min(46, jump * 5) : 0);
    drawCar(context, carX, carY, game.id === 'monster-truck-3d' ? 1.7 : 1.35, track.car);
    if (track.mode === 'survive' && running) {
      context.fillStyle = '#df6567';
      context.fillRect(18, 48, Math.min(160, frame % 120), 7);
      context.strokeStyle = '#f4efe3';
      context.strokeRect(18, 48, 160, 7);
    }
    context.fillStyle = '#fff7e4';
    context.font = '700 13px sans-serif';
    context.fillText(track.label, 17, 23);
  }, [frame, lane, jump, items, game.id, track, running]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!running) return;
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
        event.preventDefault();
        setLane((value) => Math.max(-2, value - 1));
      } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
        event.preventDefault();
        setLane((value) => Math.min(2, value + 1));
      } else if (event.code === 'Space' && track.mode === 'stunt') {
        event.preventDefault();
        setJump(12);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, track.mode]);

  const start = () => {
    frameRef.current = 0;
    itemsRef.current = [];
    setFrame(0);
    setItems(itemsRef.current);
    setLane(0);
    setJump(0);
    setScore(0);
    setTime(track.mode === 'survive' ? 35 : track.mode === 'collect' || track.mode === 'delivery' ? 40 : 35);
    setEnded(false);
    setMessage('');
    setRunning(true);
  };
  const shift = (direction: number) => setLane((value) => Math.max(-2, Math.min(2, value + direction)));
  const objective = track.mode === 'collect' ? 'Collect glowing tokens and stay on the road.'
    : track.mode === 'delivery' ? 'Pick up parcels; avoid traffic until the route is complete.'
      : track.mode === 'stunt' ? 'Use Jump or Space as a ramp reaches your car.'
        : track.mode === 'smash' ? 'Drive into trail obstacles to smash them for points.'
          : track.mode === 'drift' ? 'Steer through the bends. The winding road shifts with the track.'
            : track.mode === 'survive' ? 'Survive the chase. Avoid traffic and keep moving.'
              : 'Steer around traffic. Use the arrows or A / D keys.';

  return <div className="exp-game">
    <div className="exp-score">{track.mode === 'survive' || track.mode === 'collect' || track.mode === 'delivery' ? <>Time <b>{time}s</b> · </> : null}Score <b>{score}</b>{ended && message ? <span> · {message}</span> : null}</div>
    <canvas ref={canvasRef} className="race-canvas car3d-canvas" width={600} height={320} data-testid={`canvas-${game.id}`}/>
    <p className="exp-hint">{message || objective}</p>
    <div className="exp-controls">
      <button className="mini-button" onClick={() => shift(-1)} aria-label="Steer left" data-testid={`button-${game.id}-left`}><ArrowLeft size={18}/></button>
      <button className="mini-button" onClick={() => shift(1)} aria-label="Steer right" data-testid={`button-${game.id}-right`}><ArrowRight size={18}/></button>
      {track.mode === 'stunt' && <button className="mini-button" onClick={() => setJump(12)} data-testid="button-stunt-jump">Jump</button>}
    </div>
    {!running && <button className="mini-button" onClick={start} data-testid={`button-${game.id}-start`}>{ended ? 'Race again' : 'Start drive'}</button>}
  </div>;
}
