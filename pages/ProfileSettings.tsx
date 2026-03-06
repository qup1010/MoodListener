/**
 * 用户资料设置页面
 * 修改用户名和头像
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchProfile, updateProfile } from '../services';
import { showToast } from '../src/ui/feedback';

const buildAvatarDataUrl = (label: string, background: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${background}" />
  <text x="64" y="74" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="44" font-weight="700">${label}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const AVATAR_OPTIONS = [
    buildAvatarDataUrl('A', '#ef4444'),
    buildAvatarDataUrl('S', '#f97316'),
    buildAvatarDataUrl('L', '#eab308'),
    buildAvatarDataUrl('M', '#22c55e'),
    buildAvatarDataUrl('Z', '#0ea5e9'),
    buildAvatarDataUrl('K', '#3b82f6'),
    buildAvatarDataUrl('N', '#8b5cf6'),
    buildAvatarDataUrl('Q', '#ec4899'),
];

const isMediaPermissionGranted = (state?: string) => state === 'granted' || state === 'limited';

const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(blob);
    });
};

export const ProfileSettings: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    useEffect(() => {
        void loadProfile();
    }, []);

    const applyAvatar = (url: string) => {
        setAvatarUrl(url);
        setShowAvatarPicker(false);
    };

    const loadProfile = async () => {
        try {
            const profile = await fetchProfile();
            setUsername(profile.username || '朋友');
            const savedAvatar = profile.avatar_url;
            if (savedAvatar && (savedAvatar.startsWith('http') || savedAvatar.startsWith('data:'))) {
                setAvatarUrl(savedAvatar);
            } else {
                setAvatarUrl(AVATAR_OPTIONS[0]);
            }
        } catch (error) {
            console.error('加载资料失败:', error);
            setAvatarUrl(AVATAR_OPTIONS[0]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            showToast('请输入用户名', 'error');
            return;
        }

        setSaving(true);
        try {
            await updateProfile({
                username: username.trim(),
                avatar_url: avatarUrl
            });
            navigate('/settings', { replace: true });
        } catch (error) {
            console.error('保存失败:', error);
            showToast('保存失败，请重试', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleWebFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        try {
            const dataUrl = await blobToDataUrl(file);
            applyAvatar(dataUrl);
        } catch (error) {
            console.error('[Avatar] Web file pick failed:', error);
            showToast('头像读取失败，请重试', 'error');
        }
    };

    const pickAvatar = async (sourceType: 'photos' | 'camera') => {
        setShowAvatarPicker(false);

        try {
            const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

            const current = await Camera.checkPermissions();
            const needPhotos = sourceType === 'photos' && !isMediaPermissionGranted(current.photos);
            const needCamera = sourceType === 'camera' && !isMediaPermissionGranted(current.camera);

            if (needPhotos || needCamera) {
                const request = await Camera.requestPermissions({
                    permissions: sourceType === 'camera' ? ['camera', 'photos'] : ['photos']
                });

                if (sourceType === 'photos' && !isMediaPermissionGranted(request.photos)) {
                    showToast('需要相册权限才能更改头像', 'error');
                    return;
                }

                if (sourceType === 'camera' && !isMediaPermissionGranted(request.camera)) {
                    showToast('需要相机权限才能拍照设置头像', 'error');
                    return;
                }
            }

            const image = await Camera.getPhoto({
                quality: 85,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: sourceType === 'camera' ? CameraSource.Camera : CameraSource.Photos,
                width: 512,
                height: 512,
                webUseInput: true
            });

            if (image.dataUrl) {
                applyAvatar(image.dataUrl);
                return;
            }

            if (image.webPath) {
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const dataUrl = await blobToDataUrl(blob);
                applyAvatar(dataUrl);
                return;
            }

            showToast('未获取到头像，请重试', 'error');
        } catch (error: any) {
            console.error('[Avatar] Error:', error);
            if (error?.message?.toLowerCase().includes('cancel')) return;
            // 机型兼容兜底：使用文件选择器
            handleWebFilePicker();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <span className="text-gray-500">加载中...</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display antialiased">
            <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <button
                    onClick={() => navigate('/settings', { replace: true })}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">个人资料</h1>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 px-6 py-8">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                />

                <div className="flex flex-col items-center mb-8">
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    >
                        <div className="size-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg group-hover:scale-105 transition-transform">
                            <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                            <Icon name="edit" size={16} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">点击更换头像</p>
                </div>

                {showAvatarPicker && (
                    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-medium text-gray-500 mb-4 text-center">选择头像</p>

                        <div className="grid grid-cols-1 gap-2 mb-4">
                            <button
                                onClick={() => void pickAvatar('photos')}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                            >
                                <Icon name="photo_library" size={20} />
                                <span>从相册选择</span>
                            </button>
                            <button
                                onClick={() => void pickAvatar('camera')}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Icon name="photo_camera" size={20} />
                                <span>拍照设置头像</span>
                            </button>
                            <button
                                onClick={handleWebFilePicker}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Icon name="folder_open" size={20} />
                                <span>兼容模式（文件）</span>
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mb-3">或选择预设头像</p>

                        <div className="grid grid-cols-4 gap-3">
                            {AVATAR_OPTIONS.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => applyAvatar(url)}
                                    className={`size-16 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${avatarUrl === url
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-transparent'
                                        }`}
                                >
                                    <img src={url} alt={`头像 ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        用户名
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="输入你的名字"
                            maxLength={20}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            {username.length}/20
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">预览效果</p>
                    <p className="text-xl font-bold text-primary dark:text-primary">
                        早安，{username || '朋友'}
                    </p>
                </div>
            </main>

            <div className="p-6 bg-gradient-to-t from-background-light via-background-light/95 to-transparent dark:from-background-dark dark:via-background-dark/95">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                    {saving ? '保存中...' : '保存修改'}
                </button>
            </div>
        </div>
    );
};

