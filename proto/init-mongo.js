// ============================================================
// NexaPay MongoDB Database Initialization
// Creates databases, collections, indexes for document stores
// ============================================================

// Switch to admin database for user creation
db = db.getSiblingDB('admin');

db.createUser({
  user: 'nexapay',
  pwd: 'nexapay_pass',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});

// ==========================================
// KYC Documents Database
// ==========================================
db = db.getSiblingDB('nexapay_kyc');

db.createCollection('kyc_documents');
db.createCollection('kyc_verifications');
db.createCollection('idempotency_records');

db.kyc_documents.createIndex({ userId: 1, status: 1 });
db.kyc_documents.createIndex({ documentType: 1, createdAt: -1 });
db.kyc_documents.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.kyc_documents.createIndex({ 'metadata.hash': 1 }, { unique: true, sparse: true });

db.kyc_verifications.createIndex({ userId: 1, status: 1 });
db.kyc_verifications.createIndex({ verifiedAt: -1 });
db.kyc_verifications.createIndex({ level: 1, status: 1 });

db.idempotency_records.createIndex(
  { key: 1 },
  { unique: true }
);
db.idempotency_records.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }
);

// ==========================================
// Investment Database
// ==========================================
db = db.getSiblingDB('nexapay_investments');

db.createCollection('portfolios');
db.createCollection('investment_products');
db.createCollection('transactions');
db.createCollection('price_history');
db.createCollection('orders');

db.portfolios.createIndex({ userId: 1 }, { unique: true });
db.portfolios.createIndex({ riskScore: 1 });
db.portfolios.createIndex({ totalValue: -1 });

db.investment_products.createIndex({ type: 1, status: 1 });
db.investment_products.createIndex({ riskLevel: 1, minInvestment: 1 });
db.investment_products.createIndex({ isin: 1 }, { unique: true, sparse: true });
db.investment_products.createIndex({ symbol: 1 }, { unique: true, sparse: true });

db.transactions.createIndex({ userId: 1, createdAt: -1 });
db.transactions.createIndex({ productId: 1, type: 1 });
db.transactions.createIndex({ status: 1, createdAt: 1 });
db.transactions.createIndex({ reference: 1 }, { unique: true });

db.price_history.createIndex({ productId: 1, timestamp: -1 });
db.price_history.createIndex({ productId: 1, date: -1 });
db.price_history.createIndex(
  { productId: 1, timestamp: -1 },
  { expireAfterSeconds: 7776000 }
);

db.orders.createIndex({ userId: 1, status: 1 });
db.orders.createIndex({ productId: 1, type: 1, status: 1 });
db.orders.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ==========================================
// Notification Database
// ==========================================
db = db.getSiblingDB('nexapay_notifications');

db.createCollection('notifications');
db.createCollection('templates');
db.createCollection('push_devices');
db.createCollection('email_logs');
db.createCollection('sms_logs');

db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, read: 1 });
db.notifications.createIndex({ type: 1, status: 1, createdAt: -1 });
db.notifications.createIndex({ channel: 1, status: 1 });
db.notifications.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 }
);

db.templates.createIndex({ name: 1, channel: 1 }, { unique: true });
db.templates.createIndex({ eventType: 1 });

db.push_devices.createIndex({ userId: 1 });
db.push_devices.createIndex({ deviceToken: 1 }, { unique: true });
db.push_devices.createIndex({ platform: 1 });

db.email_logs.createIndex({ notificationId: 1 });
db.email_logs.createIndex({ recipient: 1, sentAt: -1 });
db.email_logs.createIndex({ status: 1 });

db.sms_logs.createIndex({ notificationId: 1 });
db.sms_logs.createIndex({ phone: 1, sentAt: -1 });
db.sms_logs.createIndex({ status: 1 });

// ==========================================
// Audit Log Database
// ==========================================
db = db.getSiblingDB('nexapay_audit');

db.createCollection('audit_logs');
db.createCollection('auth_events');

db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
db.audit_logs.createIndex({ action: 1, resource: 1, timestamp: -1 });
db.audit_logs.createIndex({ ipAddress: 1, timestamp: -1 });
db.audit_logs.createIndex({ correlationId: 1 });
db.audit_logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 }
);

db.auth_events.createIndex({ userId: 1, event: 1, timestamp: -1 });
db.auth_events.createIndex({ ipAddress: 1, event: 1 });
db.auth_events.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 }
);

// ==========================================
// Rate Limits & Sessions Database
// ==========================================
db = db.getSiblingDB('nexapay_cache');

db.createCollection('rate_limits');
db.createCollection('sessions');
db.createCollection('locks');

db.rate_limits.createIndex(
  { key: 1 },
  { unique: true }
);
db.rate_limits.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

db.sessions.createIndex(
  { sessionId: 1 },
  { unique: true }
);
db.sessions.createIndex(
  { userId: 1 }
);
db.sessions.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

db.locks.createIndex(
  { key: 1 },
  { unique: true }
);
db.locks.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

print('All MongoDB databases and collections initialized successfully.');
