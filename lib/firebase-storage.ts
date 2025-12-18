import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Firebase Storage upload error:", error);
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      if (error.message.includes("unauthorized") || error.message.includes("permission")) {
        throw new Error("No tienes permisos para subir archivos. Por favor, verifica tu autenticación.");
      }
      if (error.message.includes("quota") || error.message.includes("storage")) {
        throw new Error("Error de almacenamiento. Por favor, intenta más tarde.");
      }
      throw new Error(`Error al subir el archivo: ${error.message}`);
    }
    throw new Error("Error desconocido al subir el archivo");
  }
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function getAvatarPath(userId: string, fileName: string): string {
  return `avatars/${userId}/${fileName}`;
}

export function getBadgePath(userId: string, fileName: string): string {
  return `badges/${userId}/${fileName}`;
}

export function getProjectImagePath(userId: string, fileName: string): string {
  return `projects/${userId}/${fileName}`;
}
