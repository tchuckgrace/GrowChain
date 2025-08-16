 
import { describe, it, expect, beforeEach } from "vitest";

// Mock contract state and functions
interface FarmTokenContract {
	admin: string;
	paused: boolean;
	totalSupply: bigint;
	burnFeePercent: bigint;
	balances: Map<string, bigint>;
	staked: Map<string, bigint>;
	allowances: Map<string, bigint>;
	delegations: Map<string, string>;
	mintedAmounts: Map<string, bigint>;
	MAX_SUPPLY: bigint;
	MINT_CAP_PER_USER: bigint;

	isAdmin(caller: string): boolean;
	setPaused(
		caller: string,
		pause: boolean
	): { value: boolean } | { error: number };
	setBurnFeePercent(
		caller: string,
		newPercent: bigint
	): { value: bigint } | { error: number };
	mint(
		caller: string,
		recipient: string,
		amount: bigint
	): { value: boolean } | { error: number };
	burn(caller: string, amount: bigint): { value: boolean } | { error: number };
	transfer(
		caller: string,
		recipient: string,
		amount: bigint
	): { value: boolean } | { error: number };
	approve(
		caller: string,
		spender: string,
		amount: bigint
	): { value: boolean } | { error: number };
	transferFrom(
		caller: string,
		owner: string,
		recipient: string,
		amount: bigint
	): { value: boolean } | { error: number };
	stake(caller: string, amount: bigint): { value: boolean } | { error: number };
	unstake(
		caller: string,
		amount: bigint
	): { value: boolean } | { error: number };
	delegate(
		caller: string,
		delegatee: string
	): { value: boolean } | { error: number };
	revokeDelegation(caller: string): { value: boolean } | { error: number };
	getBalance(account: string): bigint;
	getStaked(account: string): bigint;
	getAllowance(owner: string, spender: string): bigint;
	getDelegatee(delegator: string): string | undefined;
}

