import { apiClient } from './client';

export interface MediaUploadResult {
  url: string;
  filename: string;
}

export const mediaApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<MediaUploadResult>('/api/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
