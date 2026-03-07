import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface UploadResult {
    filename: string;
    url: string;
}

const readBlobAsBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const saveBlob = async (blob: Blob, filename: string): Promise<UploadResult> => {
    const base64Data = await readBlobAsBase64(blob);

    await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Data
    });

    const uri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Data
    });

    return {
        filename,
        url: Capacitor.convertFileSrc(uri.uri)
    };
};

export async function saveImage(file: File): Promise<UploadResult> {
    const filename = `${Date.now()}_${file.name}`;
    return saveBlob(file, filename);
}

export async function saveAudio(blob: Blob, ext = 'webm'): Promise<UploadResult> {
    const filename = `${Date.now()}_audio.${ext}`;
    return saveBlob(blob, filename);
}

const deleteFile = async (filename: string): Promise<void> => {
    try {
        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data
        });
    } catch (e) {
        console.warn('Delete file failed:', e);
    }
};

export async function deleteImage(filename: string): Promise<void> {
    await deleteFile(filename);
}

export async function deleteAudio(filename: string): Promise<void> {
    await deleteFile(filename);
}
