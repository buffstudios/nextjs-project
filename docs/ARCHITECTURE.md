# Architecture

## Current Phase

Internal tool for Buff Nail Studios.
Multi-brand architecture is in place but only one brand exists.
Do not build onboarding flows, billing, or self-serve features yet.
Those come after Buff is live and battle-tested.

## Architecture Principles (Read First)

Two decisions made in Version 2 that change everything:

**MULTI-BRAND:** Every table that holds business data has a brand_id. The platform can serve Buff Nail Studios today and a completely different salon brand tomorrow with zero code changes. Colours, KPI thresholds, studio structure, tax rates, and feature flags all live in the database per brand.

**PAYMENT ABSTRACTION:** No payment provider is hardcoded. All payment processing goes through a single PaymentGateway interface. Adyen is the first implementation. Square, Stripe, Tyro, or any other provider can be added as a second implementation without touching the POS or invoicing code.
