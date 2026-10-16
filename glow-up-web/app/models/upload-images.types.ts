export type UploadedImage = {
  id: string;

  file: File;
  blobPath?: string;
  previewUrl: string;
  url?: string;
};
export type UploadImageLimits = {
  maxFiles: number;

  maxSizeMB: number;

  accept: string[];
};
