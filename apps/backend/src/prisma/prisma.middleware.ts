import { encrypt, decrypt, isEncrypted } from './encryption.util';

// Fields to encrypt per model
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Camera: ['username', 'password'],
  // For now only Camera credentials. Can expand later to Resident/Visitor if needed.
};

export function applyEncryptionMiddleware(prisma: any): void {
  prisma.$use(async (params: any, next: any) => {
    const modelFields = ENCRYPTED_FIELDS[params.model || ''];

    // Encrypt on write operations
    if (modelFields && params.args?.data) {
      const data = params.args.data;
      for (const field of modelFields) {
        if (
          data[field] &&
          typeof data[field] === 'string' &&
          !isEncrypted(data[field])
        ) {
          data[field] = encrypt(data[field]);
        }
      }
    }

    const result = await next(params);

    // Decrypt on read operations
    if (modelFields && result) {
      const decryptResult = (record: any) => {
        if (!record) return record;
        for (const field of modelFields) {
          if (
            record[field] &&
            typeof record[field] === 'string' &&
            isEncrypted(record[field])
          ) {
            record[field] = decrypt(record[field]);
          }
        }
        return record;
      };

      if (Array.isArray(result)) {
        return result.map(decryptResult);
      }
      return decryptResult(result);
    }

    return result;
  });
}
