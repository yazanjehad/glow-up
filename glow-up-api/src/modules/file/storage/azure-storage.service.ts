import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureStorageService {
  private containerClient?: ContainerClient;

  constructor(private readonly config: ConfigService) {}

  private getContainerClient(): ContainerClient {
    if (this.containerClient) {
      return this.containerClient;
    }

    const connectionString = this.config.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    const containerName =
      this.config.get<string>('AZURE_STORAGE_CONTAINER') || 'glowhub';

    if (!connectionString) {
      throw new InternalServerErrorException(
        'Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING',
      );
    }

    try {
      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient =
        blobServiceClient.getContainerClient(containerName);
      return this.containerClient;
    } catch {
      throw new InternalServerErrorException(
        'Invalid Azure storage configuration',
      );
    }
  }

  async upload(folder: string, file: Express.Multer.File): Promise<string> {
    const containerClient = this.getContainerClient();
    const blobName = `${folder}/${randomUUID()}${extname(file.originalname)}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    return blobName;
  }

  async delete(url: string) {
    const containerClient = this.getContainerClient();
    const blobName = url.split('.net/')[1];
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
  }

  async getBlobStream(blobPath: string) {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const downloadResponse = await blockBlobClient.download();

    return {
      stream: downloadResponse.readableStreamBody,
      contentType: downloadResponse.contentType,
    };
  }
  async download(blobPath: string) {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new NotFoundException('File not found');
    }

    return {
      stream: downloadResponse.readableStreamBody,
      contentType: downloadResponse.contentType,
    };
  }
}
