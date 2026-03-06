import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface UploadResult {
    filename: string;
    url: string;
}

export async function saveImage(file: File): Promise<UploadResult> {
    const filename = `${Date.now()}_${file.name}`;

    // 灏?File 杞崲涓?Base64
    const base64Data = await readFileAsBase64(file);

    // 鍐欏叆鏂囦欢
    await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Data,
    });

    // 鑾峰彇璁块棶 URL
    const uri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Data,
    });

    const webPath = Capacitor.convertFileSrc(uri.uri);

    return {
        filename: filename,
        url: webPath
    };
}

export async function deleteImage(filename: string): Promise<void> {
    try {
        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data,
        });
    } catch (e) {
        console.warn('Delete file failed:', e);
    }
}

// 杈呭姪鍑芥暟锛欶ile -> Base64
function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result 鍖呭惈 "data:image/jpeg;base64,..."锛屾垜浠渶瑕佸幓鎺夊墠缂€鍚楋紵
            // Capacitor writeFile 濡傛灉娌℃寚瀹?encoding 浼间箮榛樿 utf8锛屼絾瀵逛簬 binary 闇€瑕?base64?
            // 鏌ョ湅鏂囨。锛屽鏋?data 鏄?string锛宔ncoding 鏈寚瀹氾紝榛樿 utf8銆?
            // 瀹為檯涓婂浜庡浘鐗囷紝鏈€濂藉彧浼?base64 閮ㄥ垎锛屼笉甯?data URI scheme銆?

            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
