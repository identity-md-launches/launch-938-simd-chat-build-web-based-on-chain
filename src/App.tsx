import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getAddress, isAddress, type Address } from "viem";
import { Banana, Dice, Icon, Jungle, Monkey } from "./Art";
import {
  buy,
  canBuy,
  endTurn,
  initialGame,
  randomDie,
  readSavedGame,
  roll,
  squares,
  wealth,
  type Game,
  type Square,
} from "./game";
import * as chain from "./chain";

const number = (n: number) => new Intl.NumberFormat("es-ES").format(n);
const localKey = "mono-poly-practice-v1";
function stored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function readSession(account: Address): chain.ChainSession | null {
  try {
    const value = JSON.parse(stored(`mono-poly-sepolia-${account}`) ?? "null");
    return value &&
      value.account === account &&
      (!value.address || isAddress(value.address)) &&
      (!value.pending || /^0x[0-9a-fA-F]{64}$/.test(value.pending))
      ? value
      : null;
  } catch {
    return null;
  }
}
function Board({
  game,
  onSquare,
}: {
  game: Game;
  onSquare: (square: Square) => void;
}) {
  return (
    <div
      className="board-scroll"
      tabIndex={0}
      aria-label="Tablero de 24 casillas. En pantallas pequeñas puedes desplazarlo horizontalmente."
    >
      <div className="board">
        <div className="board-center">
          <span className="center-overline">Bienvenido a Isla Banana</span>
          <Jungle className="jungle jungle-left" />
          <Jungle className="jungle jungle-right" flip />
          <div className="center-wordmark" aria-hidden="true">
            MONO <span>POLY</span>
            <small>
              <Icon name="link" size={13} /> on chain
            </small>
          </div>
          <Monkey hero className="hero-monkey" />
          <p>
            Un gran imperio empieza
            <br />
            con un pequeño plátano.
          </p>
          <div className="card-decks" aria-hidden="true">
            <div className="deck deck-chance">
              <Icon name="chance" size={25} />
              <span>Suerte salvaje</span>
            </div>
            <div className="deck deck-chest">
              <Icon name="chest" size={24} />
              <span>Fondo de la selva</span>
            </div>
          </div>
          <span className="center-leaf leaf-one">✦</span>
          <span className="center-leaf leaf-two">✧</span>
        </div>
        {squares.map((s) => {
          const row =
            s.id <= 6 ? 7 : s.id <= 12 ? 13 - s.id : s.id <= 18 ? 1 : s.id - 17;
          const column =
            s.id <= 6 ? 7 - s.id : s.id <= 12 ? 1 : s.id <= 18 ? s.id - 11 : 7;
          return (
            <button
              key={s.id}
              className={`square ${s.group} ${s.kind} ${game.owners[s.id] ? "owned" : ""}`}
              style={{ gridRow: row, gridColumn: column } as CSSProperties}
              onClick={() => onSquare(s)}
              aria-label={`${s.name}${s.price ? `, precio ${s.price}, alquiler ${s.rent} plátanos` : ""}${game.owners[s.id] ? `, propiedad de ${game.owners[s.id] === 1 ? "ti" : "Coco"}` : ""}${game.positions[0] === s.id ? ", estás aquí" : ""}${game.positions[1] === s.id ? ", Coco está aquí" : ""}`}
            >
              {s.kind === "property" && <span className="property-stripe" />}
              <Icon name={s.icon} size={25} />
              <span className="square-name">{s.name}</span>
              <span className="square-price">
                {s.price ? (
                  <>
                    <Banana size={13} />
                    {s.price}
                  </>
                ) : s.kind === "start" ? (
                  "+200 plátanos"
                ) : s.kind === "tax" ? (
                  "100 plátanos"
                ) : s.kind === "jail" ? (
                  "Solo de paso"
                ) : s.kind === "rest" ? (
                  "Relájate"
                ) : s.kind === "gojail" ? (
                  "A descansar"
                ) : (
                  "Roba una carta"
                )}
              </span>
              {game.owners[s.id] > 0 && (
                <span className={`owner-marker owner-${game.owners[s.id]}`}>
                  {game.owners[s.id] === 1 ? "T" : "C"}
                </span>
              )}
              <span className="tokens">
                {game.positions.map(
                  (pos, p) =>
                    pos === s.id && (
                      <span className={`token token-${p}`} key={p}>
                        <Monkey variant={p === 0 ? "green" : "orange"} />
                      </span>
                    ),
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const d = ref.current!;
    d.showModal();
    return () => {
      d.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={() => closeRef.current()}
      aria-labelledby="dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            closeRef.current();
        }
      }}
    >
      <div className="modal-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [game, setGame] = useState<Game>(
    () => readSavedGame(stored(localKey)) ?? initialGame(),
  );
  const [modal, setModal] = useState<
    "help" | "wallet" | "reset" | "chain" | "history" | null
  >(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [tab, setTab] = useState("board");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [account, setAccount] = useState<Address | null>(null);
  const [session, setSession] = useState<chain.ChainSession | null>(null);
  const [savedSession, setSavedSession] = useState<chain.ChainSession | null>(
    null,
  );
  const [storageWarning, setStorageWarning] = useState(false);
  const [importAddress, setImportAddress] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);
  const isChain = Boolean(session?.address);
  const disabled = busy || Boolean(session?.pending);
  const current = squares[game.positions[0]];
  const properties = squares.filter((s) => game.owners[s.id] === 1);
  const earnedRent = properties.reduce((sum, s) => sum + s.rent, 0);

  useEffect(() => {
    if (!session) {
      try {
        localStorage.setItem(localKey, JSON.stringify(game));
      } catch {
        setStorageWarning(true);
      }
    }
  }, [game, session]);
  useEffect(() => {
    const provider = window.ethereum;
    const changed = () => {
      setSession(null);
      setAccount(null);
      setSavedSession(null);
      setGame(readSavedGame(stored(localKey)) ?? initialGame());
      setError(
        "La cuenta o la red cambió. Conecta de nuevo para recuperar tu partida en Sepolia.",
      );
    };
    provider?.on?.("accountsChanged", changed);
    provider?.on?.("chainChanged", changed);
    return () => {
      provider?.removeListener?.("accountsChanged", changed);
      provider?.removeListener?.("chainChanged", changed);
    };
  }, []);
  function remember(s: chain.ChainSession) {
    setSavedSession(s);
    try {
      localStorage.setItem(`mono-poly-sepolia-${s.account}`, JSON.stringify(s));
    } catch {
      setStorageWarning(true);
    }
  }
  async function run(task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(chain.walletError(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function settle(s: chain.ChainSession) {
    if (!s.pending) return;
    const receipt = await chain.confirm(s.pending);
    setLastTx(s.pending);
    const ready = {
      ...s,
      pending: undefined,
      pendingAction: undefined,
      address: s.address ?? receipt.contractAddress ?? undefined,
    };
    if (receipt.status === "reverted") {
      if (ready.address) {
        const fresh = await chain.readGame(ready);
        remember(ready);
        setSession(ready);
        setGame(fresh);
      } else {
        setSession(null);
        setSavedSession(null);
        try {
          localStorage.removeItem(`mono-poly-sepolia-${s.account}`);
        } catch {
          setStorageWarning(true);
        }
      }
      throw new Error("Transaction reverted");
    }
    const fresh = await chain.readGame(
      ready,
      s.pendingAction === "deploy"
        ? ["Partida creada en Sepolia. Cada jugada se guardará en la cadena."]
        : game.log,
      receipt,
    );
    remember(ready);
    setSession(ready);
    setGame(fresh);
    setNotice("Jugada confirmada y guardada en Sepolia.");
    setModal(null);
  }
  function play(action: "roll" | "buy" | "endTurn") {
    if (disabled) return;
    if (session?.address) {
      void run(async () => {
        const hash = await chain.act(session, action);
        const pending = { ...session, pending: hash, pendingAction: action };
        remember(pending);
        setSession(pending);
        setNotice("Jugada enviada. Esperando confirmación…");
        await settle(pending);
      });
      return;
    }
    if (action === "buy") {
      setGame((g) => buy(g));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    window.setTimeout(
      () => {
        const dice: [number, number] = [randomDie(), randomDie()];
        setGame((g) =>
          action === "roll"
            ? roll(g, dice, randomDie())
            : endTurn(g, dice, randomDie()),
        );
        busyRef.current = false;
        setBusy(false);
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450,
    );
  }
  function connectWallet() {
    void run(async () => {
      const address = await chain.connect();
      setAccount(address);
      setSavedSession(readSession(address));
      setNotice(
        "Cartera conectada a Sepolia. Puedes crear o recuperar una partida.",
      );
    });
  }
  function createOnChain() {
    if (!account) return;
    void run(async () => {
      const hash = await chain.deploy(account);
      const pending: chain.ChainSession = {
        account,
        pending: hash,
        pendingAction: "deploy",
      };
      remember(pending);
      setSession(pending);
      await settle(pending);
    });
  }
  function resume(s: chain.ChainSession) {
    void run(async () => {
      if (s.pending) {
        setSession(s);
        await settle(s);
      } else {
        const fresh = await chain.readGame(s);
        remember(s);
        setSession(s);
        setGame(fresh);
        setModal(null);
        setNotice("Partida recuperada de Sepolia.");
      }
    });
  }
  function localMode() {
    setSession(null);
    setGame(readSavedGame(stored(localKey)) ?? initialGame());
    setModal(null);
    setError("");
    setNotice("Has vuelto a tu partida de práctica.");
  }
  function reset() {
    setSession(null);
    setGame(initialGame());
    setSelected(null);
    setTab("board");
    setModal(null);
    setError("");
    setNotice("Nueva aventura de práctica. ¡A por esos plátanos!");
  }

  return (
    <>
      <a className="skip-link" href="#game-actions">
        Saltar a las acciones del juego
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand" aria-label="Mono Poly on Chain, inicio">
            <span className="brand-monkey">
              <Monkey />
            </span>
            <span>
              MONO POLY
              <small>
                <span /> on chain
              </small>
            </span>
          </a>
          <nav aria-label="Navegación principal">
            <a className="nav-active" href="#game">
              <Icon name="grid" size={17} /> Jugar
            </a>
            <button onClick={() => setModal("help")}>Cómo jugar</button>
            <button onClick={() => setModal("chain")}>
              La cadena <Icon name="link" size={15} />
            </button>
          </nav>
          <button
            className="wallet-button"
            onClick={() => {
              setModal("wallet");
              setError("");
            }}
          >
            <Icon name="wallet" size={19} />
            <span>
              {account
                ? `${account.slice(0, 6)}…${account.slice(-4)}`
                : "Conectar cartera"}
            </span>
          </button>
        </div>
      </header>
      <main className="page" id="game">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <div className="eyebrow">
              <span /> Pequeños monos. Grandes imperios.
            </div>
            <h1 id="page-title">
              La selva es tuya<span className="title-dot">.</span>
              <Icon name="leaf" size={38} />
            </h1>
            <p>
              Lanza los dados, conquista la isla y deja que lluevan los
              plátanos.
            </p>
          </div>
          <div className="game-mode">
            <span className={`mode-badge ${isChain ? "on-chain" : ""}`}>
              <span className="status-dot" />
              {isChain ? "En Sepolia" : "Modo práctica"}
            </span>
            <span>
              <Icon name="people" size={15} /> Tú contra Coco · 20 rondas
            </span>
          </div>
        </section>
        <div className="game-layout">
          <section className="board-panel" aria-label="Zona de juego">
            <div className="board-toolbar">
              <div className="board-tabs" aria-label="Vistas del juego">
                <button
                  className={tab === "board" ? "active" : ""}
                  aria-pressed={tab === "board"}
                  onClick={() => setTab("board")}
                >
                  <Icon name="grid" size={17} />
                  Tablero
                </button>
                <button
                  className={tab === "properties" ? "active" : ""}
                  aria-pressed={tab === "properties"}
                  onClick={() => setTab("properties")}
                >
                  <Icon name="hut" size={17} />
                  Mis propiedades{" "}
                  <span className="count">{properties.length}</span>
                </button>
              </div>
              <button
                className="icon-button reset-button"
                onClick={() => setModal("reset")}
                aria-label="Empezar una nueva partida"
                disabled={busy}
              >
                <Icon name="refresh" size={18} />
              </button>
            </div>
            {tab === "board" ? (
              <>
                <div className="board-label">
                  <span>
                    <Icon name="palm" size={17} /> Isla Banana
                  </span>
                  <span>El paraíso tiene nuevo dueño. ¿Serás tú?</span>
                </div>
                <Board game={game} onSquare={setSelected} />
                <div className="board-caption">
                  <span>
                    <span className="legend-dot you" />
                    Tu mono <span className="legend-dot coco" />
                    Coco
                  </span>
                  <span>
                    <Icon name="help" size={14} /> Selecciona una casilla para
                    explorar
                  </span>
                </div>
                <p className="mobile-board-hint">
                  Selecciona una casilla para ver su nombre, precio y alquiler.
                </p>
              </>
            ) : (
              <div className="property-view">
                <div className="section-title">
                  <h2>Tu rincón de la selva</h2>
                  <span>{properties.length} / 13 propiedades</span>
                </div>
                {properties.length === 0 ? (
                  <div className="empty-properties">
                    <span className="empty-icon">
                      <Icon name="hut" size={46} />
                    </span>
                    <h3>Todo imperio empieza por algo</h3>
                    <p>
                      Lanza los dados y compra la primera propiedad libre en la
                      que caigas.
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setTab("board")}
                    >
                      Volver al tablero <Icon name="arrow" size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="property-grid">
                    {properties.map((s) => (
                      <button
                        className={`property-card ${s.group}`}
                        key={s.id}
                        onClick={() => setSelected(s)}
                      >
                        <span className="property-stripe" />
                        <Icon name={s.icon} size={32} />
                        <h3>{s.name}</h3>
                        <span>Valor: {s.price} plátanos</span>
                        <strong>Alquiler: {s.rent} plátanos</strong>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
          <aside className="sidebar" aria-label="Acciones y jugadores">
            <section className="turn-card" id="game-actions" tabIndex={-1}>
              <div className="turn-heading">
                <span>
                  <span className="status-dot" />
                  {game.phase === "finished" ? "Partida terminada" : "Tu turno"}
                </span>
                <span>
                  Ronda {Math.min(game.round, 20)}
                  <span className="muted"> / 20</span>
                </span>
              </div>
              <h2>
                {game.phase === "finished"
                  ? game.winner === 0
                    ? "¡La selva es tuya!"
                    : game.winner === -1
                      ? "¡Un empate salvaje!"
                      : "¡Coco se lleva la corona!"
                  : game.phase === "roll"
                    ? "¡Te toca, explorador!"
                    : "Un paso más hacia tu imperio."}
              </h2>
              <p>
                {game.phase === "finished"
                  ? `Patrimonio final: tú ${number(wealth(game, 0))} · Coco ${number(wealth(game, 1))} plátanos.`
                  : game.phase === "roll"
                    ? game.jailed[0]
                      ? "Esta tirada descansarás en la jaula."
                      : "La suerte favorece a los más monos."
                    : `Estás en ${current.name}. ${canBuy(game) ? "¡Este rincón puede ser tuyo!" : "Puedes terminar tu turno."}`}
              </p>
              <div className={`dice-area ${busy && !isChain ? "rolling" : ""}`}>
                <Dice value={game.dice[0]} />
                <Dice value={game.dice[1]} />
              </div>
              <div className="dice-caption">
                {game.phase === "roll"
                  ? "Tu próxima aventura está a una tirada"
                  : `Tu tirada: ${game.dice[0] + game.dice[1]} pasos`}
              </div>
              {game.phase === "finished" ? (
                <button
                  className="button primary"
                  onClick={() => setModal("reset")}
                >
                  <Icon name="refresh" />
                  Jugar otra vez
                </button>
              ) : (
                <>
                  <button
                    className={`button ${game.phase === "roll" ? "primary" : "secondary"}`}
                    onClick={() => play("roll")}
                    disabled={disabled || game.phase !== "roll"}
                  >
                    <Icon name="dice" />
                    {busy
                      ? isChain || session?.pending
                        ? "Confirmando jugada…"
                        : "La selva decide…"
                      : "Lanzar dados"}
                    <Icon name="arrow" size={18} />
                  </button>
                  <div className="secondary-actions">
                    <button
                      className={`button ${canBuy(game) ? "primary" : "secondary"}`}
                      onClick={() => play("buy")}
                      disabled={disabled || !canBuy(game)}
                    >
                      <Icon name="hut" size={17} />
                      Comprar{canBuy(game) ? ` · ${current.price}` : ""}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => play("endTurn")}
                      disabled={disabled || game.phase !== "action"}
                    >
                      Terminar turno
                      <Icon name="chevron" size={16} />
                    </button>
                  </div>
                </>
              )}
              {session?.pending && (
                <div className="pending">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${session.pending}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver jugada pendiente ↗
                  </a>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => void run(() => settle(session))}
                  >
                    Comprobar jugada
                  </button>
                </div>
              )}
              <div className="turn-note">
                <Icon name={isChain ? "shield" : "check"} size={14} />
                {isChain
                  ? "Cada jugada se confirma en tu cartera"
                  : "Sin cartera. Sin dinero real. A tu ritmo."}
              </div>
            </section>
            <section className="players-card">
              <div className="section-title">
                <h2>La pandilla</h2>
                <span>2 jugadores</span>
              </div>
              {[0, 1].map((p) => (
                <div
                  className={`player-row ${p === 0 ? "current-player" : ""}`}
                  key={p}
                >
                  <span className={`avatar avatar-${p}`}>
                    <Monkey variant={p === 0 ? "green" : "orange"} />
                  </span>
                  <div className="player-name">
                    <strong>
                      {p === 0 ? "Tú" : "Coco"}
                      {p === 0 && <span className="you-label">Tú</span>}
                    </strong>
                    <span>
                      {p === 0 ? "Espíritu aventurero" : "El mono de la casa"}
                    </span>
                  </div>
                  <div className="player-balance">
                    <strong>
                      <Banana size={17} />
                      {number(game.balances[p])}
                    </strong>
                    <span>
                      {game.owners.filter((owner) => owner === p + 1).length}{" "}
                      propiedades
                    </span>
                  </div>
                </div>
              ))}
            </section>
            <section className="backpack-card">
              <div className="section-title">
                <h2>
                  <Icon name="wallet" size={17} />
                  Tu mochila
                </h2>
                <Banana size={24} />
              </div>
              <div className="balance-label">Plátanos disponibles</div>
              <div className="big-balance">
                {number(game.balances[0])}
                <span>plátanos</span>
              </div>
              <div className="backpack-stats">
                <div>
                  <strong>{properties.length}</strong>
                  <span>Propiedades</span>
                </div>
                <div>
                  <strong>
                    {earnedRent}
                    <Banana size={16} />
                  </strong>
                  <span>
                    Alquiler potencial
                    <span className="sr-only">
                      {" "}
                      por una visita a cada propiedad
                    </span>
                  </span>
                </div>
              </div>
            </section>
          </aside>
          <section className="activity-card">
            <div className="section-title">
              <h2>
                <Icon name="history" size={18} />
                Lo que pasa en la selva
              </h2>
              <button
                className="text-button"
                onClick={() => setModal("history")}
              >
                Ver todo <Icon name="arrow" size={15} />
              </button>
            </div>
            <div className="latest-event">
              <span className="event-icon">
                <Icon
                  name={game.phase === "finished" ? "trophy" : "leaf"}
                  size={20}
                />
              </span>
              <div>
                <p aria-live="polite" aria-atomic="true">
                  {game.log[0]}
                </p>
                <span>
                  {isChain ? "Confirmado en Sepolia" : "Partida de práctica"} ·
                  Ronda {Math.min(game.round, 20)}
                </span>
              </div>
            </div>
          </section>
          <section className="chain-promo">
            <span className="chain-promo-icon">
              <Icon name="shield" size={25} />
            </span>
            <div>
              <h2>Tu partida, en la cadena.</h2>
              <p>Conecta tu cartera y guarda cada aventura.</p>
              <button
                className="text-button"
                onClick={() => setModal(isChain ? "chain" : "wallet")}
              >
                {isChain ? "Ver mi partida" : "Descubrir cómo"}
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </section>
        </div>
        <div className="message-area">
          <p role="status">{notice}</p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {storageWarning && (
            <p role="alert" className="error-message">
              Este navegador no permite guardar datos. Tu práctica no se
              conservará al cerrar; copia la dirección de tu partida de Sepolia
              para recuperarla.
            </p>
          )}
        </div>
        <footer>
          <span>
            <Icon name="leaf" size={16} /> Hecho para jugar. Construido para
            explorar.
          </span>
          <button onClick={() => setModal("help")}>
            ¿Primera vez en la selva?{" "}
            <span>
              Te enseñamos <Icon name="arrow" size={14} />
            </span>
          </button>
          <span className="footer-brand">Mono Poly on Chain</span>
        </footer>
      </main>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className={`square-detail ${selected.group}`}>
            <Icon name={selected.icon} size={52} />
            <p>
              {selected.kind === "property"
                ? game.owners[selected.id]
                  ? `Propiedad de ${game.owners[selected.id] === 1 ? "ti" : "Coco"}`
                  : "Un rincón de la selva que busca dueño."
                : selected.kind === "chance"
                  ? "La selva decide: gana 150, paga 75 o vuelve a Salida y recibe 200 plátanos. La carta se aplica al caer."
                  : selected.kind === "chest"
                    ? "La comunidad comparte su cosecha: recibes 100 plátanos al caer."
                    : selected.kind === "start"
                      ? "Recibe 200 plátanos cada vez que pases por Salida."
                      : selected.kind === "tax"
                        ? "El mantenimiento de la selva cuesta 100 plátanos."
                        : selected.kind === "gojail"
                          ? "Ve a la jaula y descansa durante tu próxima tirada."
                          : selected.kind === "jail"
                            ? "Si caes aquí con los dados, solo estás de visita. No pierdes tu turno."
                            : "Un respiro entre palmeras. Aquí no pagas nada."}
            </p>
          </div>
          {selected.price > 0 && (
            <>
              <dl className="property-details">
                <div>
                  <dt>Precio de compra</dt>
                  <dd>
                    {selected.price} <Banana />
                  </dd>
                </div>
                <div>
                  <dt>Alquiler por visita</dt>
                  <dd>
                    {selected.rent} <Banana />
                  </dd>
                </div>
              </dl>
              {selected.id === current.id && canBuy(game) ? (
                <button
                  className="button primary"
                  disabled={disabled}
                  onClick={() => {
                    play("buy");
                    setSelected(null);
                  }}
                >
                  Comprar por {selected.price} plátanos
                </button>
              ) : (
                <p className="modal-note">
                  {game.owners[selected.id]
                    ? "El alquiler se paga automáticamente al caer aquí."
                    : "Puedes comprarla si caes aquí y tienes suficientes plátanos."}
                </p>
              )}
            </>
          )}
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Tu primera aventura" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Un tablero, dos monos y muchos plátanos. Así se juega:
          </p>
          <ol className="instructions">
            <li>
              <span>1</span>
              <div>
                <h3>Lanza los dados</h3>
                <p>
                  Empiezas con 1.500 plátanos. Avanza por las 24 casillas y
                  recibe 200 cada vez que pases por Salida.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Haz tuya la selva</h3>
                <p>
                  Compra la propiedad libre en la que caigas. Si tiene dueño, el
                  alquiler se paga automáticamente.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Espera lo inesperado</h3>
                <p>
                  Las cartas de Suerte salvaje y Fondo de la selva se aplican al
                  caer. La jaula te hace descansar una tirada.
                </p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <h3>Dale paso a Coco</h3>
                <p>
                  Pulsa «Terminar turno». Coco juega y compra automáticamente.
                  Gana quien tenga más plátanos y valor de propiedades tras 20
                  rondas, o quien no se quede sin plátanos.
                </p>
              </div>
            </li>
          </ol>
          <div className="info-box">
            <Icon name="wallet" />
            <p>
              <strong>¿Quieres guardar en la cadena?</strong> Conecta una
              cartera compatible con MetaMask, cambia a Sepolia y crea una
              partida. Necesitarás ETH de prueba para confirmar cada jugada. Los
              plátanos no son dinero real.
            </p>
          </div>
          <button className="button primary" onClick={() => setModal(null)}>
            ¡A explorar la selva! <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {(modal === "wallet" || modal === "chain") && (
        <Modal
          title={
            modal === "wallet"
              ? "Tu aventura, siempre contigo"
              : "Una partida con memoria"
          }
          onClose={() => setModal(null)}
        >
          <div className="wallet-illustration">
            <Icon name="shield" size={40} />
            <Icon name="link" size={24} />
            <Monkey />
          </div>
          <p className="modal-intro">
            En Sepolia, tus propiedades, plátanos y jugadas se guardan en un
            registro público. Solo tu cartera puede jugar tu partida contra
            Coco.
          </p>
          <div className="info-box">
            <Icon name="help" />
            <p>
              Sepolia es una red de prueba. Crear una partida y jugar requiere{" "}
              <strong>ETH de prueba</strong> para las pequeñas comisiones. Los
              plátanos no tienen valor monetario. La práctica actual se conserva
              por separado.
            </p>
          </div>
          {!account ? (
            <>
              <ol className="wallet-steps">
                <li>Instala MetaMask o abre el sitio desde su navegador.</li>
                <li>Conecta tu cartera y acepta el cambio a Sepolia.</li>
                <li>Consigue ETH de prueba y crea tu partida.</li>
              </ol>
              <button
                className="button primary"
                disabled={busy}
                onClick={connectWallet}
              >
                <Icon name="wallet" />
                {busy ? "Conectando…" : "Conectar cartera"}
              </button>
              <a
                className="external-help"
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
              >
                Instalar MetaMask ↗
              </a>
            </>
          ) : (
            <>
              <div className="connected-account">
                <Icon name="check" size={18} />
                <span>
                  Conectada a Sepolia<strong>{account}</strong>
                </span>
              </div>
              {session?.address && (
                <div className="contract-address">
                  <span>Dirección de tu partida</span>
                  <code>{session.address}</code>
                  <a
                    href={`https://sepolia.etherscan.io/address/${session.address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver partida en Sepolia ↗
                  </a>
                </div>
              )}
              {savedSession && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => resume(savedSession)}
                >
                  {busy
                    ? "Recuperando…"
                    : savedSession.pending
                      ? "Comprobar jugada pendiente"
                      : "Recuperar partida de Sepolia"}
                </button>
              )}
              {!savedSession?.pending && (
                <button
                  className={`button ${savedSession ? "secondary" : "primary"}`}
                  disabled={busy}
                  onClick={createOnChain}
                >
                  {busy
                    ? "Confirma en tu cartera…"
                    : "Crear nueva partida en Sepolia"}
                </button>
              )}
              <details className="import-game">
                <summary>Recuperar con una dirección de partida</summary>
                <label htmlFor="game-address">Dirección del contrato</label>
                <input
                  id="game-address"
                  value={importAddress}
                  onChange={(e) => setImportAddress(e.target.value)}
                  placeholder="0x…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  className="button secondary"
                  disabled={busy || !isAddress(importAddress)}
                  onClick={() => {
                    if (isAddress(importAddress))
                      resume({ account, address: getAddress(importAddress) });
                  }}
                >
                  Recuperar esta partida
                </button>
              </details>
            </>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {session && (
            <button
              className="text-button return-practice"
              disabled={busy}
              onClick={localMode}
            >
              Volver a mi práctica
            </button>
          )}
          {lastTx && (
            <a
              className="external-help"
              href={`https://sepolia.etherscan.io/tx/${lastTx}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver última jugada confirmada ↗
            </a>
          )}
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="¿Una nueva aventura?" onClose={() => setModal(null)}>
          <p className="modal-intro">
            {isChain
              ? "Empezarás una nueva práctica. Tu partida de Sepolia seguirá guardada y podrás recuperarla al conectar tu cartera."
              : "Tu práctica actual se sustituirá por una nueva partida. Tú y Coco volveréis a Salida con 1.500 plátanos."}
          </p>
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Seguir jugando
            </button>
            <button className="button primary" disabled={busy} onClick={reset}>
              Empezar nueva práctica
            </button>
          </div>
        </Modal>
      )}
      {modal === "history" && (
        <Modal title="Diario de la selva" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Las últimas {game.log.length} novedades de esta sesión, de más
            reciente a más antigua.
          </p>
          <ol className="history-list">
            {game.log.map((event, i) => (
              <li key={`${i}-${event}`}>
                <span>
                  <Icon name={i === 0 ? "leaf" : "history"} size={16} />
                </span>
                {event}
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </>
  );
}
