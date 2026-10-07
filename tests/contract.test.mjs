import assert from "node:assert/strict";
import ganache from "ganache";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
} from "viem";
import { readFileSync } from "node:fs";
const artifact = JSON.parse(readFileSync("src/contract.json", "utf8"));
const rpc = ganache.provider({
  logging: { quiet: true },
  chain: { chainId: 11155111, hardfork: "shanghai" },
  wallet: { deterministic: true },
  miner: { defaultTransactionGasLimit: "estimate" },
});
const transport = custom(rpc),
  publicClient = createPublicClient({ transport, pollingInterval: 10 }),
  wallet = createWalletClient({ transport });
const [account, stranger] = await wallet.getAddresses();
let assertions = 0;
const ok = (condition, description) => {
  assert.ok(condition, description);
  assertions++;
};
try {
  const hash = await wallet.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    account,
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress;
  ok(receipt.status === "success" && address, "deployment confirmed");
  const read = (functionName, args = []) =>
    publicClient.readContract({
      address,
      abi: artifact.abi,
      functionName,
      args,
    });
  const send = async (functionName) => {
    const hash = await wallet.writeContract({
      address,
      abi: artifact.abi,
      functionName,
      account,
      chain: null,
      gas: 400_000n,
    });
    return publicClient.waitForTransactionReceipt({ hash });
  };
  const initial = await read("getState");
  ok(initial[0][0] === 1500n && initial[0][1] === 1500n, "starting balance");
  await assert.rejects(
    publicClient.simulateContract({
      address,
      abi: artifact.abi,
      functionName: "roll",
      account: stranger,
    }),
  );
  assertions++;
  await assert.rejects(
    publicClient.simulateContract({
      address,
      abi: artifact.abi,
      functionName: "buy",
      account,
    }),
  );
  assertions++;
  await assert.rejects(
    publicClient.simulateContract({
      address,
      abi: artifact.abi,
      functionName: "endTurn",
      account,
    }),
  );
  assertions++;
  let purchases = 0,
    rolls = 0,
    payments = 0,
    rounds = 0;
  while ((await read("getState"))[6] !== 2) {
    const rollReceipt = await send("roll");
    ok(rollReceipt.status === "success", "roll receipt");
    rolls++;
    let state = await read("getState");
    ok(
      state[1].every((n) => n < 24),
      "positions bounded",
    );
    ok(
      state[4].every((n) => n >= 1 && n <= 6),
      "dice bounded",
    );
    await assert.rejects(
      publicClient.simulateContract({
        address,
        abi: artifact.abi,
        functionName: "roll",
        account,
      }),
    );
    assertions++;
    for (const log of rollReceipt.logs) {
      const e = decodeEventLog({
        abi: artifact.abi,
        data: log.data,
        topics: log.topics,
      });
      if (e.eventName === "Payment") payments++;
    }
    if (state[6] === 2) break;
    const position = state[1][0],
      price = await read("price", [position]);
    if (price > 0n && state[2][position] === 0 && state[0][0] >= price) {
      const priorBalance = state[0][0];
      const bought = await send("buy");
      ok(bought.status === "success", "buy receipt");
      state = await read("getState");
      ok(state[2][position] === 1, "ownership persisted");
      ok(state[0][0] === priorBalance - price, "price debited exactly");
      purchases++;
      await assert.rejects(
        publicClient.simulateContract({
          address,
          abi: artifact.abi,
          functionName: "buy",
          account,
        }),
      );
      assertions++;
    }
    if (state[6] === 2) break;
    const oldRound = state[5];
    await send("endTurn");
    state = await read("getState");
    ok(
      state[6] === 2 || state[5] === oldRound + 1,
      "Coco finishes and round advances",
    );
    ok(
      state[0].every((n) => n >= 0n),
      "no negative balances",
    );
    rounds++;
    ok(rounds <= 20, "bounded game length");
  }
  const final = await read("getState");
  ok([-1, 0, 1].includes(final[7]), "winner persisted");
  await assert.rejects(
    publicClient.simulateContract({
      address,
      abi: artifact.abi,
      functionName: "roll",
      account,
    }),
  );
  assertions++;
  await assert.rejects(
    publicClient.simulateContract({
      address,
      abi: artifact.abi,
      functionName: "endTurn",
      account,
    }),
  );
  assertions++;
  ok(purchases > 0, "purchase flow exercised");
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        assertions,
        rolls,
        purchases,
        payments,
        rounds,
        finalRound: final[5],
        winner: final[7],
        network: "local Ganache EVM, chainId 11155111; not public Sepolia",
      },
      null,
      2,
    ),
  );
} finally {
  await rpc.disconnect();
}
