# Architecture: NexaPay FinTech SuperApp

NexaPay follows an event-driven microservices architecture optimized for scalability, resilience, and maintainability.

## High-Level Overview
- **Mobile/Admin:** Clients interact with the **API Gateway** (Kong) to route requests to appropriate services.
- **Microservices:** Independent services (Auth, Wallet, Loan, Investment) handle specific business domains.
- **Communication:**
    - **Synchronous:** gRPC for internal service-to-service communication.
    - **Asynchronous:** Kafka for broadcasting domain events (TransactionCreated, UserRegistered, etc.).
- **Persistence:** Polyglot persistence (PostgreSQL for transactional data, MongoDB for flexible event logs/schemas).
- **Caching:** Redis used for session management, balance caching, and rate limiting.

## Flow Example: Wallet Transfer
1.  Mobile App sends a `Transfer` request to the API Gateway.
2.  Gateway routes the request to the **Wallet Service**.
3.  Wallet Service validates idempotency, checks balances (using Redis cache), and executes the transfer within an ACID transaction (Prisma).
4.  Wallet Service broadcasts `TransactionDebited` and `TransactionCredited` events via Kafka.
5.  Notification and Reporting services consume these events asynchronously to send push notifications and update reports.
