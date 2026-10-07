import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  getAddress,
  type Address,
  type EIP1193Provider,
  type Hex,
  type TransactionReceipt,
} from "viem";
import contract from "./contract.json";
import { initialGame, squares, type Game } from "./game";

const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
} as const;

export type Provider = EIP1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};
declare global {
  interface Window {
    ethereum?: Provider;
  }
}
export type ChainSession = {
  account: Address;
  address?: Address;
  pending?: Hex;
  pendingAction?: "deploy" | "roll" | "buy" | "endTurn";
};
export function provider() {
  if (!window.ethereum) throw new Error("NO_WALLET");
  return window.ethereum;
}
export function clients() {
  const transport = custom(provider());
  return {
    publicClient: createPublicClient({ chain: sepolia, transport }),
    wallet: createWalletClient({ chain: sepolia, transport }),
  };
}
export async function connect() {
  const { wallet } = clients();
  const [account] = await wallet.requestAddresses();
  if (!account) throw new Error("NO_ACCOUNT");
  try {
    await wallet.switchChain({ id: sepolia.id });
  } catch (error) {
    if ((error as { code?: number }).code === 4902) {
      await wallet.addChain({ chain: sepolia });
      await wallet.switchChain({ id: sepolia.id });
    } else throw error;
  }
  return getAddress(account);
}
async function verifyAccount(account: Address) {
  const { wallet } = clients();
  const accounts = await wallet.getAddresses();
  if (!accounts[0] || getAddress(accounts[0]) !== getAddress(account))
    throw new Error("ACCOUNT_CHANGED");
  if ((await wallet.getChainId()) !== sepolia.id)
    throw new Error("WRONG_CHAIN");
}
export async function deploy(account: Address) {
  await verifyAccount(account);
  return clients().wallet.deployContract({
    account,
    chain: sepolia,
    abi: contract.abi,
    bytecode: contract.bytecode as Hex,
    gas: 2_000_000n,
  });
}
export async function act(
  session: ChainSession,
  action: "roll" | "buy" | "endTurn",
) {
  await verifyAccount(session.account);
  if (!session.address) throw new Error("NO_GAME");
  const { publicClient, wallet } = clients();
  const { request } = await publicClient.simulateContract({
    address: session.address,
    abi: contract.abi,
    functionName: action,
    account: session.account,
  });
  // Roll outcomes can take a different branch between estimation and inclusion.
  // This bounded ceiling covers the most expensive branch; only used gas is charged.
  return wallet.writeContract({ ...request, gas: 400_000n });
}
export async function confirm(hash: Hex) {
  return clients().publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
    timeout: 90_000,
  });
}
export async function readGame(
  session: ChainSession,
  previousLog?: string[],
  receipt?: TransactionReceipt,
): Promise<Game> {
  await verifyAccount(session.account);
  if (!session.address) throw new Error("NO_GAME");
  const { publicClient } = clients();
  const controller = (await publicClient.readContract({
    address: session.address,
    abi: contract.abi,
    functionName: "controller",
  })) as Address;
  if (getAddress(controller) !== getAddress(session.account))
    throw new Error("ACCOUNT_CHANGED");
  const state = (await publicClient.readContract({
    address: session.address,
    abi: contract.abi,
    functionName: "getState",
  })) as [
    bigint[],
    number[],
    number[],
    boolean[],
    number[],
    number,
    number,
    number,
  ];
  const g: Game = {
    ...initialGame(),
    balances: state[0].map(Number) as [number, number],
    positions: state[1] as [number, number],
    owners: [...state[2]],
    jailed: state[3] as [boolean, boolean],
    dice: state[4] as [number, number],
    round: state[5],
    phase: (["roll", "action", "finished"] as const)[state[6]],
    winner: state[7] === -2 ? null : state[7],
    log: previousLog ?? [
      "Partida recuperada de Sepolia. ¡La selva te esperaba!",
    ],
  };
  const messages: string[] = [];
  for (const item of receipt?.logs ?? []) {
    if (item.address.toLowerCase() !== session.address.toLowerCase()) continue;
    try {
      const event = decodeEventLog({
        abi: contract.abi,
        data: item.data,
        topics: item.topics,
      });
      const a = event.args as unknown as Record<string, number | bigint>;
      const who = Number(a.player) === 0 ? "Tú" : "Coco";
      if (event.eventName === "Played")
        messages.push(
          Number(a.die1) === 0
            ? `${who} descansa una tirada en la jaula.`
            : `${who} saca ${Number(a.die1) + Number(a.die2)} y llega a ${squares[Number(a.position)].name}.`,
        );
      if (event.eventName === "Purchased")
        messages.push(
          `${who} compra ${squares[Number(a.square)].name} por ${a.price} plátanos.`,
        );
      if (event.eventName === "Payment")
        messages.push(
          Number(a.reason) === 2
            ? `Carta de la selva: ${who} recibe ${a.amount} plátanos.`
            : `${who} paga ${a.amount} plátanos${Number(a.reason) === 0 ? " de alquiler" : " por una carta o peaje"}.`,
        );
      if (event.eventName === "Finished")
        messages.push(
          g.winner === -1
            ? "¡Empate! La selva tiene dos reyes."
            : g.winner === 0
              ? "¡Ganaste! La selva es tuya."
              : "Coco gana esta aventura. ¡La próxima será tuya!",
        );
    } catch {
      /* Ignore unrelated event formats. State always comes from the contract. */
    }
  }
  g.log = [...messages.reverse(), ...g.log].slice(0, 40);
  return g;
}
export function walletError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (/NO_WALLET/.test(text))
    return "No encontramos una cartera. Instala MetaMask o abre esta página desde el navegador de tu cartera y vuelve a conectar.";
  if (/4001|rejected|denied/i.test(text))
    return "Solicitud cancelada en tu cartera. Puedes volver a intentarlo cuando quieras.";
  if (/ACCOUNT_CHANGED|WRONG_CHAIN/.test(text))
    return "La cuenta o la red cambió. Vuelve a conectar la cartera que creó la partida en Sepolia.";
  if (/insufficient funds/i.test(text))
    return "Necesitas ETH de prueba en Sepolia para guardar las jugadas. Añade saldo de prueba a tu cartera y vuelve a intentarlo.";
  return "No se pudo confirmar la operación. Revisa tu cartera y la conexión; si hay una jugada pendiente, pulsa «Comprobar jugada» antes de continuar.";
}
