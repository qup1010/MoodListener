import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface UploadResult {
    filename: string;
    url: string;
}

export async function saveImage(file: File): Promise<UploadResult> {
    const filename = `${Date.now()}_${file.name}`;

    // 将 File 转换为 Base64
    const base64Data = await readFileAsBase64(file);

    // 写入文件
    await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Data,
    });

    // 获取访问 URL
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

// 辅助函数：File -> Base64
function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result 包含 "data:image/jpeg;base64,..."，我们需要去掉前缀吗？
            // Capacitor writeFile 如果没指定 encoding 似乎默认 utf8，但对于 binary 需要 base64?
            // 查看文档，如果 data 是 string，encoding 未指定，默认 utf8。
            // 实际上对于图片，最好只传 base64 部分，不带 data URI scheme。

            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
