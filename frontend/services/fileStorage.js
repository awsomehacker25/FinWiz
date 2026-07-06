import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

/**
 * Uploads a local image (camera/gallery URI) to Firebase Cloud Storage and
 * returns its public download URL.
 */
export async function uploadReceiptImage(userId, imageUri) {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const path = `receipts/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function deleteReceiptImage(downloadUrlOrPath) {
  const storageRef = ref(storage, downloadUrlOrPath);
  await deleteObject(storageRef);
}
