"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3,
  26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const QUESTIONS = [
  "Where will the ball land? Place your bets.",
  "Red or black — which side owns this spin?",
  "Odd or even — trust your first instinct.",
  "Low numbers or high numbers — make the call.",
  "One number can change the table. Which is yours?",
];

const CLASSIC_CHIPS = [5, 25, 100, 500];
const HIGH_ROLLER_CHIPS = [25, 100, 500, 1000];
const BETTING_SECONDS = 24;

type Screen = "menu" | "game";
type GameView = "wheel" | "board";
type RoundState = "betting" | "spinning" | "result";
type ChipSet = "classic" | "high-roller";
type Bets = Record<string, number>;

type Settings = {
  sound: boolean;
  bankroll: number;
  tableLimit: number;
  chipSet: ChipSet;
};

const defaultSettings: Settings = {
  sound: true,
  bankroll: 5000,
  tableLimit: 1000,
  chipSet: "classic",
};

const numberColor = (number: number) => {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

function betWins(zone: string, result: number) {
  if (zone.startsWith("number-")) return Number(zone.slice(7)) === result;
  if (result === 0) return false;

  switch (zone) {
    case "red": return RED_NUMBERS.has(result);
    case "black": return !RED_NUMBERS.has(result);
    case "even": return result % 2 === 0;
    case "odd": return result % 2 === 1;
    case "low": return result >= 1 && result <= 18;
    case "high": return result >= 19 && result <= 36;
    case "dozen-1": return result >= 1 && result <= 12;
    case "dozen-2": return result >= 13 && result <= 24;
    case "dozen-3": return result >= 25 && result <= 36;
    case "column-1": return result % 3 === 1;
    case "column-2": return result % 3 === 2;
    case "column-3": return result % 3 === 0;
    default: return false;
  }
}

function payoutMultiplier(zone: string) {
  if (zone.startsWith("number-")) return 36;
  if (zone.startsWith("dozen-") || zone.startsWith("column-")) return 3;
  return 2;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
      <span className="brand-crown" aria-hidden="true">♛</span>
      <div><span className="brand-name">GAMBL</span><span className="brand-sub">ROULETTE</span></div>
    </div>
  );
}

function Icon({ name }: { name: "play" | "rules" | "settings" | "sound" | "mute" | "menu" | "back" }) {
  const icons = { play: "▶", rules: "?", settings: "⚙", sound: "♪", mute: "×", menu: "☰", back: "‹" };
  return <span className="button-icon" aria-hidden="true">{icons[name]}</span>;
}

function Dialog({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        <p className="eyebrow">{eyebrow}</p><h2>{title}</h2><div className="gold-rule" />{children}
      </section>
    </div>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="How to play" eyebrow="The house rules" onClose={onClose}>
      <div className="rules-list">
        <article><span>01</span><div><h3>Choose your chip</h3><p>Select a value from the tray. Your total bet may not exceed the table limit.</p></div></article>
        <article><span>02</span><div><h3>Make your call</h3><p>Tap any number or outside bet while the live dealer question and countdown are active.</p></div></article>
        <article><span>03</span><div><h3>Spin the wheel</h3><p>Straight numbers pay 35:1, dozens and columns pay 2:1, and even-money bets pay 1:1.</p></div></article>
      </div>
      <div className="rules-note"><b>European roulette</b><span>37 pockets · single zero · 2.70% house edge</span></div>
      <button className="primary-button dialog-action" onClick={onClose}>I’m ready</button>
    </Dialog>
  );
}

