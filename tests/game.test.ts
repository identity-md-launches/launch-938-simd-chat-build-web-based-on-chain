import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialGame,
  roll,
  buy,
  endTurn,
  canBuy,
  squares,
  readSavedGame,
  wealth,
} from "../src/game.ts";

test("24 squares include 13 properties, chance and community cards", () => {
  assert.equal(squares.length, 24);
  assert.equal(squares.filter((s) => s.kind === "property").length, 13);
  assert.equal(squares.filter((s) => s.kind === "chance").length, 3);
  assert.equal(squares.filter((s) => s.kind === "chest").length, 3);
});
test("roll, purchase, duplicate protection, and Coco turn", () => {
  const start = initialGame(),
    moved = roll(start, [1, 1], 0);
  assert.equal(start.positions[0], 0);
  assert.equal(moved.positions[0], 2);
  assert.equal(canBuy(moved), true);
  const bought = buy(moved);
  assert.equal(bought.balances[0], 1400);
  assert.equal(bought.owners[2], 1);
  assert.deepEqual(buy(bought), bought);
  assert.deepEqual(roll(bought, [6, 6], 0), bought);
  const next = endTurn(bought, [2, 2], 0);
  assert.equal(next.phase, "roll");
  assert.equal(next.round, 2);
  assert.equal(next.owners[4], 2);
  assert.equal(next.balances[1], 1400);
});
test("rent transfers money to the owner and landing on your own property is free", () => {
  const start = initialGame();
  start.owners[2] = 2;
  const next = roll(start, [1, 1], 0);
  assert.deepEqual(next.balances, [1480, 1520]);
  start.owners[2] = 1;
  assert.deepEqual(roll(start, [1, 1], 0).balances, [1500, 1500]);
});
test("all chance outcomes, community chest, tax, and crossing start", () => {
  assert.equal(roll(initialGame(), [1, 2], 0).balances[0], 1650);
  assert.equal(roll(initialGame(), [1, 2], 1).balances[0], 1425);
  const teleported = roll(initialGame(), [1, 2], 2);
  assert.equal(teleported.positions[0], 0);
  assert.equal(teleported.balances[0], 1700);
  assert.equal(roll(initialGame(), [1, 4], 0).balances[0], 1600);
  assert.equal(roll(initialGame(), [5, 6], 0).balances[0], 1400);
  const start = initialGame();
  start.positions[0] = 23;
  assert.equal(roll(start, [1, 1], 0).balances[0], 1700);
});
test("jail skips one roll, visiting jail does not", () => {
  const start = initialGame();
  start.positions[0] = 12;
  let next = roll(start, [3, 3], 0);
  assert.equal(next.positions[0], 6);
  assert.equal(next.jailed[0], true);
  next = endTurn(next, [1, 1], 0);
  next = roll(next, [6, 6], 0);
  assert.equal(next.positions[0], 6);
  assert.equal(next.jailed[0], false);
  assert.equal(next.phase, "action");
  assert.equal(roll(initialGame(), [3, 3], 0).jailed[0], false);
});
test("bankruptcy caps transfer at remaining funds and ends game", () => {
  const start = initialGame();
  start.balances[0] = 5;
  start.owners[2] = 2;
  const next = roll(start, [1, 1], 0);
  assert.deepEqual(next.balances, [0, 1505]);
  assert.equal(next.phase, "finished");
  assert.equal(next.winner, 1);
  assert.deepEqual(endTurn(next, [1, 1], 0), next);
});
test("insufficient funds blocks purchase and ending turn before roll is impossible", () => {
  const start = initialGame();
  start.balances[0] = 50;
  assert.deepEqual(endTurn(start, [1, 1], 0), start);
  const next = roll(start, [1, 1], 0);
  assert.equal(canBuy(next), false);
  assert.deepEqual(buy(next), next);
});
test("20 rounds end in wealth comparison with property value included", () => {
  const start = initialGame();
  start.round = 20;
  start.owners[23] = 1;
  const next = endTurn(roll(start, [3, 3], 0), [3, 3], 0);
  assert.equal(next.phase, "finished");
  assert.equal(next.winner, 0);
  assert.equal(wealth(next, 0), 1780);
});
test("saved practice validates structure and rejects corruption", () => {
  const start = initialGame();
  assert.deepEqual(readSavedGame(JSON.stringify(start)), start);
  assert.equal(readSavedGame("{broken"), null);
  assert.equal(readSavedGame(null), null);
  start.positions[0] = 99;
  assert.equal(readSavedGame(JSON.stringify(start)), null);
});
