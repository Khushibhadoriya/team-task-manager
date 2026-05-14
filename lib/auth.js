import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d"; // token lasts 7 days

// ─── Create a token ───────────────────────────────────────────────────────
export function signToken(userId) {
  return jwt.sign(
    { userId },          // payload — data we encode inside the token
    JWT_SECRET,          // secret key — used to sign + verify
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ─── Verify a token ───────────────────────────────────────────────────────
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET); // returns the decoded payload
  } catch (error) {
    return null; // token is invalid or expired
  }
}