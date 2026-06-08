import { Logger } from '@nestjs/common';

/**
 * AuditLog Decorator Options
 */
export interface AuditOptions {
  action?: string;
  context?: string;
  shouldLogArgs?: boolean;
  shouldLogResult?: boolean;
}

/**
 * A method-level decorator that automatically logs method execution for auditing.
 * It tracks method entry, exit, execution time, and optionally arguments/results.
 */
export function Audit(options: AuditOptions = {}) {
  const { 
    action, 
    context = 'AuditLogger', 
    shouldLogArgs = true, 
    shouldLogResult = false 
  } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(context);

    descriptor.value = async function (...args: any[]) {
      const methodName = action || `${target.constructor.name}.${propertyKey}`;
      const startTime = Date.now();

      try {
        if (shouldLogArgs) {
          logger.log(`[START] ${methodName} | Args: ${JSON.stringify(args)}`);
        } else {
          logger.log(`[START] ${methodName}`);
        }

        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (shouldLogResult) {
          logger.log(`[SUCCESS] ${methodName} | Duration: ${duration}ms | Result: ${JSON.stringify(result)}`);
        } else {
          logger.log(`[SUCCESS] ${methodName} | Duration: ${duration}ms`);
        }

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`[FAILURE] ${methodName} | Duration: ${duration}ms | Error: ${error.message}`);
        throw error;
      }
    };

    return descriptor;
  };
}
