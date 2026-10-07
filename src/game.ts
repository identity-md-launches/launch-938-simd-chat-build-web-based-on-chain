export type SquareKind =
  | "start"
  | "property"
  | "chance"
  | "chest"
  | "rest"
  | "jail"
  | "tax"
  | "gojail";
export type Square = {
  id: number;
  name: string;
  kind: SquareKind;
  group: string;
  price: number;
  rent: number;
  icon: string;
};
const definitions: [string, SquareKind, string, string][] = [
  ["Salida", "start", "mint", "flag"],
  ["Platanal", "property", "mint", "banana"],
  ["Liana Lane", "property", "mint", "leaf"],
  ["Suerte salvaje", "chance", "yellow", "chance"],
  ["Cabaña Coco", "property", "mint", "hut"],
  ["Fondo de la selva", "chest", "yellow", "chest"],
  ["De visita", "jail", "peach", "jail"],
  ["Río Mono", "property", "blue", "water"],
  ["Cascada Azul", "property", "blue", "water"],
  ["Suerte salvaje", "chance", "yellow", "chance"],
  ["Laguna Banana", "property", "blue", "palm"],
  ["Peaje de la selva", "tax", "peach", "banana"],
  ["Siesta tropical", "rest", "mint", "rest"],
  ["Bambú Boulevard", "property", "yellow", "leaf"],
  ["Templo del Mono", "property", "yellow", "temple"],
  ["Fondo de la selva", "chest", "yellow", "chest"],
  ["Palmeras Park", "property", "yellow", "palm"],
  ["Suerte salvaje", "chance", "yellow", "chance"],
  ["¡A la jaula!", "gojail", "peach", "jail"],
  ["Cumbre Gorila", "property", "purple", "mountain"],
  ["Selva Dorada", "property", "purple", "palm"],
  ["Fondo de la selva", "chest", "yellow", "chest"],
  ["Palacio Banana", "property", "purple", "temple"],
  ["Reserva del Rey", "property", "purple", "leaf"],
];
export const squares: Square[] = definitions.map(
  ([name, kind, group, icon], id) => ({
    id,
    name,
    kind,
    group,
    icon,
    price: kind === "property" ? 100 + Math.floor(id / 6) * 60 : 0,
    rent: kind === "property" ? 20 + Math.floor(id / 6) * 15 : 0,
  }),
);
export type Game = {
  version: 1;
  balances: [number, number];
  positions: [number, number];
  owners: number[];
  round: number;
  phase: "roll" | "action" | "finished";
  dice: [number, number];
  jailed: [boolean, boolean];
  log: string[];
  winner: number | null;
};
export const initialGame = (): Game => ({
  version: 1,
  balances: [1500, 1500],
  positions: [0, 0],
  owners: Array(24).fill(0),
  round: 1,
  phase: "roll",
  dice: [3, 5],
  jailed: [false, false],
  log: ["¡La aventura empieza! Tú y Coco recibís 1.500 plátanos."],
  winner: null,
});
const names = ["Tú", "Coco"];
function log(g: Game, message: string) {
  g.log = [message, ...g.log].slice(0, 40);
}
export function wealth(g: Game, player: number) {
  return (
    g.balances[player] +
    squares.reduce(
      (sum, s) => sum + (g.owners[s.id] === player + 1 ? s.price : 0),
      0,
    )
  );
}
function finish(g: Game) {
  if (g.balances.some((n) => n <= 0) || g.round > 20) {
    g.phase = "finished";
    const a = wealth(g, 0),
      b = wealth(g, 1);
    g.winner =
      g.balances[0] <= 0
        ? 1
        : g.balances[1] <= 0
          ? 0
          : a === b
            ? -1
            : a > b
              ? 0
              : 1;
    log(
      g,
      g.winner === -1
        ? "¡Empate! La selva tiene dos reyes."
        : g.winner === 0
          ? "¡Ganaste! La selva es tuya."
          : "Coco gana esta aventura. ¡La próxima será tuya!",
    );
  }
}
function pay(g: Game, player: number, amount: number, receiver?: number) {
  const paid = Math.min(g.balances[player], amount);
  g.balances[player] -= paid;
  if (receiver !== undefined) g.balances[receiver] += paid;
}
function move(g: Game, player: number, dice: [number, number], card: number) {
  if (g.jailed[player]) {
    g.jailed[player] = false;
    log(g, `${names[player]} descansa en la jaula y pierde esta tirada.`);
    return;
  }
  const next = g.positions[player] + dice[0] + dice[1];
  if (next >= 24) {
    g.balances[player] += 200;
    log(g, `${names[player]} pasa por Salida: +200 plátanos.`);
  }
  g.positions[player] = next % 24;
  const s = squares[g.positions[player]];
  log(g, `${names[player]} saca ${dice[0] + dice[1]} y llega a ${s.name}.`);
  if (
    s.kind === "property" &&
    g.owners[s.id] &&
    g.owners[s.id] !== player + 1
  ) {
    pay(g, player, s.rent, 1 - player);
    log(
      g,
      `${names[player]} paga ${s.rent} plátanos de alquiler a ${names[1 - player]}.`,
    );
  } else if (s.kind === "tax") {
    pay(g, player, 100);
    log(g, `${names[player]} paga 100 plátanos de peaje.`);
  } else if (s.kind === "gojail") {
    g.positions[player] = 6;
    g.jailed[player] = true;
    log(g, `${names[player]} va a la jaula. Descansará una tirada.`);
  } else if (s.kind === "chest") {
    g.balances[player] += 100;
    log(
      g,
      `Fondo de la selva: ${names[player]} recibe 100 plátanos de la comunidad.`,
    );
  } else if (s.kind === "chance") {
    if (card % 3 === 0) {
      g.balances[player] += 150;
      log(
        g,
        `Suerte salvaje: ¡cosecha de plátanos! ${names[player]} recibe 150.`,
      );
    }
    if (card % 3 === 1) {
      pay(g, player, 75);
      log(
        g,
        `Suerte salvaje: hay que reparar las lianas. ${names[player]} paga 75.`,
      );
    }
    if (card % 3 === 2) {
      g.positions[player] = 0;
      g.balances[player] += 200;
      log(
        g,
        `Suerte salvaje: ${names[player]} vuelve a Salida y recibe 200 plátanos.`,
      );
    }
  }
}
export function canBuy(g: Game, player = 0) {
  const s = squares[g.positions[player]];
  return (
    g.phase === "action" &&
    s.kind === "property" &&
    !g.owners[s.id] &&
    g.balances[player] >= s.price
  );
}
export function roll(g: Game, dice: [number, number], card: number): Game {
  if (g.phase !== "roll") return g;
  const n = structuredClone(g);
  n.dice = dice;
  n.phase = "action";
  move(n, 0, dice, card);
  finish(n);
  return n;
}
export function buy(g: Game): Game {
  if (!canBuy(g)) return g;
  const n = structuredClone(g),
    s = squares[n.positions[0]];
  n.balances[0] -= s.price;
  n.owners[s.id] = 1;
  log(n, `Compraste ${s.name} por ${s.price} plátanos. ¡Tu imperio crece!`);
  finish(n);
  return n;
}
export function endTurn(g: Game, dice: [number, number], card: number): Game {
  if (g.phase !== "action") return g;
  const n = structuredClone(g);
  move(n, 1, dice, card);
  finish(n);
  if (n.phase === "finished") return n;
  const s = squares[n.positions[1]];
  if (
    s.kind === "property" &&
    !n.owners[s.id] &&
    n.balances[1] > s.price + 200
  ) {
    n.balances[1] -= s.price;
    n.owners[s.id] = 2;
    log(n, `Coco compra ${s.name} por ${s.price} plátanos.`);
  }
  n.round++;
  n.phase = "roll";
  finish(n);
  return n;
}
export function randomDie() {
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= 4294967292);
  return (value[0] % 6) + 1;
}
export function readSavedGame(value: string | null): Game | null {
  try {
    const g: Game = JSON.parse(value ?? "null");
    if (
      !g ||
      g.version !== 1 ||
      !["roll", "action", "finished"].includes(g.phase) ||
      !Number.isInteger(g.round) ||
      g.round < 1 ||
      g.round > 21
    )
      return null;
    if (
      !Array.isArray(g.balances) ||
      g.balances.length !== 2 ||
      !g.balances.every((n) => Number.isInteger(n) && n >= 0 && n < 100000)
    )
      return null;
    if (
      !Array.isArray(g.positions) ||
      g.positions.length !== 2 ||
      !g.positions.every((n) => Number.isInteger(n) && n >= 0 && n < 24)
    )
      return null;
    if (
      !Array.isArray(g.owners) ||
      g.owners.length !== 24 ||
      !g.owners.every(
        (n, i) =>
          [0, 1, 2].includes(n) && (squares[i].kind === "property" || n === 0),
      )
    )
      return null;
    if (
      !Array.isArray(g.dice) ||
      g.dice.length !== 2 ||
      !g.dice.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)
    )
      return null;
    if (
      !Array.isArray(g.jailed) ||
      g.jailed.length !== 2 ||
      !g.jailed.every((n) => typeof n === "boolean")
    )
      return null;
    if (
      !Array.isArray(g.log) ||
      g.log.length > 40 ||
      !g.log.every((n) => typeof n === "string" && n.length <= 300)
    )
      return null;
    if (![null, -1, 0, 1].includes(g.winner)) return null;
    return g;
  } catch {
    return null;
  }
}
