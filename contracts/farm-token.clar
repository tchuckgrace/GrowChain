 
;; farm-token.clar
;; GrowChain Farm Token Contract
;; Clarity v2 (latest as of 2025)
;; Implements SIP-010 compliant fungible token with mint, burn, transfer, staking, allowances, delegation, and admin controls.

(use-trait sip010-trait .sip010-ft-trait.sip010-ft-trait)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INSUFFICIENT-BALANCE u101)
(define-constant ERR-INSUFFICIENT-STAKE u102)
(define-constant ERR-MAX-SUPPLY-REACHED u103)
(define-constant ERR-PAUSED u104)
(define-constant ERR-ZERO-ADDRESS u105)
(define-constant ERR-INVALID-AMOUNT u106)
(define-constant ERR-ALREADY-DELEGATED u107)
(define-constant ERR-NOT-DELEGATED u108)
(define-constant ERR-ALLOWANCE-EXCEEDED u109)
(define-constant ERR-MINT-CAP-REACHED u110)

;; Token metadata (SIP-010 compliant)
(define-constant TOKEN-NAME "GrowChain Farm Token")
(define-constant TOKEN-SYMBOL "GFT")
(define-constant TOKEN-DECIMALS u6)
(define-constant MAX-SUPPLY u500000000) ;; max 500M tokens (decimals separate)
(define-constant MINT-CAP-PER-USER u1000000) ;; Limit mint per user for fairness

;; Admin and contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-supply uint u0)
(define-data-var burn-fee-percent uint u1) ;; 1% burn on transfers for deflationary mechanism

;; Balances, stakes, allowances, and delegations
(define-map balances principal uint)
(define-map staked-balances principal uint)
(define-map allowances {owner: principal, spender: principal} uint)
(define-map delegations {delegator: principal} principal) ;; Delegate staking power
(define-map minted-amounts principal uint) ;; Track minted per user

;; Events (using print for logging)
(define-private (log-event (event-name (string-ascii 32)) (data (optional (tuple (key (string-ascii 32)) (value uint)))))
  (print { event: event-name, data: data })
)

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: burn-fee calculation
(define-private (calculate-burn-fee (amount uint))
  (/ (* amount (var-get burn-fee-percent)) u100)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (log-event "admin-transfer" (some {key: "new-admin", value: u0})) ;; Dummy value
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (log-event "pause-set" (some {key: "paused", value: (if pause u1 u0)}))
    (ok pause)
  )
)

;; Set burn fee percent (admin only, max 5%)
(define-public (set-burn-fee-percent (new-percent uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= new-percent u5) (err ERR-INVALID-AMOUNT))
    (var-set burn-fee-percent new-percent)
    (log-event "burn-fee-update" (some {key: "percent", value: new-percent}))
    (ok new-percent)
  )
)

;; Mint new tokens (with per-user cap)
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (not (is-eq recipient 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (let ((current-minted (default-to u0 (map-get? minted-amounts recipient)))
          (new-minted (+ current-minted amount))
          (new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-minted MINT-CAP-PER-USER) (err ERR-MINT-CAP-REACHED))
      (asserts! (<= new-supply MAX-SUPPLY) (err ERR-MAX-SUPPLY-REACHED))
      (map-set minted-amounts recipient new-minted)
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (var-set total-supply new-supply)
      (log-event "mint" (some {key: "amount", value: amount}))
      (ok true)
    )
  )
)

;; Burn tokens
(define-public (burn (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (log-event "burn" (some {key: "amount", value: amount}))
      (ok true)
    )
  )
)

;; Transfer tokens (with burn fee)
(define-public (transfer (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (not (is-eq recipient 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (let ((sender-balance (default-to u0 (map-get? balances tx-sender)))
          (burn-amount (calculate-burn-fee amount))
          (transfer-amount (- amount burn-amount)))
      (asserts! (>= sender-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- sender-balance amount))
      (var-set total-supply (- (var-get total-supply) burn-amount))
      (map-set balances recipient (+ transfer-amount (default-to u0 (map-get? balances recipient))))
      (log-event "transfer" (some {key: "amount", value: transfer-amount}))
      (ok true)
    )
  )
)

;; Approve allowance for spender
(define-public (approve (spender principal) (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (not (is-eq spender 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (map-set allowances {owner: tx-sender, spender: spender} amount)
    (log-event "approve" (some {key: "amount", value: amount}))
    (ok true)
  )
)

;; Transfer from (using allowance)
(define-public (transfer-from (owner principal) (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (not (is-eq recipient 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (let ((allowance (default-to u0 (map-get? allowances {owner: owner, spender: tx-sender})))
          (owner-balance (default-to u0 (map-get? balances owner)))
          (burn-amount (calculate-burn-fee amount))
          (transfer-amount (- amount burn-amount)))
      (asserts! (>= allowance amount) (err ERR-ALLOWANCE-EXCEEDED))
      (asserts! (>= owner-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set allowances {owner: owner, spender: tx-sender} (- allowance amount))
      (map-set balances owner (- owner-balance amount))
      (var-set total-supply (- (var-get total-supply) burn-amount))
      (map-set balances recipient (+ transfer-amount (default-to u0 (map-get? balances recipient))))
      (log-event "transfer-from" (some {key: "amount", value: transfer-amount}))
      (ok true)
    )
  )
)

;; Stake tokens for governance
(define-public (stake (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (map-set staked-balances tx-sender (+ amount (default-to u0 (map-get? staked-balances tx-sender))))
      (log-event "stake" (some {key: "amount", value: amount}))
      (ok true)
    )
  )
)

;; Unstake tokens
(define-public (unstake (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (let ((stake-balance (default-to u0 (map-get? staked-balances tx-sender))))
      (asserts! (>= stake-balance amount) (err ERR-INSUFFICIENT-STAKE))
      (map-set staked-balances tx-sender (- stake-balance amount))
      (map-set balances tx-sender (+ amount (default-to u0 (map-get? balances tx-sender))))
      (log-event "unstake" (some {key: "amount", value: amount}))
      (ok true)
    )
  )
)

;; Delegate staking power
(define-public (delegate (delegatee principal))
  (begin
    (ensure-not-paused)
    (asserts! (not (is-eq delegatee 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (asserts! (is-none? (map-get? delegations {delegator: tx-sender})) (err ERR-ALREADY-DELEGATED))
    (map-set delegations {delegator: tx-sender} delegatee)
    (log-event "delegate" (some {key: "delegatee", value: u0})) ;; Dummy value
    (ok true)
  )
)

;; Revoke delegation
(define-public (revoke-delegation)
  (begin
    (ensure-not-paused)
    (asserts! (is-some? (map-get? delegations {delegator: tx-sender})) (err ERR-NOT-DELEGATED))
    (map-delete delegations {delegator: tx-sender})
    (log-event "revoke-delegation" none)
    (ok true)
  )
)

;; SIP-010: get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; SIP-010: get name
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

;; SIP-010: get symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

;; SIP-010: get decimals
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

;; SIP-010: get balance
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

;; SIP-010: get token URI
(define-read-only (get-token-uri)
  (ok (some "https://growchain.com/token-metadata.json"))
)

;; Read-only: get staked balance
(define-read-only (get-staked (account principal))
  (ok (default-to u0 (map-get? staked-balances account)))
)

;; Read-only: get allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances {owner: owner, spender: spender})))
)

;; Read-only: get delegatee
(define-read-only (get-delegatee (delegator principal))
  (ok (map-get? delegations {delegator: delegator}))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: get burn fee percent
(define-read-only (get-burn-fee-percent)
  (ok (var-get burn-fee-percent))
)