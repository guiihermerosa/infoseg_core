import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    super();
    this.ensureUploadsDirExists();
  }

  private ensureUploadsDirExists(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async upload(file: Buffer, filename: string, mimetype: string): Promise<string> {
    const filePath = path.join(this.uploadsDir, filename);
    // Ensure subdirectory exists (e.g., uploads/visitors/)
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, file);
    return `/uploads/${filename}`;
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // For local development, return the path directly (no signing needed)
    return key;
  }

  async delete(key: string): Promise<void> {
    const filename = key.replace(/^\/uploads\//, '');
    const filePath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
