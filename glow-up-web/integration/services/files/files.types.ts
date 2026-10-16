export type EntityType = "PROVIDER" | "EMPLOYEE" | "CUSTOMER" | "AD";

export type FileCategory =
  | "logo"
  | "cover"
  | "gallery"
  | "document"
  | "profile"
  | "banner";

export interface UploadFileParams {
  file: File;
  entityType: EntityType;
  entityId: string;
  fileCategory: FileCategory;
  meta?: Record<string, string>;
}

export interface UploadedFileDto {
  url: string;
  blobPath: string;
  filename: string;
  size: number;
  mimeType: string;
  entityType: EntityType;
  fileCategory: FileCategory;
  uploadedAt: string;
}
