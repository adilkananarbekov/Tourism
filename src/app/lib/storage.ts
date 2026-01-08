import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(file: File, pathPrefix: string) {
  if (!storage) {
    throw new Error('Storage is not configured.');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const storageRef = ref(storage, `${pathPrefix}/${Date.now()}-${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
