import jwt from "jsonwebtoken";

const issuer = process.env.JWT_ISSUER ?? "ride-platform";
const audience = process.env.JWT_AUDIENCE ?? "ride-clients";
const secret = process.env.JWT_SECRET ?? "dev-secret";

export const roles = Object.freeze({ RIDER: "RIDER", DRIVER: "DRIVER", ADMIN: "ADMIN" });

export function signAccessToken(subject, role, claims = {}) {
  return jwt.sign({ ...claims, role }, secret, {
    subject,
    issuer,
    audience,
    expiresIn: "15m"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secret, { issuer, audience });
}

export function authenticate(req, res, next) {
  try {
    const [, token] = (req.headers.authorization ?? "").split(" ");
    if (!token) return res.status(401).json({ error: "missing_bearer_token" });
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "insufficient_role" });
    }
    return next();
  };
}