function SettingsDialog({ settings, onChange, onClose }: { settings: Settings; onChange: (settings: Settings) => void; onClose: () => void }) {
  return (
    <Dialog title="Table settings" eyebrow="Make it yours" onClose={onClose}>
      <div className="settings-list">
        <label className="setting-row">
          <span><b>Casino sound</b><small>Dealer voice, chips and wheel</small></span>
          <button type="button" className={`switch ${settings.sound ? "is-on" : ""}`} role="switch" aria-checked={settings.sound} onClick={() => onChange({ ...settings, sound: !settings.sound })}><span /></button>
        </label>
        <label className="setting-row">
          <span><b>Starting bankroll</b><small>Applied when a new game begins</small></span>
          <select value={settings.bankroll} onChange={(event) => onChange({ ...settings, bankroll: Number(event.target.value) })}><option value="1000">$1,000</option><option value="5000">$5,000</option><option value="10000">$10,000</option></select>
        </label>
        <label className="setting-row">
          <span><b>Table limit</b><small>Maximum total bet per round</small></span>
          <select value={settings.tableLimit} onChange={(event) => onChange({ ...settings, tableLimit: Number(event.target.value) })}><option value="500">$500</option><option value="1000">$1,000</option><option value="2500">$2,500</option></select>
        </label>
        <label className="setting-row">
          <span><b>Chip rack</b><small>Choose your denominations</small></span>
          <select value={settings.chipSet} onChange={(event) => onChange({ ...settings, chipSet: event.target.value as ChipSet })}><option value="classic">Classic</option><option value="high-roller">High roller</option></select>
        </label>
      </div>
      <button className="primary-button dialog-action" onClick={onClose}>Save settings</button>
    </Dialog>
  );
}

function Menu({ onStart, onRules, onSettings }: { onStart: () => void; onRules: () => void; onSettings: () => void }) {
  return (
    <main className="menu-screen">
      <div className="menu-glow menu-glow--blue" /><div className="menu-glow menu-glow--red" /><div className="menu-grain" />
      <div className="menu-wheel" aria-hidden="true"><div className="menu-wheel__rim"><div className="menu-wheel__center">0</div></div></div>
      <header className="menu-topbar"><BrandMark compact /><div className="menu-topbar__right"><span className="live-dot" /> SINGLE PLAYER · EUROPEAN</div></header>
      <section className="menu-content">
        <div className="menu-copy">
          <p className="eyebrow"><span /> Welcome to the table <span /></p>
          <h1>FORTUNE<br /><em>FAVORS</em> THE BOLD</h1>
          <p className="menu-intro">Place your bets. Trust your instinct.<br />Own the moment.</p>
          <div className="menu-actions">
            <button className="primary-button start-button" onClick={onStart} data-testid="start-game"><Icon name="play" /> Start game</button>
            <div className="secondary-actions"><button className="secondary-button" onClick={onRules}><Icon name="rules" /> How to play</button><button className="secondary-button" onClick={onSettings}><Icon name="settings" /> Settings</button></div>
          </div>
        </div>
        <aside className="table-card"><div className="table-card__top"><span className="live-dot" /> Open table <b>№ 07</b></div><div className="table-card__body"><span className="mini-label">Your seat</span><div className="seat-number">1</div><div><b>$5K</b><small>Starting stack</small></div></div><div className="table-card__footer"><span>Single 0</span><span>$5 min</span><span>$1K max</span></div></aside>
      </section>
      <footer className="menu-footer"><span>FANTOMZONE ORIGINAL</span><span>18+ · PLAY RESPONSIBLY</span></footer>
    </main>
  );
}

function Chip({ value, selected = false }: { value: number; selected?: boolean }) {
  return <span className={`chip chip--${value} ${selected ? "is-selected" : ""}`}><span>{value >= 1000 ? `${value / 1000}K` : value}</span></span>;
}

function BetAmount({ amount }: { amount?: number }) {
  if (!amount) return null;
  return <span className="bet-chip" aria-label={`${formatMoney(amount)} bet`}>{amount >= 1000 ? `${amount / 1000}K` : amount}</span>;
}

