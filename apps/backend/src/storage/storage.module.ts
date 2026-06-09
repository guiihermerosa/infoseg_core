import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass:
        process.env.STORAGE_TYPE === 'azure'
          ? AzureBlobStorageService
          : LocalStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
