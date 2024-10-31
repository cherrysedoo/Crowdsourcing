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