function RouletteWheel({ result, rotation, spinning }: { result: number | null; rotation: number; spinning: boolean }) {
  const gradient = useMemo(() => {
    const slice = 360 / WHEEL_ORDER.length;
    return `conic-gradient(from -${slice / 2}deg, ${WHEEL_ORDER.map((number, index) => {
      const color = numberColor(number) === "green" ? "#087653" : numberColor(number) === "red" ? "#bf253d" : "#111a29";
      return `${color} ${index * slice}deg ${(index + 1) * slice}deg`;
    }).join(", ")})`;
  }, []);

  return (
    <div className="wheel-panel" data-testid="wheel-panel">
      <div className="wheel-title"><span>European wheel</span><small>Single zero</small></div>
      <div className={`roulette-wrap ${spinning ? "is-spinning" : ""}`}>
        <div className="wheel-pointer" aria-hidden="true" />
        <div className="roulette-wheel" style={{ transform: `rotate(${rotation}deg)` }}><div className="roulette-ring" style={{ background: gradient }}>
          {WHEEL_ORDER.map((number, index) => <span key={number} className="wheel-number" style={{ transform: `rotate(${index * (360 / 37)}deg)` }}><b style={{ transform: `rotate(${-index * (360 / 37)}deg)` }}>{number}</b></span>)}
          <div className="roulette-bowl"><div className="roulette-track"><span className="roulette-ball" /></div></div><div className="roulette-hub"><i /><strong>G</strong><small>ROULETTE</small></div>
        </div></div>
      </div>
      <div className="wheel-result" aria-live="polite">{result === null ? <><span className="result-placeholder">—</span><div><small>Last result</small><b>Waiting for spin</b></div></> : <><span className={`result-number is-${numberColor(result)}`}>{result}</span><div><small>Winning number</small><b>{result === 0 ? "Zero" : `${numberColor(result)} · ${result % 2 ? "Odd" : "Even"}`}</b></div></>}</div>
    </div>
  );
}

function BettingBoard({ bets, result, disabled, onBet }: { bets: Bets; result: number | null; disabled: boolean; onBet: (zone: string) => void }) {
  const numbers = Array.from({ length: 36 }, (_, index) => index + 1);
  const outside = [["low", "1—18"], ["even", "EVEN"], ["red", "RED"], ["black", "BLACK"], ["odd", "ODD"], ["high", "19—36"]];
  return (
    <section className="board-panel" data-testid="board-panel">
      <div className="board-heading"><div><span>Betting table</span><small>Tap any space to place a chip</small></div><div className="limits">MIN $5 <i /> MAX $1K</div></div>
      <div className="board-grid">
        <button className={`zero-cell ${result === 0 ? "is-winner" : ""}`} disabled={disabled} onClick={() => onBet("number-0")} aria-label="Bet on zero">0<BetAmount amount={bets["number-0"]} /></button>
        <div className="number-grid">{numbers.map((number) => <button key={number} className={`number-cell is-${numberColor(number)} ${result === number ? "is-winner" : ""}`} disabled={disabled} onClick={() => onBet(`number-${number}`)} aria-label={`Bet on ${number}`}>{number}<BetAmount amount={bets[`number-${number}`]} /></button>)}</div>
        <div className="column-grid">{[1, 2, 3].map((column) => <button key={column} disabled={disabled} onClick={() => onBet(`column-${column}`)} aria-label={`Bet on column ${column}`}>2:1<BetAmount amount={bets[`column-${column}`]} /></button>)}</div>
      </div>
      <div className="dozen-grid">{[1, 2, 3].map((dozen) => <button key={dozen} disabled={disabled} onClick={() => onBet(`dozen-${dozen}`)}>{dozen === 1 ? "1ST 12" : dozen === 2 ? "2ND 12" : "3RD 12"}<BetAmount amount={bets[`dozen-${dozen}`]} /></button>)}</div>
      <div className="outside-grid">{outside.map(([zone, label]) => <button key={zone} className={zone === "red" ? "outside-red" : zone === "black" ? "outside-black" : ""} disabled={disabled} onClick={() => onBet(zone)}>{label}<BetAmount amount={bets[zone]} /></button>)}</div>
    </section>
  );
}

