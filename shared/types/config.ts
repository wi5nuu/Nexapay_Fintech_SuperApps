/**
 * Interface representing the application configuration.
 * This structure should be followed by all microservices to ensure consistency.
 */
export interface IAppConfig {
  env: 'development' | 'production' | 'test' | 'staging';
  version: string;
  host: string;
  port: number;
  
  database: {
    url: string;
    logging?: boolean;
  };
  
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  
  broker: {
    provider: 'kafka' | 'redis' | 'none';
    url: string;
    clientId: string;
  };
  
  cache: {
    provider: 'redis' | 'memory';
    url?: string;
    ttl: number;
  };

  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
  };
}

/**
 * Type helper for nested configuration retrieval
 */
export type ConfigValue = string | number | boolean | undefined | object;
