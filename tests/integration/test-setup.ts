import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Client as MinioClient } from 'minio';
import { Redis } from 'ioredis';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const TEST_TIMEOUT = 120000;

interface TestInfrastructure {
  postgres: StartedTestContainer[];
  redis: StartedTestContainer[];
  kafka: StartedTestContainer[];
  minio: StartedTestContainer[];
  elasticsearch: StartedTestContainer[];
  mongo: StartedTestContainer[];
  mysql: StartedTestContainer[];
}

interface ServiceConnections {
  postgres: Map<string, Pool>;
  redis: Redis;
  kafka: { producer: Producer; consumer: Consumer };
  minio: MinioClient;
  elasticsearch: ElasticClient;
}

let infrastructure: TestInfrastructure | null = null;
let connections: ServiceConnections | null = null;
const containers: StartedTestContainer[] = [];

const DATABASES = ['auth', 'users', 'wallets', 'loans'] as const;
const POSTGRES_PORT = 5432;
const REDIS_PORT = 6379;
const MONGO_PORT = 27017;
const MYSQL_PORT = 3306;
const KAFKA_PORT = 9092;
const MINIO_PORT = 9000;
const ES_PORT = 9200;

function getServicePort(name: string): number {
  const ports: Record<string, number> = {
    'postgres-auth': 15432,
    'postgres-users': 15433,
    'postgres-wallets': 15434,
    'postgres-loans': 15435,
    'redis-main': 16379,
    'redis-wallet': 16380,
    'redis-loan': 16381,
    'redis-fraud': 16382,
    mongo: 17017,
    mysql: 13306,
    kafka: 19092,
    minio: 19000,
    elasticsearch: 19200,
  };
  return ports[name] || 0;
}