const mockContract: FarmTokenContract = {
	admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
	paused: false,
	totalSupply: 0n,
	burnFeePercent: 1n,
	balances: new Map(),
	staked: new Map(),
	allowances: new Map(),
	delegations: new Map(),
	mintedAmounts: new Map(),
	MAX_SUPPLY: 500_000_000n,
	MINT_CAP_PER_USER: 1_000_000n,

	isAdmin(caller: string) {
		return caller === this.admin;
	},

	setPaused(caller: string, pause: boolean) {
		if (!this.isAdmin(caller)) return { error: 100 };
		this.paused = pause;
		return { value: pause };
	},

	setBurnFeePercent(caller: string, newPercent: bigint) {
		if (!this.isAdmin(caller)) return { error: 100 };
		if (newPercent > 5n) return { error: 106 };
		this.burnFeePercent = newPercent;
		return { value: newPercent };
	},

	mint(caller: string, recipient: string, amount: bigint) {
		if (!this.isAdmin(caller)) return { error: 100 };
		if (amount <= 0n) return { error: 106 };
		if (recipient === "SP000000000000000000002Q6VF78") return { error: 105 };
		const currentMinted = this.mintedAmounts.get(recipient) || 0n;
		const newMinted = currentMinted + amount;
		if (newMinted > this.MINT_CAP_PER_USER) return { error: 110 };
		if (this.totalSupply + amount > this.MAX_SUPPLY) return { error: 103 };
		this.mintedAmounts.set(recipient, newMinted);
		this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
		this.totalSupply += amount;
		return { value: true };
	},

	burn(caller: string, amount: bigint) {
		if (this.paused) return { error: 104 };
		if (amount <= 0n) return { error: 106 };
		const balance = this.balances.get(caller) || 0n;
		if (balance < amount) return { error: 101 };
		this.balances.set(caller, balance - amount);
		this.totalSupply -= amount;
		return { value: true };
	},

	transfer(caller: string, recipient: string, amount: bigint) {
		if (this.paused) return { error: 104 };
		if (amount <= 0n) return { error: 106 };
		if (recipient === "SP000000000000000000002Q6VF78") return { error: 105 };
		const balance = this.balances.get(caller) || 0n;
		if (balance < amount) return { error: 101 };
		const burnAmount = (amount * this.burnFeePercent) / 100n;
		const transferAmount = amount - burnAmount;
		this.balances.set(caller, balance - amount);
		this.totalSupply -= burnAmount;
		this.balances.set(
			recipient,
			(this.balances.get(recipient) || 0n) + transferAmount
		);
		return { value: true };
	},

	approve(caller: string, spender: string, amount: bigint) {
		if (this.paused) return { error: 104 };
		if (spender === "SP000000000000000000002Q6VF78") return { error: 105 };
		this.allowances.set(`${caller}:${spender}`, amount);
		return { value: true };
	},

	transferFrom(
		caller: string,
		owner: string,
		recipient: string,
		amount: bigint
	) {
		if (this.paused) return { error: 104 };
		if (amount <= 0n) return { error: 106 };
		if (recipient === "SP000000000000000000002Q6VF78") return { error: 105 };
		const allowance = this.allowances.get(`${owner}:${caller}`) || 0n;
		const ownerBalance = this.balances.get(owner) || 0n;
		if (allowance < amount) return { error: 109 };
		if (ownerBalance < amount) return { error: 101 };
		const burnAmount = (amount * this.burnFeePercent) / 100n;
		const transferAmount = amount - burnAmount;
		this.allowances.set(`${owner}:${caller}`, allowance - amount);
		this.balances.set(owner, ownerBalance - amount);
		this.totalSupply -= burnAmount;
		this.balances.set(
			recipient,
			(this.balances.get(recipient) || 0n) + transferAmount
		);
		return { value: true };
	},

	stake(caller: string, amount: bigint) {
		if (this.paused) return { error: 104 };
		if (amount <= 0n) return { error: 106 };
		const balance = this.balances.get(caller) || 0n;
		if (balance < amount) return { error: 101 };
		this.balances.set(caller, balance - amount);
		this.staked.set(caller, (this.staked.get(caller) || 0n) + amount);
		return { value: true };
	},

	unstake(caller: string, amount: bigint) {
		if (this.paused) return { error: 104 };
		if (amount <= 0n) return { error: 106 };
		const stakeBalance = this.staked.get(caller) || 0n;
		if (stakeBalance < amount) return { error: 102 };
		this.staked.set(caller, stakeBalance - amount);
		this.balances.set(caller, (this.balances.get(caller) || 0n) + amount);
		return { value: true };
	},

	delegate(caller: string, delegatee: string) {
		if (this.paused) return { error: 104 };
		if (delegatee === "SP000000000000000000002Q6VF78") return { error: 105 };
		if (this.delegations.has(caller)) return { error: 107 };
		this.delegations.set(caller, delegatee);
		return { value: true };
	},

	revokeDelegation(caller: string) {
		if (this.paused) return { error: 104 };
		if (!this.delegations.has(caller)) return { error: 108 };
		this.delegations.delete(caller);
		return { value: true };
	},

	getBalance(account: string): bigint {
		return this.balances.get(account) || 0n;
	},

	getStaked(account: string): bigint {
		return this.staked.get(account) || 0n;
	},

	getAllowance(owner: string, spender: string): bigint {
		return this.allowances.get(`${owner}:${spender}`) || 0n;
	},

	getDelegatee(delegator: string): string | undefined {
		return this.delegations.get(delegator);
	},
};

