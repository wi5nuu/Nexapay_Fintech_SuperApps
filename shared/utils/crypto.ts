import { randomBytes, createCipheriv, createDecipheriv, scryptSync, CipherGCMTypes } from "crypto";

const ALGORITHM: CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const TAG_POSITION = 0;
const IV_POSITION = 1;
const CIPHERTEXT_POSITION = 2;

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  const salt = process.env.ENCRYPTION_SALT ?? "nexapay-default-salt";
  return scryptSync(secret, salt, KEY_LENGTH);
};

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface DecryptedData {
  plaintext: string;
}

export const encrypt = (plaintext: string): EncryptedData => {
  if (!plaintext) {
    throw new Error("Plaintext must be a non-empty string");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const chunks: Buffer[] = [];
  chunks.push(cipher.update(plaintext, "utf8"));
  chunks.push(cipher.final());

  const ciphertext = Buffer.concat(chunks);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

export const decrypt = (data: EncryptedData): DecryptedData => {
  if (!data.ciphertext || !data.iv || !data.authTag) {
    throw new Error("EncryptedData must contain ciphertext, iv, and authTag");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");
  const ciphertext = Buffer.from(data.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const chunks: Buffer[] = [];
  chunks.push(decipher.update(ciphertext));
  chunks.push(decipher.final());

  const plaintext = Buffer.concat(chunks).toString("utf8");

  return { plaintext };
};

export const encryptString = (plaintext: string): string => {
  const encrypted = encrypt(plaintext);
  const payload = JSON.stringify([
    encrypted.authTag,
    encrypted.iv,
    encrypted.ciphertext,
  ]);
  return Buffer.from(payload, "utf8").toString("base64");
};

export const decryptString = (encoded: string): string => {
  const payload = Buffer.from(encoded, "base64").toString("utf8");
  const parts: [string, string, string] = JSON.parse(payload);

  return decrypt({
    authTag: parts[TAG_POSITION],
    iv: parts[IV_POSITION],
    ciphertext: parts[CIPHERTEXT_POSITION],
  }).plaintext;
};

export const generateEncryptionKey = (): string => {
  return randomBytes(KEY_LENGTH).toString("hex");
};

export const generateIv = (): string => {
  return randomBytes(IV_LENGTH).toString("hex");
};
