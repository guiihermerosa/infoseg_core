import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class StorageService {
  abstract upload(file: Buffer, filename: string, mimetype: string): Promise<string>;
  abstract getSignedUrl(key: string, expiresIn: number): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
