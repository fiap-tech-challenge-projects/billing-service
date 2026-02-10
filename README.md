# Billing Service

Budget & Payment Management Microservice for FIAP Tech Challenge Phase 4.

## Overview

The Billing Service manages budget generation, approval workflows, and payment processing through Mercado Pago integration. It uses DynamoDB for NoSQL data storage and communicates asynchronously via EventBridge/SQS.

## Responsibilities

- Budget generation from service orders
- Budget approval/rejection workflow
- Payment processing via Mercado Pago
- Payment status tracking and webhooks
- Refund handling (for saga compensation)
- Event publishing for billing lifecycle

## Architecture

Built with **Domain-Driven Design (DDD)** principles using **DynamoDB** for NoSQL storage:

```
src/
├── domain/                # Core business logic
│   ├── budgets/           # Budget aggregate
│   ├── payments/          # Payment aggregate
│   └── shared/            # Value objects (Money, PaymentStatus)
├── application/           # Use cases
│   ├── budgets/           # Budget use cases
│   ├── payments/          # Payment use cases
│   └── events/            # Event publishers/consumers
├── infra/                 # Infrastructure
│   ├── database/          # DynamoDB repositories
│   ├── payment/           # Mercado Pago integration
│   └── messaging/         # EventBridge/SQS
├── interfaces/            # HTTP layer
│   └── rest/              # Controllers
└── shared/                # Cross-cutting concerns
```

## Technology Stack

- **Runtime**: Node.js 20 + TypeScript 5
- **Framework**: NestJS 11
- **Database**: DynamoDB (NoSQL)
- **Payment Gateway**: Mercado Pago
- **Messaging**: AWS EventBridge + SQS
- **Deployment**: Kubernetes (EKS)
- **Architecture**: Domain-Driven Design

## Domain Entities

### Budget (Aggregate Root)
Represents a cost estimate for a service order.

**Properties**: Service Order ID, Total Amount, Items, Status (PENDING, APPROVED, REJECTED)

### BudgetItem
Individual line item in a budget.

**Properties**: Description, Quantity, Unit Price, Total

### Payment
Represents a payment transaction via Mercado Pago.

**Properties**: Budget ID, Amount, Status, Mercado Pago Payment ID, QR Code Data

## API Endpoints

### Budgets

```
POST   /api/v1/budgets              - Generate budget
GET    /api/v1/budgets/:id          - Get budget details
PATCH  /api/v1/budgets/:id/approve  - Approve budget
PATCH  /api/v1/budgets/:id/reject   - Reject budget
GET    /api/v1/budgets              - List budgets
```

### Payments

```
POST   /api/v1/payments              - Create payment (generates QR code)
GET    /api/v1/payments/:id          - Get payment status
GET    /api/v1/payments/:id/qr-code  - Get payment QR code
POST   /api/v1/payments/webhook      - Mercado Pago webhook
```

### Health

```
GET    /api/v1/health                - Health check
```

## Events

### Published Events

- **BudgetGenerated**: When budget is created from order
- **BudgetApproved**: When client approves budget
- **BudgetRejected**: When client rejects budget
- **PaymentInitiated**: When payment creation starts
- **PaymentCompleted**: When payment is confirmed
- **PaymentFailed**: When payment fails

### Consumed Events

- **OrderCreated**: Triggers budget generation (from OS Service)
- **ExecutionCompleted**: Triggers final invoice generation (from Execution Service)

## DynamoDB Tables

### budgets

```
PK: budgetId (String)
SK: version (Number)
Attributes: serviceOrderId, totalAmount, status, items[], createdAt, updatedAt
GSI: ServiceOrderIndex (serviceOrderId)
```

### payments

```
PK: paymentId (String)
Attributes: budgetId, amount, status, mercadoPagoId, qrCodeData, createdAt
GSI: BudgetIndex (budgetId)
```

### budget_items

```
PK: budgetItemId (String)
Attributes: budgetId, description, quantity, unitPrice, totalPrice
GSI: BudgetIndex (budgetId)
```

## Mercado Pago Integration

### Payment Flow

1. Client approves budget
2. System creates Mercado Pago payment (QR code)
3. Client scans QR code and pays
4. Mercado Pago sends webhook notification
5. System verifies payment and publishes `PaymentCompleted` event

### Webhook Security

- Signature validation using `x-signature` header
- Idempotency key to prevent duplicate processing
- Retry mechanism for failed webhook processing

## Development

### Prerequisites

- Node.js 20+
- DynamoDB Local (or Docker Compose)
- AWS credentials configured
- Mercado Pago sandbox account

### Local Development

```bash
# Install dependencies
npm install

# Start DynamoDB and LocalStack
cd .. && docker compose up -d dynamodb-local localstack

# Create DynamoDB tables (one-time setup)
npm run dynamodb:create-tables

# Start development server
npm run start:dev
```

Server runs on `http://localhost:3001`
Swagger docs: `http://localhost:3001/api/v1/docs`

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Deployment

Same pattern as OS Service:
- Docker multi-stage build
- Kubernetes with Kustomize
- GitHub Actions CI/CD
- Terraform for infrastructure

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | HTTP server port | `3001` |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint | `http://localhost:8000` |
| `DYNAMODB_BUDGETS_TABLE` | Budgets table name | - |
| `MERCADO_PAGO_ACCESS_TOKEN` | Mercado Pago access token | - |
| `EVENT_BUS_NAME` | EventBridge bus name | - |

## Related Services

- [os-service](../os-service) - Service Order Management (publishes OrderCreated)
- [execution-service](../execution-service) - Execution Management (consumes PaymentCompleted)
- [saga-orchestrator-service](../saga-orchestrator-service) - Saga Orchestration

## License

FIAP Tech Challenge - Phase 4
