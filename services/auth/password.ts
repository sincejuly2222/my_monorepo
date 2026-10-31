import argon2 from "argon2";

export const passwordHashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

const dummyPasswordHash =
  "$argon2id$v=19$m=19456,p=1,t=2$gts1aZmGLa+gLayAHS/9xw$kCftR3fcyN5a5Iqhq8Y8fYgy69Di3Q9koVD9m/fnQ5g";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, passwordHashOptions);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export function verifyDummyPassword(password: string): Promise<boolean> {
  return verifyPassword(dummyPasswordHash, password);
}