describe("GrowChain Farm Token", () => {
	beforeEach(() => {
		mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
		mockContract.paused = false;
		mockContract.totalSupply = 0n;
		mockContract.burnFeePercent = 1n;
		mockContract.balances = new Map();
		mockContract.staked = new Map();
		mockContract.allowances = new Map();
		mockContract.delegations = new Map();
		mockContract.mintedAmounts = new Map();
	});

	it("should mint tokens when called by admin", () => {
		const result = mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		expect(result).toEqual({ value: true });
		expect(mockContract.getBalance("ST2CY5...")).toBe(1000n);
		expect(mockContract.totalSupply).toBe(1000n);
	});

	it("should prevent minting over per-user cap", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 500_000n);
		const result = mockContract.mint(mockContract.admin, "ST2CY5...", 600_000n);
		expect(result).toEqual({ error: 110 });
	});

	it("should burn tokens", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		const result = mockContract.burn("ST2CY5...", 300n);
		expect(result).toEqual({ value: true });
		expect(mockContract.getBalance("ST2CY5...")).toBe(700n);
		expect(mockContract.totalSupply).toBe(700n);
	});

	it("should transfer tokens with burn fee", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		const result = mockContract.transfer("ST2CY5...", "ST3NB...", 100n);
		expect(result).toEqual({ value: true });
		expect(mockContract.getBalance("ST2CY5...")).toBe(900n);
		expect(mockContract.getBalance("ST3NB...")).toBe(99n); // 100 - 1% burn
		expect(mockContract.totalSupply).toBe(999n);
	});

	it("should approve and transfer-from with burn fee", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		mockContract.approve("ST2CY5...", "ST3NB...", 200n);
		const result = mockContract.transferFrom(
			"ST3NB...",
			"ST2CY5...",
			"ST4PQ...",
			100n
		);
		expect(result).toEqual({ value: true });
		expect(mockContract.getBalance("ST2CY5...")).toBe(900n);
		expect(mockContract.getBalance("ST4PQ...")).toBe(99n);
		expect(mockContract.getAllowance("ST2CY5...", "ST3NB...")).toBe(100n);
		expect(mockContract.totalSupply).toBe(999n);
	});

	it("should stake tokens", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		const result = mockContract.stake("ST2CY5...", 500n);
		expect(result).toEqual({ value: true });
		expect(mockContract.getBalance("ST2CY5...")).toBe(500n);
		expect(mockContract.getStaked("ST2CY5...")).toBe(500n);
	});

	it("should unstake tokens", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		mockContract.stake("ST2CY5...", 500n);
		const result = mockContract.unstake("ST2CY5...", 200n);
		expect(result).toEqual({ value: true });
		expect(mockContract.getStaked("ST2CY5...")).toBe(300n);
		expect(mockContract.getBalance("ST2CY5...")).toBe(700n);
	});

	it("should delegate staking power", () => {
		const result = mockContract.delegate("ST2CY5...", "ST3NB...");
		expect(result).toEqual({ value: true });
		expect(mockContract.getDelegatee("ST2CY5...")).toBe("ST3NB...");
	});

	it("should revoke delegation", () => {
		mockContract.delegate("ST2CY5...", "ST3NB...");
		const result = mockContract.revokeDelegation("ST2CY5...");
		expect(result).toEqual({ value: true });
		expect(mockContract.getDelegatee("ST2CY5...")).toBeUndefined();
	});

	it("should not allow non-admin to set burn fee", () => {
		const result = mockContract.setBurnFeePercent("ST2CY5...", 3n);
		expect(result).toEqual({ error: 100 });
	});

	it("should not allow transfers when paused", () => {
		mockContract.setPaused(mockContract.admin, true);
		const result = mockContract.transfer("ST2CY5...", "ST3NB...", 100n);
		expect(result).toEqual({ error: 104 });
	});

	it("should not allow transfer to zero address", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		const result = mockContract.transfer(
			"ST2CY5...",
			"SP000000000000000000002Q6VF78",
			100n
		);
		expect(result).toEqual({ error: 105 });
	});

	it("should not allow invalid amount in transfer", () => {
		mockContract.mint(mockContract.admin, "ST2CY5...", 1000n);
		const result = mockContract.transfer("ST2CY5...", "ST3NB...", 0n);
		expect(result).toEqual({ error: 106 });
	});
});