# NexaPay FinTech SuperApp

NexaPay is an all-in-one FinTech SuperApp designed to empower users with seamless control over their personal finances. From digital wallet management and instant peer-to-peer transfers to monitoring investments and loan status, NexaPay provides a secure and unified experience.

---

## 🚀 Key Features

*   **💳 Digital Wallet:** Real-time balance tracking, secure top-ups, and comprehensive transaction history.
*   **💸 Instant Transfers:** Send money effortlessly to other NexaPay users.
*   **📈 Investment Management:** Track and monitor diverse investment portfolios.
*   **🏦 Loan Services:** Streamlined loan application and status tracking.
*   **🛡️ Security First:** Robust authentication and KYC (Know Your Customer) verification flows.

---

## 🏗️ Technical Architecture

NexaPay is built on a scalable microservices architecture:

*   **Mobile App:** Ionic Framework (Vue 3 + TypeScript).
*   **Admin Dashboard:** React + Vite.
*   **Backend:** NestJS Microservices.
*   **Data & Infrastructure:**
    *   PostgreSQL (Transactional Data)
    *   MongoDB (Documents, Investments, Notifications)
    *   Redis (Caching, Sessions)
    *   Apache Kafka (Event-Driven Communication)

---

## 🛠️ Quick Start Guide

### Prerequisites
*   Node.js (v20+)
*   NPM / Yarn
*   Docker & Docker Compose (for infrastructure)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wi5nuu/Nexapay_Fintech_SuperApps.git
    cd Nexapay_Fintech_SuperApps
    ```

### Running the Mobile App (Development)
The mobile application currently supports a **Mock API** mode, allowing you to test the UI and features without running the full backend stack.

1.  Navigate to the mobile app directory:
    ```bash
    cd apps/ionic-mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the provided local URL (usually `http://localhost:8100/`) in your browser.

---

## 🧪 Development & Contribution

### Mock API System
For frontend-only development, we use an Axios Interceptor in `apps/ionic-mobile/src/services/api.ts` to simulate backend responses. This ensures features like Login, Wallet, and Transfers are fully testable.

### Navigation
The app utilizes Ionic Tabs with nested routing. To add a new feature page:
1.  Add the component in `apps/ionic-mobile/src/pages/`.
2.  Register the route in `apps/ionic-mobile/src/router/index.ts`.
3.  Add the tab in `apps/ionic-mobile/src/pages/TabsLayout.vue`.

---

## 📄 License
This project is proprietary. All rights reserved.

---
*Maintained by the NexaPay Engineering Team.*
