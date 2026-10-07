// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Casual Sepolia game against an automated opponent. No deposits or prizes.
/// @dev Block entropy is intentionally NOT suitable for gambling or valuable assets.
contract MonoPoly {
    address public immutable controller;
    uint256[2] public balances = [uint256(1500), uint256(1500)];
    uint8[2] public positions;
    uint8[24] public owners;
    bool[2] public jailed;
    uint8[2] public dice = [3, 5];
    uint8 public round = 1;
    uint8 public phase; // 0 roll, 1 action, 2 finished
    int8 public winner = -2; // -2 playing, -1 draw, 0 human, 1 Coco
    uint256 private nonce;
    event Played(uint8 indexed player, uint8 position, uint8 die1, uint8 die2);
    event Purchased(uint8 indexed player, uint8 indexed square, uint256 price);
    event Payment(uint8 indexed player, uint8 indexed reason, uint256 amount);
    event Finished(int8 winner);
    modifier onlyController() { require(msg.sender == controller, "Not your game"); _; }
    constructor() { controller = msg.sender; }
    function isProperty(uint8 i) public pure returns (bool) {
        return i == 1 || i == 2 || i == 4 || i == 7 || i == 8 || i == 10 || i == 13 || i == 14 || i == 16 || i == 19 || i == 20 || i == 22 || i == 23;
    }
    function price(uint8 i) public pure returns (uint256) { return isProperty(i) ? 100 + uint256(i / 6) * 60 : 0; }
    function rent(uint8 i) public pure returns (uint256) { return isProperty(i) ? 20 + uint256(i / 6) * 15 : 0; }
    function entropy() private returns (uint256) {
        return uint256(keccak256(abi.encode(block.prevrandao, blockhash(block.number - 1), address(this), ++nonce)));
    }
    function pay(uint8 p, uint256 amount, bool toOpponent) private {
        uint256 paid = balances[p] < amount ? balances[p] : amount;
        balances[p] -= paid;
        if (toOpponent) balances[1 - p] += paid;
        emit Payment(p, toOpponent ? 0 : 1, paid);
    }
    function move(uint8 p, uint256 seed) private {
        if (jailed[p]) { jailed[p] = false; emit Played(p, positions[p], 0, 0); return; }
        uint8 a = uint8(seed % 6 + 1);
        uint8 b = uint8((seed / 6) % 6 + 1);
        if (p == 0) dice = [a, b];
        uint8 next = positions[p] + a + b;
        if (next >= 24) balances[p] += 200;
        uint8 s = next % 24;
        positions[p] = s;
        emit Played(p, s, a, b);
        if (isProperty(s) && owners[s] != 0 && owners[s] != p + 1) pay(p, rent(s), true);
        else if (s == 11) pay(p, 100, false);
        else if (s == 18) { positions[p] = 6; jailed[p] = true; }
        else if (s == 5 || s == 15 || s == 21) { balances[p] += 100; emit Payment(p, 2, 100); }
        else if (s == 3 || s == 9 || s == 17) {
            uint256 card = (seed / 36) % 3;
            if (card == 0) { balances[p] += 150; emit Payment(p, 2, 150); }
            else if (card == 1) pay(p, 75, false);
            else { positions[p] = 0; balances[p] += 200; emit Payment(p, 2, 200); }
        }
    }
    function wealth(uint8 p) public view returns (uint256 total) {
        total = balances[p];
        for (uint8 i; i < 24; i++) if (owners[i] == p + 1) total += price(i);
    }
    function finish() private {
        if (balances[0] == 0 || balances[1] == 0 || round > 20) {
            phase = 2;
            winner = balances[0] == 0 ? int8(1) : balances[1] == 0 ? int8(0) : wealth(0) == wealth(1) ? int8(-1) : wealth(0) > wealth(1) ? int8(0) : int8(1);
            emit Finished(winner);
        }
    }
    function roll() external onlyController {
        require(phase == 0, "Roll unavailable"); phase = 1; move(0, entropy()); finish();
    }
    function buy() external onlyController {
        uint8 s = positions[0];
        require(phase == 1 && isProperty(s) && owners[s] == 0, "Not for sale");
        require(balances[0] >= price(s), "Not enough bananas");
        balances[0] -= price(s); owners[s] = 1; emit Purchased(0, s, price(s)); finish();
    }
    function endTurn() external onlyController {
        require(phase == 1, "Roll first"); move(1, entropy()); finish();
        if (phase == 2) return;
        uint8 s = positions[1];
        if (isProperty(s) && owners[s] == 0 && balances[1] > price(s) + 200) {
            balances[1] -= price(s); owners[s] = 2; emit Purchased(1, s, price(s));
        }
        round++; phase = 0; finish();
    }
    function getState() external view returns (uint256[2] memory, uint8[2] memory, uint8[24] memory, bool[2] memory, uint8[2] memory, uint8, uint8, int8) {
        return (balances, positions, owners, jailed, dice, round, phase, winner);
    }
}
