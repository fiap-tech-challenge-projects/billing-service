# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: Do NOT add `Co-Authored-By` to commits in this project.

## Project Overview

Billing Service - Budget & Payment Management microservice for FIAP Tech Challenge Phase 4. Manages budget generation, approval workflows, and Mercado Pago payment processing using DynamoDB and EventBridge/SQS.

## Common Commands

```bash
# Development
npm run start:dev          # Hot reload
npm run start:debug        # With debugger

# Testing
npm test                   # All tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage

# Code Quality
npm run lint               # ESLint
npm run format             # Prettier

# Build & Deploy
npm run build              # Production build
docker build -t billing-service:local .
kubectl apply -k k8s/overlays/development
```

## Architecture (DDD with DynamoDB)

```
src/
├── domain/                # Core business logic
│   ├── budgets/           # Budget aggregate
│   ├── payments/          # Payment aggregate
│   └── shared/            # Value objects (Money, PaymentStatus)
├── application/           # Use cases
│   ├── budgets/           # Budget operations
│   ├── payments/          # Payment operations
│   └── events/            # Event handlers
├── infra/                 # Infrastructure
│   ├── database/          # DynamoDB repositories
│   ├── payment/           # Mercado Pago client
│   └── messaging/         # EventBridge/SQS
├── interfaces/            # HTTP layer
│   └── rest/              # Controllers
└── shared/                # Cross-cutting concerns
```

## Path Aliases

```typescript
import { Budget } from '@domain/budgets'
import { GenerateBudgetUseCase } from '@application/budgets'
import { DynamoDBBudgetRepository } from '@infra/database'
import { BudgetController } from '@interfaces/rest'
import { Money } from '@shared/value-objects'
```

## Key Patterns

1. **DynamoDB Single-Table Design**: Each aggregate has its own table
2. **Event Sourcing**: Version field for optimistic locking
3. **Money Value Object**: Handles currency operations safely
4. **Webhook Idempotency**: Prevents duplicate payment processing

## Event Integration

**Publishes**:
- `BudgetGenerated` - Budget created from order
- `BudgetApproved` - Client approved budget
- `PaymentCompleted` - Payment confirmed

**Consumes**:
- `OrderCreated` - From OS Service (triggers budget generation)
- `ExecutionCompleted` - From Execution Service (for invoicing)

## DynamoDB

Tables managed by Terraform in `database-managed-infra`:
- `fiap-budgets-{env}`
- `fiap-payments-{env}`
- `fiap-budget-items-{env}`

Connection via AWS SDK with endpoint override for local development.

## Mercado Pago

Sandbox credentials required (get from https://www.mercadopago.com.br/developers/):
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_PUBLIC_KEY`

Webhook endpoint: `POST /api/v1/payments/webhook` (public, no auth)

## Dependencies

- **messaging-infra**: EventBridge bus, SQS queues
- **database-managed-infra**: DynamoDB tables
- **kubernetes-core-infra**: EKS cluster, namespace `ftc-app`
