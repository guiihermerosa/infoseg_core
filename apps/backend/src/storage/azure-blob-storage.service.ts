import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';

@Injectable()
export class AzureBlobStorageService extends StorageService {
  async upload(file: Buffer, filename: string, mimetype: string): Promise<string> {
    throw new Error('Azure Blob Storage not configured');
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    throw new Error('Azure Blob Storage not configured');
  }

  async delete(key: string): Promise<void> {
    throw new Error('Azure Blob Storage not configured');
  }
}
