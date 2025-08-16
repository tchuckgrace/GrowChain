# GrowChain

A blockchain-powered platform for sustainable agriculture that connects farmers, consumers, and investors to foster transparent supply chains, incentivize eco-friendly practices, and enable tokenized agricultural investments — all on-chain.

---

## Overview

GrowChain comprises eight main smart contracts that together create a decentralized, transparent, and rewarding ecosystem for sustainable agriculture:

1. **Farm Token Contract** – Issues and manages farm-specific tokens for investment and rewards.
2. **NFT Provenance Contract** – Tracks the origin and journey of agricultural products as NFTs.
3. **Governance DAO Contract** – Enables community voting on sustainability initiatives.
4. **Revenue Sharing Contract** – Distributes profits from produce sales among farmers and token holders.
5. **Sustainability Rewards Contract** – Rewards farmers for verified eco-friendly practices.
6. **Crowdfunding Contract** – Facilitates tokenized investments in farms or agricultural projects.
7. **Treasury Management Contract** – Manages and routes funds across the ecosystem.
8. **Oracle Data Contract** – Integrates off-chain agricultural data for transparency and verification.

---

## Features

- **Farm-branded tokens** for investment and governance  
- **NFT-based provenance tracking** for farm-to-table transparency  
- **DAO governance** for community-driven sustainability decisions  
- **Automated revenue sharing** from produce sales  
- **Sustainability rewards** for eco-friendly farming practices  
- **Crowdfunding for agricultural projects** with tokenized returns  
- **Transparent treasury management** for all funds  
- **Real-time agricultural data integration** via oracles  

---

## Smart Contracts

### Farm Token Contract
- Mint, burn, and transfer farm-specific tokens
- Staking for governance rights and revenue share
- Token supply and burn mechanisms for value stability

### NFT Provenance Contract
- Mint NFTs representing batches of produce
- Track origin, harvest, and distribution data
- Immutable supply chain records for transparency

### Governance DAO Contract
- Token-weighted voting for sustainability proposals
- On-chain execution of approved initiatives
- Quorum and voting period configurations

### Revenue Sharing Contract
- Distributes sales revenue among farmers and token holders
- Configurable profit-sharing percentages
- Transparent payout logs on-chain

### Sustainability Rewards Contract
- Tracks eco-friendly practices (e.g., organic farming, water conservation)
- Distributes token rewards based on verified metrics
- Anti-fraud mechanisms via oracle verification

### Crowdfunding Contract
- Tokenized crowdfunding for farm expansions or projects
- Automated return distribution to investors
- Transparent contribution and payout records

### Treasury Management Contract
- Routes funds across contracts (e.g., rewards, revenue sharing)
- Tracks all transactions for auditability
- Automated multi-contract payouts

### Oracle Data Contract
- Connects to off-chain data sources (e.g., IoT sensors, certification bodies)
- Verifies farming practices and supply chain data
- Updates NFT metadata with real-time information

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started)
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/growchain.git
   ```
3. Run tests:
    ```bash
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## Usage

Each smart contract is designed to operate independently while integrating with others to form a complete agricultural ecosystem. Refer to individual contract documentation for detailed function calls, parameters, and usage examples.

## License

MIT License