async function startPostgres(database: string): Promise<StartedTestContainer> {
  const port = getServicePort(`postgres-${database}`);
  const container = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_USER: 'nexapay',
      POSTGRES_PASSWORD: 'nexapay_pass',
      POSTGRES_DB: `nexapay_${database}`,
    })
    .withExposedPorts({ container: POSTGRES_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function startRedis(database: string = 'main'): Promise<StartedTestContainer> {
  const portName = `redis-${database}`;
  const port = getServicePort(portName) || getServicePort('redis-main');
  const container = await new GenericContainer('redis:7-alpine')
    .withExposedPorts({ container: REDIS_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function startKafka(): Promise<StartedTestContainer> {
  const zookeeper = await new GenericContainer('confluentinc/cp-zookeeper:7.5.0')
    .withEnvironment({
      ZOOKEEPER_CLIENT_PORT: '2181',
      ZOOKEEPER_TICK_TIME: '2000',
    })
    .withExposedPorts(2181)
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(zookeeper);

  const kafka = await new GenericContainer('confluentinc/cp-kafka:7.5.0')
    .withEnvironment({
      KAFKA_BROKER_ID: '1',
      KAFKA_ZOOKEEPER_CONNECT: `localhost:${zookeeper.getMappedPort(2181)}`,
      KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://localhost:${getServicePort('kafka')}`,
      KAFKA_LISTENERS: `PLAINTEXT://0.0.0.0:${KAFKA_PORT}`,
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
    })
    .withExposedPorts({ container: KAFKA_PORT, host: getServicePort('kafka') })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(kafka);
  return kafka;
}

async function startMinio(): Promise<StartedTestContainer> {
  const port = getServicePort('minio');
  const container = await new GenericContainer('minio/minio:latest')
    .withCommand(['server', '/data'])
    .withEnvironment({
      MINIO_ROOT_USER: 'nexapay',
      MINIO_ROOT_PASSWORD: 'nexapay_pass',
    })
    .withExposedPorts({ container: MINIO_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function startElasticsearch(): Promise<StartedTestContainer> {
  const port = getServicePort('elasticsearch');
  const container = await new GenericContainer('elasticsearch:8.11.0')
    .withEnvironment({
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
      'ES_JAVA_OPTS': '-Xms512m -Xmx512m',
    })
    .withExposedPorts({ container: ES_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function startMongo(): Promise<StartedTestContainer> {
  const port = getServicePort('mongo');
  const container = await new GenericContainer('mongo:7')
    .withExposedPorts({ container: MONGO_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function startMysql(): Promise<StartedTestContainer> {
  const port = getServicePort('mysql');
  const container = await new GenericContainer('mysql:8')
    .withEnvironment({
      MYSQL_ROOT_PASSWORD: 'nexapay_pass',
      MYSQL_DATABASE: 'nexapay_reporting',
      MYSQL_USER: 'nexapay',
      MYSQL_PASSWORD: 'nexapay_pass',
    })
    .withExposedPorts({ container: MYSQL_PORT, host: port })
    .withStartupTimeout(TEST_TIMEOUT)
    .start();

  containers.push(container);
  return container;
}

async function initializeConnections(infra: TestInfrastructure): Promise<ServiceConnections> {
  const postgresConnections = new Map<string, Pool>();

  for (let i = 0; i < DATABASES.length; i++) {
    const dbName = DATABASES[i];
    const container = infra.postgres[i];
    const pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(POSTGRES_PORT),
      user: 'nexapay',
      password: 'nexapay_pass',
      database: `nexapay_${dbName}`,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    postgresConnections.set(dbName, pool);
  }

  const redisContainer = infra.redis[0];
  const redis = new Redis({
    host: redisContainer.getHost(),
    port: redisContainer.getMappedPort(REDIS_PORT),
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  const kafkaContainer = infra.kafka[0];
  const kafka = new Kafka({
    clientId: 'nexapay-test',
    brokers: [`${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(KAFKA_PORT)}`],
    retry: { retries: 5 },
  });
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: 'nexapay-test-group' });
  await producer.connect();
  await consumer.connect();

  const minioContainer = infra.minio[0];
  const minio = new MinioClient({
    endPoint: minioContainer.getHost(),
    port: minioContainer.getMappedPort(MINIO_PORT),
    useSSL: false,
    accessKey: 'nexapay',
    secretKey: 'nexapay_pass',
  });

  const esContainer = infra.elasticsearch[0];
  const elasticsearch = new ElasticClient({
    node: `http://${esContainer.getHost()}:${esContainer.getMappedPort(ES_PORT)}`,
  });

  return { postgres: postgresConnections, redis, kafka: { producer, consumer }, minio, elasticsearch };
}

async function setupInfrastructure(): Promise<{ infra: TestInfrastructure; conn: ServiceConnections }> {
  const results = await Promise.allSettled([
    Promise.all(DATABASES.map((db) => startPostgres(db))),
    Promise.all([startRedis('main'), startRedis('wallet'), startRedis('loan'), startRedis('fraud')]),
    startKafka(),
    startMinio(),
    startElasticsearch(),
    startMongo(),
    startMysql(),
  ]);

  const [
    postgresResult,
    redisResult,
    kafkaResult,
    minioResult,
    esResult,
    mongoResult,
    mysqlResult,
  ] = results;

  if (postgresResult.status === 'rejected') throw postgresResult.reason;
  if (kafkaResult.status === 'rejected') throw kafkaResult.reason;
  if (minioResult.status === 'rejected') throw minioResult.reason;
  if (esResult.status === 'rejected') throw esResult.reason;

  const infra: TestInfrastructure = {
    postgres: postgresResult.value,
    redis: redisResult.status === 'fulfilled' ? redisResult.value : [],
    kafka: [kafkaResult.value],
    minio: [minioResult.value],
    elasticsearch: [esResult.value],
    mongo: mongoResult.status === 'fulfilled' ? [mongoResult.value] : [],
    mysql: mysqlResult.status === 'fulfilled' ? [mysqlResult.value] : [],
  };

  const conn = await initializeConnections(infra);
  return { infra, conn };
}

async function destroyInfrastructure(): Promise<void> {
  if (connections) {
    for (const pool of connections.postgres.values()) {
      await pool.end();
    }
    connections.redis.disconnect();
    await connections.kafka.producer.disconnect();
    await connections.kafka.consumer.disconnect();
  }

  for (const container of containers.reverse()) {
    try {
      await container.stop({ timeout: 10000 });
    } catch (err) {
      console.warn(`Failed to stop container: ${err}`);
    }
  }
}

function writeEnvFile(infra: TestInfrastructure): void {
  const envPath = path.resolve(__dirname, '../../.env.test');
  const envContent = [
    '# Test Environment - Auto-generated',
    `NODE_ENV=test`,
    '',
    '# Postgres',
    ...DATABASES.map((db, i) => {
      const c = infra.postgres[i];
      return [
        `${db.toUpperCase()}_DATABASE_URL=postgresql://nexapay:nexapay_pass@${c.getHost()}:${c.getMappedPort(POSTGRES_PORT)}/nexapay_${db}`,
      ].join('\n');
    }),
    '',
    '# Redis',
    ...infra.redis.map((c, i) => {
      const names = ['AUTH', 'WALLET', 'LOAN', 'FRAUD'];
      return `${names[i]}_REDIS_URL=redis://${c.getHost()}:${c.getMappedPort(REDIS_PORT)}/${i}`;
    }),
    '',
    `# Kafka`,
    `KAFKA_BROKERS=${infra.kafka[0].getHost()}:${infra.kafka[0].getMappedPort(KAFKA_PORT)}`,
    '',
    `# Minio`,
    `MINIO_ENDPOINT=${infra.minio[0].getHost()}:${infra.minio[0].getMappedPort(MINIO_PORT)}`,
    '',
    `# Elasticsearch`,
    `ELASTICSEARCH_URL=http://${infra.elasticsearch[0].getHost()}:${infra.elasticsearch[0].getMappedPort(ES_PORT)}`,
    '',
    `# Mongo`,
    `MONGO_URI=mongodb://${infra.mongo[0]?.getHost() || 'localhost'}:${infra.mongo[0]?.getMappedPort(MONGO_PORT) || 27017}/nexapay_test`,
    '',
    `# MySQL`,
    `MYSQL_URL=mysql://nexapay:nexapay_pass@${infra.mysql[0]?.getHost() || 'localhost'}:${infra.mysql[0]?.getMappedPort(MYSQL_PORT) || 3306}/nexapay_reporting`,
    '',
    '# Test settings',
    'JWT_ACCESS_SECRET=test-access-secret-at-least-32-characters-long',
    'JWT_REFRESH_SECRET=test-refresh-secret-at-least-32-characters-long',
    'JWT_ACCESS_EXPIRY=15m',
    'JWT_REFRESH_EXPIRY=7d',
    'ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'IDEMPOTENCY_TTL=86400',
    'THROTTLE_TTL=60',
    'THROTTLE_LIMIT=1000',
    'LOG_LEVEL=silent',
  ].join('\n');

  fs.writeFileSync(envPath, envContent);
  process.env.TEST_ENV_FILE = envPath;
}

export async function setup(): Promise<void> {
  console.log('Starting test infrastructure...');
  try {
    const { infra, conn } = await setupInfrastructure();
    infrastructure = infra;
    connections = conn;
    writeEnvFile(infra);
    console.log('Test infrastructure ready.');
  } catch (err) {
    console.error('Failed to setup test infrastructure:', err);
    await destroyInfrastructure();
    throw err;
  }
}

export async function teardown(): Promise<void> {
  console.log('Tearing down test infrastructure...');
  await destroyInfrastructure();
  infrastructure = null;
  connections = null;
  console.log('Test infrastructure destroyed.');
}

export function getConnections(): ServiceConnections {
  if (!connections) throw new Error('Test infrastructure not initialized');
  return connections;
}

export function getInfrastructure(): TestInfrastructure {
  if (!infrastructure) throw new Error('Test infrastructure not initialized');
  return infrastructure;
}

export { TestInfrastructure, ServiceConnections };
