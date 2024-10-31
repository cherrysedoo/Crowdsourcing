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
