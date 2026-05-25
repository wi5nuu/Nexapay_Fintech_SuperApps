import { Request, Response, NextFunction } from "express";
import { verify, VerifyErrors, JwtPayload as JwtPayloadType } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadType & {
    sub: string;
    role: string;
    email: string;
  };
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

const BEARER_PREFIX = "Bearer ";

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing authorization header",
    });
    return;
  }

  if (!authHeader.startsWith(BEARER_PREFIX)) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid authorization format. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Empty token provided",
    });
    return;
  }

  verify(
    token,
    getSecret(),
    {
      algorithms: ["RS256", "HS256"],
      issuer: "nexapay-auth",
    },
    (err: VerifyErrors | null, decoded: JwtPayloadType | string | undefined) => {
      if (err) {
        const statusCode = err.name === "TokenExpiredError" ? 401 : 403;
        res.status(statusCode).json({
          error: statusCode === 401 ? "TOKEN_EXPIRED" : "FORBIDDEN",
          message: err.message,
        });
        return;
      }

      if (!decoded || typeof decoded === "string") {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Invalid token payload",
        });
        return;
      }

      req.user = decoded as AuthenticatedRequest["user"];
      next();
    }
  );
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Requires one of roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};
