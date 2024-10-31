;; Research Crowdsourcing Platform Smart Contract

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-FUNDS (err u101))
(define-constant ERR-PROJECT-NOT-FOUND (err u102))
(define-constant ERR-INVALID-CONTRIBUTION (err u103))
(define-constant ERR-PROJECT-CLOSED (err u104))

;; Data Maps
;; Project details tracking
(define-map projects
    {project-id: uint}
    {
        name: (string-utf8 100),
        description: (string-utf8 500),
        owner: principal,
        total-funding: uint,
        current-phase: uint,
        is-active: bool,
        contribution-threshold: uint
    }
)

;; Contributor tracking for each project
(define-map project-contributors
    {project-id: uint, contributor: principal}
    {
        total-contributions: uint,
        token-rewards: uint,
        contribution-phases: (list 10 uint)
    }
)

;; Contribution tracking
(define-map contributions
    {project-id: uint, contribution-id: uint}
    {
        contributor: principal,
        description: (string-utf8 500),
        value: uint,
        timestamp: uint,
        phase: uint
    }
)

;; Research token contract reference
(define-constant RESEARCH-TOKEN-CONTRACT .research-token)

;; Project Creation
(define-public (create-project
    (name (string-utf8 100))
    (description (string-utf8 500))
    (initial-funding uint)
    (contribution-threshold uint)
)
    (let
        (
            (project-id (+ (var-get last-project-id) u1))
        )
        ;; Validate initial funding
        (asserts! (> initial-funding u0) ERR-INSUFFICIENT-FUNDS)

        ;; Transfer initial funding to contract
        (try! (contract-call? RESEARCH-TOKEN-CONTRACT transfer initial-funding tx-sender (as-contract tx-sender)))

        ;; Create project entry
        (map-set projects
            {project-id: project-id}
            {
                name: name,
                description: description,
                owner: tx-sender,
                total-funding: initial-funding,
                current-phase: u1,
                is-active: true,
                contribution-threshold: contribution-threshold
            }
        )

        ;; Update project counter
        (var-set last-project-id project-id)

        (ok project-id)
    )
)

;; Contribute to Project
(define-public (contribute-to-project
    (project-id uint)
    (contribution-description (string-utf8 500))
    (contribution-value uint)
)
    (let
        (
            (project (unwrap! (map-get? projects {project-id: project-id}) ERR-PROJECT-NOT-FOUND))
            (current-contributor-data
                (default-to
                    {
                        total-contributions: u0,
                        token-rewards: u0,
                        contribution-phases: (list)
                    }
                    (map-get? project-contributors {project-id: project-id, contributor: tx-sender})
                )
            )
            (contribution-id (+ (var-get last-contribution-id) u1))
        )

        ;; Validate project is active
        (asserts! (get is-active project) ERR-PROJECT-CLOSED)

        ;; Validate contribution meets threshold
        (asserts! (>= contribution-value (get contribution-threshold project)) ERR-INVALID-CONTRIBUTION)

        ;; Record contribution
        (map-set contributions
            {project-id: project-id, contribution-id: contribution-id}
            {
                contributor: tx-sender,
                description: contribution-description,
                value: contribution-value,
                timestamp: block-height,
                phase: (get current-phase project)
            }
        )

        ;; Update contributor data
        (map-set project-contributors
            {project-id: project-id, contributor: tx-sender}
            (merge current-contributor-data
                {
                    total-contributions: (+ (get total-contributions current-contributor-data) contribution-value),
                    contribution-phases: (unwrap-panic (as-max-len? (append (get contribution-phases current-contributor-data) (get current-phase project)) u10))
                }
            )
        )

        ;; Update project total funding
        (map-set projects
            {project-id: project-id}
            (merge project
                {total-funding: (+ (get total-funding project) contribution-value)}
            )
        )

        ;; Update contribution counter
        (var-set last-contribution-id contribution-id)

        (ok contribution-id)
    )
)

;; Reward Contributors
(define-public (distribute-contributor-rewards
    (project-id uint)
)
    (let
        (
            (project (unwrap! (map-get? projects {project-id: project-id}) ERR-PROJECT-NOT-FOUND))
        )

        ;; Only project owner can distribute rewards
        (asserts! (is-eq tx-sender (get owner project)) ERR-NOT-AUTHORIZED)

        ;; TODO: Implement reward calculation logic
        ;; This could involve:
        ;; 1. Calculating rewards based on contribution value
        ;; 2. Minting/transferring tokens to contributors
        ;; 3. Tracking total rewards distributed

        (ok true)
    )
)

;; Project Phase Management
(define-public (advance-project-phase
    (project-id uint)
)
    (let
        (
            (project (unwrap! (map-get? projects {project-id: project-id}) ERR-PROJECT-NOT-FOUND))
        )

        ;; Only project owner can advance phases
        (asserts! (is-eq tx-sender (get owner project)) ERR-NOT-AUTHORIZED)

        ;; Update project phase
        (map-set projects
            {project-id: project-id}
            (merge project
                {current-phase: (+ (get current-phase project) u1)}
            )
        )

        (ok true)
    )
)