function Game({ settings, onSettings, onMenu, onToggleSound }: { settings: Settings; onSettings: () => void; onMenu: () => void; onToggleSound: () => void }) {
  const chips = settings.chipSet === "classic" ? CLASSIC_CHIPS : HIGH_ROLLER_CHIPS;
  const [bankroll, setBankroll] = useState(settings.bankroll);
  const [selectedChip, setSelectedChip] = useState(chips[0]);
  const [bets, setBets] = useState<Bets>({});
  const [state, setState] = useState<RoundState>("betting");
  const [seconds, setSeconds] = useState(BETTING_SECONDS);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState("Place your bets");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [view, setView] = useState<GameView>("wheel");
  const [history, setHistory] = useState<number[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const spinningRef = useRef(false);
  const totalBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
  const question = QUESTIONS[questionIndex % QUESTIONS.length];

  const tone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = "sine", volume = 0.04) => {
    if (!settings.sound || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioRef.current ?? new AudioContextClass();
      audioRef.current = context;
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, context.currentTime); gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* Audio is an enhancement; game play remains available. */ }
  }, [settings.sound]);

  const announce = useCallback((text: string) => {
    if (!settings.sound || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.92; utterance.pitch = 0.78; utterance.volume = 0.62; window.speechSynthesis.speak(utterance);
  }, [settings.sound]);

  useEffect(() => { announce(question); return () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }; }, [announce, question]);

  const newRound = useCallback(() => { setBets({}); setResult(null); setState("betting"); setSeconds(BETTING_SECONDS); setMessage("Place your bets"); setQuestionIndex((index) => index + 1); spinningRef.current = false; }, []);

  const spin = useCallback(() => {
    if (spinningRef.current || state !== "betting" || totalBet <= 0) { if (totalBet <= 0) { setMessage("Place at least one bet"); tone(190, 0.18, "square", 0.025); } return; }
    spinningRef.current = true; setState("spinning"); setView("wheel"); setMessage("No more bets"); announce("No more bets. The wheel is spinning.");
    const winningNumber = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)]; const pocketIndex = WHEEL_ORDER.indexOf(winningNumber); setRotation(rotation + 1440 + (360 - pocketIndex * (360 / 37)));
    [0, 260, 540, 860, 1220, 1640, 2100, 2650, 3200].forEach((delay, index) => { window.setTimeout(() => tone(740 - index * 46, 0.045, "square", 0.025), delay); });
    window.setTimeout(() => {
      let winnings = 0; Object.entries(bets).forEach(([zone, amount]) => { if (betWins(zone, winningNumber)) winnings += amount * payoutMultiplier(zone); });
      setBankroll((amount) => amount + winnings); setResult(winningNumber); setHistory((items) => [winningNumber, ...items].slice(0, 7)); setState("result"); setMessage(winnings > 0 ? `You won ${formatMoney(winnings)}` : `${winningNumber} wins · Better luck next spin`);
      if (winnings > 0) { tone(523, 0.18, "sine", 0.06); window.setTimeout(() => tone(659, 0.22, "sine", 0.055), 150); window.setTimeout(() => tone(784, 0.35, "sine", 0.05), 320); } else tone(156, 0.38, "triangle", 0.035);
      announce(`${winningNumber}, ${numberColor(winningNumber)}. ${winnings > 0 ? `You won ${formatMoney(winnings)}.` : "The house wins this round."}`);
    }, 4200);
  }, [announce, bets, rotation, state, tone, totalBet]);

  useEffect(() => {
    if (state !== "betting") return;
    const timer = window.setInterval(() => { setSeconds((value) => { if (value <= 1) { window.clearInterval(timer); window.setTimeout(() => { if (spinningRef.current) return; if (totalBet > 0) spin(); else { setSeconds(BETTING_SECONDS); setMessage("Place your bets"); } }, 0); return 0; } if (value <= 6) tone(420, 0.035, "square", 0.018); return value - 1; }); }, 1000);
    return () => window.clearInterval(timer);
  }, [spin, state, tone, totalBet]);

  const placeBet = (zone: string) => {
    if (state !== "betting") return;
    if (selectedChip > bankroll) { setMessage("Not enough in your stack"); tone(180, 0.18, "square", 0.025); return; }
    if (totalBet + selectedChip > settings.tableLimit) { setMessage(`Table limit is ${formatMoney(settings.tableLimit)}`); tone(180, 0.18, "square", 0.025); return; }
    setBets((current) => ({ ...current, [zone]: (current[zone] ?? 0) + selectedChip })); setBankroll((amount) => amount - selectedChip); setMessage(`${formatMoney(selectedChip)} placed`); tone(310 + Math.min(selectedChip, 1000) / 3, 0.07, "triangle", 0.045);
  };

  const clearBets = () => { if (state !== "betting" || totalBet === 0) return; setBankroll((amount) => amount + totalBet); setBets({}); setMessage("Bets cleared"); tone(230, 0.1, "triangle", 0.025); };

  return (
    <main className="game-screen">
      <header className="game-header">
        <button className="header-icon back-icon" onClick={onMenu} aria-label="Back to main menu"><Icon name="back" /></button><BrandMark compact />
        <div className="game-stats"><div><small>Balance</small><b data-testid="balance">{formatMoney(bankroll)}</b></div><i /><div><small>Total bet</small><b className="bet-total">{formatMoney(totalBet)}</b></div></div>
        <div className="header-actions"><button className="header-icon" onClick={onToggleSound} aria-label={settings.sound ? "Mute casino sound" : "Turn on casino sound"}><Icon name={settings.sound ? "sound" : "mute"} /></button><button className="header-icon" onClick={onSettings} aria-label="Open table settings"><Icon name="settings" /></button><button className="header-icon menu-only" onClick={onMenu} aria-label="Main menu"><Icon name="menu" /></button></div>
      </header>
      <section className="dealer-question" aria-live="polite" data-testid="dealer-question"><div className="dealer-avatar"><span>♛</span><i /></div><div className="question-copy"><small>Live dealer asks</small><p>“{question}”</p></div><div className={`round-timer ${seconds <= 5 ? "is-urgent" : ""}`}><small>{state === "betting" ? "Bets close in" : state === "spinning" ? "Wheel status" : "Round complete"}</small><b>{state === "betting" ? `0:${seconds.toString().padStart(2, "0")}` : state === "spinning" ? "SPINNING" : "RESULT"}</b></div></section>
      <nav className="mobile-view-switch" aria-label="Choose game view"><button className={view === "wheel" ? "is-active" : ""} onClick={() => setView("wheel")} data-testid="show-wheel">Wheel</button><button className={view === "board" ? "is-active" : ""} onClick={() => setView("board")} data-testid="show-board">Betting board</button></nav>
      <div className={`game-area view-${view}`}><RouletteWheel result={result} rotation={rotation} spinning={state === "spinning"} /><BettingBoard bets={bets} result={result} disabled={state !== "betting"} onBet={placeBet} /></div>
      <footer className="bet-console" data-testid="chip-tray">
        <div className="console-message"><span className={`status-dot is-${state}`} /><div><small>Dealer</small><b>{message}</b></div></div>
        <div className="chip-rack" aria-label="Choose chip value"><small>Choose chip</small><div>{chips.map((chip) => <button key={chip} onClick={() => { setSelectedChip(chip); tone(360, 0.045, "triangle", 0.025); }} aria-label={`Select ${formatMoney(chip)} chip`} aria-pressed={selectedChip === chip}><Chip value={chip} selected={selectedChip === chip} /></button>)}</div></div>
        <button className="clear-button" onClick={clearBets} disabled={state !== "betting" || totalBet === 0}>Clear</button>
        {state === "result" ? <button className="spin-button new-round-button" onClick={newRound}>Next round <span>↻</span></button> : <button className="spin-button" onClick={spin} disabled={state !== "betting" || totalBet === 0}><span className="spin-button__icon">●</span> Spin wheel</button>}
        <div className="history-strip"><small>History</small><div>{history.length ? history.map((number, index) => <span key={`${number}-${index}`} className={`history-number is-${numberColor(number)}`}>{number}</span>) : <span className="history-empty">No spins yet</span>}</div></div>
      </footer>
    </main>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [modal, setModal] = useState<"rules" | "settings" | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [gameKey, setGameKey] = useState(0);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gambl-roulette-settings");
      if (saved) {
        const next = { ...defaultSettings, ...JSON.parse(saved) };
        window.queueMicrotask(() => setSettings(next));
      }
    } catch { /* Use safe defaults when storage is unavailable. */ }
  }, []);
  const updateSettings = (next: Settings) => { setSettings(next); try { window.localStorage.setItem("gambl-roulette-settings", JSON.stringify(next)); } catch { /* Local preferences are optional. */ } };
  const startGame = () => { setGameKey((key) => key + 1); setScreen("game"); };
  return <>{screen === "menu" ? <Menu onStart={startGame} onRules={() => setModal("rules")} onSettings={() => setModal("settings")} /> : <Game key={gameKey} settings={settings} onSettings={() => setModal("settings")} onMenu={() => setScreen("menu")} onToggleSound={() => updateSettings({ ...settings, sound: !settings.sound })} />}{modal === "rules" && <RulesDialog onClose={() => setModal(null)} />}{modal === "settings" && <SettingsDialog settings={settings} onChange={updateSettings} onClose={() => setModal(null)} />}</>;
}
