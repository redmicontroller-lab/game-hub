import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check,
  ChevronRight, CircleHelp, Clock3, Gamepad2, Heart, Keyboard,
  RotateCcw, Search, Sparkles, X,
} from 'lucide-react';

type GameId = 'snake' | 'memory' | 'tic-tac-toe' | '2048';
type GameInfo = { id: GameId; name: string; category: string; duration: string; description: string };

const GAMES: GameInfo[] = [
  { id: 'snake', name: 'Snake', category: 'Arcade', duration: '2–5 min', description: 'One more bite. Guide your little green friend.' },
  { id: 'memory', name: 'Memory Match', category: 'Puzzle', duration: '3–6 min', description: 'Flip the tiles. Find the matching pairs.' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', category: 'Two-player', duration: '1–2 min', description: 'A tiny classic. Bring a friend or play both sides.' },
  { id: '2048', name: '2048', category: 'Puzzle', duration: '5–10 min', description: 'Slide, combine, and make the big number.' },
];
const FILTERS = ['All games', 'Arcade', 'Puzzle', 'Two-player', 'Favorites'];
const MEMORY_FACES = ['◆', '●', '▲', '■', '✦', '⬟', '✚', '◒'];
const STORAGE_FAVS = 'button-arcade-favorites';
const BEST_PREFIX = 'button-arcade-best-';

function safeRead(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveBest(game: GameId, score: number) {
  try {
    const key = `${BEST_PREFIX}${game}`;
    const previous = Number(localStorage.getItem(key) || 0);
    if (score > previous) localStorage.setItem(key, String(score));
  } catch { /* best scores are a nice-to-have */ }
}
function bestScore(game: GameId) {
  return Number(safeRead(`${BEST_PREFIX}${game}`, '0'));
}
function shuffledFaces() {
  return [...MEMORY_FACES, ...MEMORY_FACES]
    .map((face) => ({ face, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item, index) => ({ id: index, face: item.face }));
}
function winnerOf(board: string[]) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : '';
}
function spawnTile(board: number[]) {
  const empty = board.map((value, index) => value === 0 ? index : -1).filter((index) => index >= 0);
  if (!empty.length) return board;
  const next = [...board];
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  return next;
}
function shift2048(board: number[], direction: string) {
  const next = [...board];
  let gained = 0;
  for (let line = 0; line < 4; line++) {
    const indices = direction === 'left' || direction === 'right'
      ? [0,1,2,3].map((col) => line * 4 + col)
      : [0,1,2,3].map((row) => row * 4 + line);
    if (direction === 'right' || direction === 'down') indices.reverse();
    const values = indices.map((index) => board[index]).filter(Boolean);
    const compact: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        compact.push(values[i] * 2); gained += values[i] * 2; i++;
      } else compact.push(values[i]);
    }
    while (compact.length < 4) compact.push(0);
    indices.forEach((index, i) => { next[index] = compact[i]; });
  }
  return { board: next, gained };
}

function Art({ game }: { game: GameId }) {
  if (game === 'snake') return <div className="snake-mark" aria-hidden="true" />;
  if (game === 'memory') return <div className="art-pattern" aria-hidden="true"><i>◆</i><i>●</i><i>●</i><i>◆</i></div>;
  if (game === 'tic-tac-toe') return <div className="art-pattern" aria-hidden="true"><i>X</i><i>O</i><i>O</i><i>X</i></div>;
  return <div className="art-pattern" aria-hidden="true"><i>2</i><i>4</i><i>8</i><i>16</i></div>;
}

