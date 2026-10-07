import solc from "solc";
import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync("contracts/MonoPoly.sol", "utf8");
const input = {
  language: "Solidity",
  sources: { "MonoPoly.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "shanghai",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors?.filter((e) => e.severity === "error") ?? [];
if (errors.length)
  throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
const contract = output.contracts["MonoPoly.sol"].MonoPoly;
writeFileSync(
  "src/contract.json",
  JSON.stringify({
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }),
);
console.log(
  `MonoPoly compiled with solc ${solc.version()}; ${contract.evm.bytecode.object.length / 2} bytes.`,
);
