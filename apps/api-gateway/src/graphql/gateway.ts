import { ApolloServer } from "@apollo/server";
import { ApolloGateway, IntrospectAndCompose, ServiceDefinition } from "@apollo/gateway";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginInlineTraceDisabled } from "@apollo/server/plugin/disabled";
import express, { Request, Response } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { readFileSync } from "fs";
import { resolve } from "path";
import winston from "winston";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

interface SubgraphConfig {
  name: string;
  url: string;
}

const SUBGRAPH_SERVICE_URLS: Record<string, string> = {
  auth: process.env.AUTH_SUBGRAPH_URL ?? "http://auth:4001/graphql",
  "user-kyc": process.env.USER_KYC_SUBGRAPH_URL ?? "http://user-kyc:4002/graphql",
  wallet: process.env.WALLET_SUBGRAPH_URL ?? "http://wallet:4003/graphql",
  loan: process.env.LOAN_SUBGRAPH_URL ?? "http://loan:4004/graphql",
  investment: process.env.INVESTMENT_SUBGRAPH_URL ?? "http://investment:4005/graphql",
  notification: process.env.NOTIFICATION_SUBGRAPH_URL ?? "http://notification:4006/graphql",
  reporting: process.env.REPORTING_SUBGRAPH_URL ?? "http://reporting:4007/graphql",
  fraud: process.env.FRAUD_SUBGRAPH_URL ?? "http://fraud-detection:4008/graphql",
};

const SERVICE_LIST: SubgraphConfig[] = Object.entries(SUBGRAPH_SERVICE_URLS).map(
  ([name, url]) => ({ name, url })
);

const USE_MANAGED_SUPERGRAPH = process.env.APOLLO_GRAPH_REF
  ? process.env.APOLLO_GRAPH_REF
  : null;

const getSupergraphSdl = (): string => {
  try {
    const sdlPath = resolve(__dirname, "./supergraph.graphql");
    return readFileSync(sdlPath, "utf-8");
  } catch {
    logger.warn("Supergraph SDL file not found, will use introspection");
    return "";
  }
};

const buildGateway = (): ApolloGateway => {
  const supergraphSdl = getSupergraphSdl();

  if (USE_MANAGED_SUPERGRAPH) {
    logger.info(`Using managed federation with graph ref: ${USE_MANAGED_SUPERGRAPH}`);
    return new ApolloGateway();
  }

  if (supergraphSdl) {
    logger.info("Using local supergraph SDL for static composition");
    return new ApolloGateway({
      supergraphSdl,
      buildService: ({ name, url }: ServiceDefinition) => {
        return {
          name,
          url: url ?? SUBGRAPH_SERVICE_URLS[name],
        };
      },
    });
  }

  logger.info("Using IntrospectAndCompose for dynamic subgraph discovery");
  return new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: SERVICE_LIST.map((svc) => ({
        name: svc.name,
        url: svc.url,
      })),
      pollIntervalInMs: parseInt(process.env.SUBGRAPH_POLL_INTERVAL ?? "10000", 10),
    }),
    buildService: ({ name, url }: ServiceDefinition) => {
      return {
        name,
        url: url ?? SUBGRAPH_SERVICE_URLS[name],
      };
    },
  });
};

const startGateway = async (): Promise<void> => {
  const app = express();
  const PORT = parseInt(process.env.GRAPHQL_PORT ?? "4001", 10);

  const gateway = buildGateway();

  const server = new ApolloServer({
    gateway,
    plugins: [ApolloServerPluginInlineTraceDisabled()],
    introspection: process.env.NODE_ENV !== "production",
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
    status400ForUnrecognizedArguments: true,
  });

  await server.start();
  logger.info("Apollo Gateway started successfully");

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: (process.env.CORS_ORIGINS ?? "http://localhost:4200,http://localhost:8100,http://localhost:5173").split(","),
      credentials: true,
    }),
    express.json(),
    rateLimit({
      windowMs: 60_000,
      max: parseInt(process.env.GRAPHQL_RATE_LIMIT ?? "100", 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "TOO_MANY_REQUESTS", message: "GraphQL rate limit exceeded" },
    }),
    (req: Request, res: Response, next: () => void) => {
      const isIntrospection =
        req.body?.query?.trim().startsWith("query IntrospectionQuery") ||
        req.body?.query?.trim().startsWith("query __schema");

      if (isIntrospection || req.body?.operationName === "IntrospectionQuery") {
        return next();
      }

      authMiddleware(req as AuthenticatedRequest, res, next as () => void);
    },
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authReq = req as AuthenticatedRequest;
        return {
          user: authReq.user ?? null,
          requestId: req.headers["x-request-id"] as string | undefined,
        };
      },
    })
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "graphql-gateway", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    logger.info({ message: `Apollo Gateway listening on port ${PORT}/graphql` });
    SERVICE_LIST.forEach((svc) => {
      logger.info({ message: `Subgraph: ${svc.name} -> ${svc.url}` });
    });
  });
};

startGateway().catch((err: Error) => {
  logger.error({ message: "Failed to start Apollo Gateway", error: err.message, stack: err.stack });
  process.exit(1);
});

export { startGateway };
