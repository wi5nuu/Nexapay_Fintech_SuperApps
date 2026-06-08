# NexaPay FinTech SuperApp API Documentation Summary

This document provides a high-level overview of the NexaPay API ecosystem. For detailed endpoint definitions, please refer to the Swagger documentation available at the `/api/docs` endpoint of each microservice.

## Core Microservices

| Service | Description | Docs Path |
| :--- | :--- | :--- |
| **Auth** | User Authentication & Authorization | `/api/docs` |
| **Wallet** | Wallet Management & Transfers | `/api/docs` |
| **Investment** | Investment Product Management | `/api/docs` |
| **Loan** | Loan Application & Management | `/api/docs` |

## Authentication
All services are protected using JWT-based bearer authentication. Refresh tokens are supported to extend session validity.

## API Governance
- **Versioning:** All APIs follow `v1` versioning prefix.
- **Standards:** Consistent JSON structure for all responses (`success`, `data`, `meta`, `errors`).
- **Security:** Standardized rate limiting and CORS policies apply to all services.