function GameModal({ game, onClose }: { game: GameInfo; onClose: () => void }) {
  const [started, setStarted] = useState(false);
  const [snake, setSnake] = useState([119, 118, 117]);
  const [food, setFood] = useState(85);
  const [snakeDir, setSnakeDir] = useState('right');
  const [snakeOver, setSnakeOver] = useState(false);
  const [memoryCards, setMemoryCards] = useState(shuffledFaces);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [ttt, setTtt] = useState(Array(9).fill('') as string[]);
  const [tttTurn, setTttTurn] = useState('X');
  const [board, setBoard] = useState(() => spawnTile(spawnTile(Array(16).fill(0))));
  const [score, setScore] = useState(0);
  const [over2048, setOver2048] = useState(false);
  const [best, setBest] = useState(() => bestScore(game.id));
  const [snakeBest, setSnakeBest] = useState(() => bestScore('snake'));

  const reset = useCallback(() => {
    setStarted(false);
    setSnake([119, 118, 117]); setFood(85); setSnakeDir('right'); setSnakeOver(false);
    setMemoryCards(shuffledFaces()); setFlipped([]); setMatched([]); setMoves(0);
    setTtt(Array(9).fill('')); setTttTurn('X');
    setBoard(spawnTile(spawnTile(Array(16).fill(0)))); setScore(0); setOver2048(false);
  }, []);
  const replayGame = useCallback(() => {
    setSnake([119, 118, 117]); setFood(85); setSnakeDir('right'); setSnakeOver(false);
    setMemoryCards(shuffledFaces()); setFlipped([]); setMatched([]); setMoves(0);
    setTtt(Array(9).fill('')); setTttTurn('X');
    setBoard(spawnTile(spawnTile(Array(16).fill(0)))); setScore(0); setOver2048(false);
    setStarted(true);
  }, []);
  const moveSnake = useCallback((direction: string) => {
    setSnakeDir((current) => {
      if ((direction === 'up' && current === 'down') || (direction === 'down' && current === 'up') ||
          (direction === 'left' && current === 'right') || (direction === 'right' && current === 'left')) return current;
      return direction;
    });
  }, []);
  const move2048 = useCallback((direction: string) => {
    if (!started || over2048) return;
    setBoard((current) => {
      const shifted = shift2048(current, direction);
      if (shifted.board.every((value, index) => value === current[index])) return current;
      setScore((old) => {
        const updated = old + shifted.gained;
        setBest((currentBest) => { const next = Math.max(currentBest, updated); saveBest('2048', next); return next; });
        return updated;
      });
      const next = spawnTile(shifted.board);
      if (!next.some((value) => value === 0)) {
        const canMove = ['left','right','up','down'].some((dir) => {
          const candidate = shift2048(next, dir).board;
          return candidate.some((value, index) => value !== next[index]);
        });
        if (!canMove) setOver2048(true);
      }
      return next;
    });
  }, [started, over2048]);

  useEffect(() => {
    if (!started || game.id !== 'snake' || snakeOver) return;
    const timer = window.setInterval(() => {
      setSnake((current) => {
        const head = current[0];
        const nextHead = head + (snakeDir === 'right' ? 1 : snakeDir === 'left' ? -1 : snakeDir === 'down' ? 16 : -16);
        const wall = nextHead < 0 || nextHead > 255 || (snakeDir === 'right' && head % 16 === 15) || (snakeDir === 'left' && head % 16 === 0);
        if (wall || current.includes(nextHead)) { setSnakeOver(true); setStarted(false); return current; }
        const next = [nextHead, ...current];
        if (nextHead === food) {
          const newBest = Math.max(snakeBest, next.length - 3);
          if (newBest !== snakeBest) { setSnakeBest(newBest); saveBest('snake', newBest); }
          let nextFood = Math.floor(Math.random() * 256);
          while (next.includes(nextFood)) nextFood = Math.floor(Math.random() * 256);
          setFood(nextFood);
        } else next.pop();
        return next;
      });
    }, 155);
    return () => window.clearInterval(timer);
  }, [started, game.id, snakeDir, snakeOver, food, snakeBest]);

  useEffect(() => {
    if (!started || game.id !== 'snake' && game.id !== '2048') return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const directions: Record<string,string> = { arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right' };
      if (directions[key]) {
        event.preventDefault();
        if (game.id === 'snake') moveSnake(directions[key]); else move2048(directions[key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, game.id, moveSnake, move2048]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [first, second] = flipped;
    setMoves((count) => count + 1);
    if (memoryCards[first].face === memoryCards[second].face) {
      setMatched((items) => [...items, first, second]); setFlipped([]);
      return undefined;
    } else {
      const timer = window.setTimeout(() => setFlipped([]), 750);
      return () => window.clearTimeout(timer);
    }
  }, [flipped, memoryCards]);

  useEffect(() => {
    if (!started || game.id !== 'tic-tac-toe' || tttTurn !== 'O' || winnerOf(ttt)) return;
    const timer = window.setTimeout(() => {
      const choices = ttt.map((value,index) => value ? -1 : index).filter((index) => index >= 0);
      if (!choices.length) return;
      const next = [...ttt]; next[choices[Math.floor(Math.random() * choices.length)]] = 'O';
      setTtt(next); setTttTurn('X');
    }, 450);
    return () => window.clearTimeout(timer);
  }, [started, game.id, ttt, tttTurn]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);

  const tttResult = winnerOf(ttt);
  const memoryComplete = matched.length === 16;
  const startGame = () => setStarted(true);
  const tapMemory = (index: number) => {
    if (!started || flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    setFlipped((items) => [...items, index]);
  };
  const tapTtt = (index: number) => {
    if (!started || ttt[index] || tttResult || tttTurn !== 'X') return;
    const next = [...ttt]; next[index] = 'X'; setTtt(next); setTttTurn('O');
  };
  const statusText = game.id === 'snake'
    ? snakeOver ? 'Nice run. Fancy another?' : started ? 'Keep moving. Don’t bite your tail.' : 'Ready when you are.'
    : game.id === 'memory' ? memoryComplete ? `All pairs found in ${moves} moves.` : started ? 'Find all 8 matching pairs.' : 'Flip two tiles and see what sticks.'
    : game.id === 'tic-tac-toe' ? tttResult ? tttResult === 'draw' ? 'A neat little draw.' : tttResult === 'X' ? 'You got three in a row.' : 'The computer got this one.' : started ? tttTurn === 'X' ? 'Your turn — you are X.' : 'The computer is thinking…' : 'A classic, just you and the grid.'
    : over2048 ? 'No more moves. Give it another go?' : started ? 'Slide matching tiles together.' : 'Can you make it all the way to 2048?';

  return <div className="game-overlay" data-testid="dialog-game" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="game-modal" role="dialog" aria-modal="true" aria-label={`${game.name} game`}>
      <header className="modal-head">
        <div className="modal-title-group"><div className={`art-icon art-${game.id}`} style={{width:42,height:42,borderRadius:12,boxShadow:'2px 3px 0 #252b40',transform:'none'}}><Gamepad2 size={20}/></div>
          <div><h2 data-testid={`title-game-${game.id}`}>{game.name}</h2><p>Free to play · right here in your browser</p></div>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close game" data-testid="button-close-game"><X size={19}/></button>
      </header>
      <div className="modal-body">
        <div className="game-toolbar">
          <div className="score-box">
            {game.id === 'memory' && <div className="score-chip"><small>Moves</small><strong>{moves}</strong></div>}
            {game.id === 'snake' && <div className="score-chip"><small>Length</small><strong>{snake.length}</strong></div>}
            {game.id === '2048' && <><div className="score-chip"><small>Score</small><strong>{score}</strong></div><div className="score-chip"><small>Best</small><strong>{best}</strong></div></>}
            {game.id === 'tic-tac-toe' && <div className="score-chip"><small>Match</small><strong>01</strong></div>}
            {game.id === 'snake' && <div className="score-chip"><small>Best</small><strong>{snakeBest}</strong></div>}
          </div>
          <button className="action-button secondary" onClick={reset} data-testid={`button-reset-${game.id}`}><RotateCcw size={15}/> Reset</button>
        </div>
        <p className="game-status" data-testid={`status-game-${game.id}`}>{statusText}</p>
        {game.id === 'snake' && <div className="snake-board" aria-label="Snake game board" data-testid="board-snake">
          {Array.from({length:256},(_,index) => <div key={index} className={`snake-cell ${snake[0] === index ? 'head' : snake.includes(index) ? 'snake' : food === index ? 'food' : ''}`}/>)}
        </div>}
        {game.id === 'memory' && <div className="memory-board" data-testid="board-memory">
          {memoryCards.map((card) => {
            const visible = flipped.includes(card.id) || matched.includes(card.id);
            return <button key={card.id} className={`memory-card ${visible ? 'revealed' : ''} ${matched.includes(card.id) ? 'matched' : ''}`} onClick={() => tapMemory(card.id)} aria-label={visible ? `Card ${card.face}` : 'Flip hidden card'} data-testid={`card-memory-${card.id}`}>
              {visible ? card.face : <span style={{fontSize:18}}>+</span>}
            </button>;
          })}
        </div>}
        {game.id === 'tic-tac-toe' && <div className="ttt-board" data-testid="board-tic-tac-toe">
          {ttt.map((cell,index) => <button key={index} className="ttt-cell" onClick={() => tapTtt(index)} disabled={!started || !!cell || !!tttResult || tttTurn !== 'X'} aria-label={`Square ${index + 1}${cell ? `, ${cell}` : ''}`} data-testid={`cell-ttt-${index}`}>{cell}</button>)}
        </div>}
        {game.id === '2048' && <div className="board-2048" data-testid="board-2048" onTouchStart={(event) => {
          const touch = event.touches[0]; (event.currentTarget as HTMLDivElement).dataset.touchX = String(touch.clientX); (event.currentTarget as HTMLDivElement).dataset.touchY = String(touch.clientY);
        }} onTouchEnd={(event) => {
          const el = event.currentTarget; const dx = event.changedTouches[0].clientX - Number(el.dataset.touchX); const dy = event.changedTouches[0].clientY - Number(el.dataset.touchY);
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) move2048(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
        }}>
          {board.map((value,index) => <div key={index} className={`tile-2048 ${value ? `v${value}` : ''}`} data-testid={`tile-2048-${index}`}>{value || ''}</div>)}
        </div>}
        {game.id === 'snake' && started && <div className="mobile-pad" aria-label="Snake controls">
          <button onClick={() => moveSnake('up')} aria-label="Move up" data-testid="button-snake-up"><ArrowUp size={18}/></button>
          <button onClick={() => moveSnake('left')} aria-label="Move left" data-testid="button-snake-left"><ArrowLeft size={18}/></button>
          <button onClick={() => moveSnake('down')} aria-label="Move down" data-testid="button-snake-down"><ArrowDown size={18}/></button>
          <button onClick={() => moveSnake('right')} aria-label="Move right" data-testid="button-snake-right"><ArrowRight size={18}/></button>
        </div>}
        {game.id === '2048' && started && <div className="mobile-pad" aria-label="2048 controls">
          <button onClick={() => move2048('up')} aria-label="Slide up" data-testid="button-2048-up"><ArrowUp size={18}/></button>
          <button onClick={() => move2048('left')} aria-label="Slide left" data-testid="button-2048-left"><ArrowLeft size={18}/></button>
          <button onClick={() => move2048('down')} aria-label="Slide down" data-testid="button-2048-down"><ArrowDown size={18}/></button>
          <button onClick={() => move2048('right')} aria-label="Slide right" data-testid="button-2048-right"><ArrowRight size={18}/></button>
        </div>}
        <p className="game-help">{game.id === 'snake' || game.id === '2048' ? <><Keyboard size={13} style={{verticalAlign:'-2px',marginRight:5}}/>Use arrow keys or WASD{game.id === '2048' ? ' · swipe on touch screens' : ''}</> : game.id === 'tic-tac-toe' ? 'You are X · the computer plays O' : 'Take your time — there’s no clock.'}</p>
        {!started && !snakeOver && !memoryComplete && !tttResult && !over2048 && <div style={{display:'flex',justifyContent:'center',marginTop:17}}>
          <button className="action-button" onClick={startGame} data-testid={`button-start-${game.id}`}><Sparkles size={15}/> Start playing <ChevronRight size={16}/></button>
        </div>}
        {(snakeOver || memoryComplete || !!tttResult || over2048) && <div style={{display:'flex',justifyContent:'center',marginTop:16}}>
          <button className="action-button" onClick={replayGame} data-testid={`button-replay-${game.id}`}><RotateCcw size={15}/> Play again</button>
        </div>}
      </div>
    </section>
  </div>;
}

export default function Home() {
  const [category, setCategory] = useState('All games');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<GameId[]>(() => {
    try { return JSON.parse(safeRead(STORAGE_FAVS, '[]')) as GameId[]; } catch { return []; }
  });
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_FAVS, JSON.stringify(favorites)); } catch { /* favorites remain available for this session */ }
  }, [favorites]);
  const visibleGames = useMemo(() => GAMES.filter((game) => {
    const matchesSearch = `${game.name} ${game.category} ${game.description}`.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = category === 'All games' || (category === 'Favorites' ? favorites.includes(game.id) : game.category === category);
    return matchesSearch && matchesCategory;
  }), [category, favorites, search]);
  const toggleFavorite = (id: GameId) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const scrollToGames = () => document.getElementById('game-lobby')?.scrollIntoView({behavior:'smooth'});
  const startGame = (game: GameInfo) => { setActiveGame(game); setNotice(false); };

  return <div className="hub-shell">
    <header className="topbar">
      <button className="brand" onClick={() => { setCategory('All games'); setSearch(''); window.scrollTo({top:0,behavior:'smooth'}); }} data-testid="link-home">
        <span className="brand-mark"><Gamepad2 size={21}/></span><span>Button Arcade</span>
      </button>
      <nav className="top-actions" aria-label="Main navigation">
        <button onClick={scrollToGames} style={{border:0,background:'none',color:'inherit',fontWeight:600}} data-testid="link-browse-games">Browse games</button>
        <button onClick={() => { setCategory('Favorites'); scrollToGames(); }} style={{border:0,background:'none',color:'inherit',fontWeight:600,display:'flex',alignItems:'center',gap:6}} data-testid="link-favorites"><Heart size={14}/> Favorites</button>
        <span className="free-pill"><Check size={13}/> Always free</span>
      </nav>
    </header>
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="eyebrow">A little break, well spent</div>
          <h1>Good games.<br/><em>Zero fuss.</em></h1>
          <p>Pick a game, get straight to the fun. No sign-up, no downloads, just a happy little high score.</p>
          <button className="action-button" onClick={scrollToGames} style={{marginTop:24,padding:'13px 17px'}} data-testid="button-explore"><Gamepad2 size={17}/> Find your next game <ArrowUpRight size={16}/></button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <span className="orbit-star one">✳</span><span className="orbit-star two">✦</span><span className="swoosh"/>
          <div className="arcade-cabinet"><div className="cabinet-screen"><Sparkles size={26}/></div><div className="cabinet-controls"><span className="joystick"/><span className="cabinet-buttons"><i/><i/></span></div></div>
        </div>
      </div>
    </section>
    <main className="main-wrap" id="game-lobby">
      <div className="section-top">
        <div><h2 className="section-title" data-testid="text-lobby-title">{category === 'Favorites' ? 'Your favorites' : 'Choose your game'}</h2><p className="section-subtitle">{category === 'Favorites' ? `${favorites.length} saved for later` : 'Small games for your in-between moments.'}</p></div>
        <div className="tool-row">
          <label className="search-box"><Search size={17}/><input type="search" placeholder="Find a game..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search games" data-testid="input-search-games"/></label>
        </div>
      </div>
      <div className="filter-row" role="group" aria-label="Filter games">
        {FILTERS.map((filter) => <button key={filter} className={`filter-chip ${category === filter ? 'active' : ''}`} onClick={() => setCategory(filter)} data-testid={`filter-${filter.toLowerCase().replaceAll(' ','-')}`}>{filter === 'Favorites' && <Heart size={12} style={{verticalAlign:'-2px',marginRight:5}}/>}{filter}</button>)}
      </div>
      <div className="games-grid" data-testid="grid-games">
        {visibleGames.map((game) => <article className="game-card" key={game.id} data-testid={`card-game-${game.id}`}>
          <div className={`card-art art-${game.id}`} onClick={() => startGame(game)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') startGame(game); }} aria-label={`Play ${game.name}`} data-testid={`art-game-${game.id}`}>
            <button className={`favorite-btn ${favorites.includes(game.id) ? 'favorited' : ''}`} onClick={(event) => { event.stopPropagation(); toggleFavorite(game.id); }} aria-label={favorites.includes(game.id) ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`} data-testid={`button-favorite-${game.id}`}><Heart size={17} fill={favorites.includes(game.id) ? 'currentColor' : 'none'}/></button>
            <div className="art-icon"><Art game={game.id}/></div>
          </div>
          <div className="card-content">
            <div className="card-meta"><span className="game-category">{game.category}</span><span className="game-duration"><Clock3 size={11} style={{verticalAlign:'-2px',marginRight:4}}/>{game.duration}</span></div>
            <h3>{game.name}</h3><p>{game.description}</p>
            <button className="play-card" onClick={() => startGame(game)} data-testid={`button-play-${game.id}`}>Play now <span><ChevronRight size={16}/></span></button>
          </div>
        </article>)}
        {!visibleGames.length && <div className="empty-state" data-testid="empty-games"><CircleHelp size={25}/><h3>{category === 'Favorites' && !favorites.length ? 'Nothing saved just yet' : 'No games found'}</h3><p>{category === 'Favorites' && !favorites.length ? 'Tap the little heart on a game to keep it close.' : 'Try another search or choose a different filter.'}</p>{category === 'Favorites' && !favorites.length && <button className="action-button" onClick={() => setCategory('All games')} style={{margin:'15px auto 0'}} data-testid="button-browse-from-empty">Browse games</button>}</div>}
      </div>
      <footer className="footer-note"><span><strong>Button Arcade</strong> — here for the little breaks.</span><button onClick={() => setShowHow(true)} style={{border:0,background:'none',color:'#65685f',display:'flex',gap:6,alignItems:'center'}} data-testid="button-how-it-works"><CircleHelp size={14}/> How this works</button></footer>
    </main>
    {activeGame && <GameModal key={activeGame.id} game={activeGame} onClose={() => setActiveGame(null)}/>}
    {showHow && <div className="game-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHow(false); }} data-testid="dialog-how">
      <section className="game-modal" role="dialog" aria-modal="true" aria-label="How Button Arcade works" style={{maxWidth:470}}>
        <header className="modal-head"><div className="modal-title-group"><span className="brand-mark"><Gamepad2 size={20}/></span><div><h2>Just press play.</h2><p>No fine print. No funny business.</p></div></div><button className="icon-button" onClick={() => setShowHow(false)} aria-label="Close" data-testid="button-close-how"><X size={19}/></button></header>
        <div className="modal-body" style={{lineHeight:1.65,color:'#5f625a'}}>
          <p>Every game runs right here in your browser. No account, install, or internet connection after the page loads.</p>
          <p>Your favorites and personal bests stay on this device only. We don’t collect scores or ask for your details.</p>
          <button className="action-button" onClick={() => setShowHow(false)} data-testid="button-got-it"><Check size={15}/> Got it</button>
        </div>
      </section>
    </div>}
    {notice && <div aria-live="polite" data-testid="status-notice"/>}
  </div>;
}
