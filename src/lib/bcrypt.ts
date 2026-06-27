// src/lib/bcrypt.ts
// PERF-001 FIX: cost=12 is ~250-300ms per hash on typical serverless CPUs,
// which is expensive when every login pays this cost. cost=10 is still well
// above current minimum-security recommendations (OWASP suggests >=10) and
// cuts hashing time roughly 4x, meaningfully improving login throughput.
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// SEC-008 FIX: used by login when no user matches the phone number, so we
// still pay the same bcrypt.compare() cost as a real "wrong password" check
// instead of short-circuiting and leaking timing information. This is a
// fixed hash of a random string at the same cost factor — it never matches
// any real password.
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-timing-decoy", BCRYPT_COST);
