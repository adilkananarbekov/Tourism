import { apiEnabled, uploadApiImage } from './api';

export async function uploadImage(file: File, _pathPrefix: string) {
  if (apiEnabled) {
    return uploadApiImage(file, _pathPrefix);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}
