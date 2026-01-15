/**
 * 用户资料设置页面
 * 修改用户名和头像
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchProfile, updateProfile, UserProfile } from '../services';

// 预设头像列表
const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
];

export const ProfileSettings: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await fetchProfile();
            setUsername(profile.username || '朋友');
            // 确保头像 URL 有效，否则使用默认头像
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
            alert('请输入用户名');
            return;
        }

        setSaving(true);
        try {
            await updateProfile({
                username: username.trim(),
                avatar_url: avatarUrl
            });
            navigate(-1);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const compressImage = (dataUrl: string, maxSize = 200): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // 强制正方形
                canvas.width = maxSize;
                canvas.height = maxSize;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(dataUrl);
                    return;
                }

                // 中心裁剪
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = dataUrl;
        });
    };

    const handlePickFromGallery = async () => {
        try {
            const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
                width: 200,
                height: 200
            });

            if (image.dataUrl) {
                // 压缩图片
                const compressed = await compressImage(image.dataUrl);
                setAvatarUrl(compressed);
                setShowAvatarPicker(false);
            }
        } catch (error: any) {
            // 用户取消选择不算错误
            if (error.message !== 'User cancelled photos app') {
                console.error('选择图片失败:', error);
                // Web 端降级方案：使用 file input
                handleWebFilePicker();
            }
        }
    };

    const handleWebFilePicker = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target?.result as string;
                const compressed = await compressImage(dataUrl);
                setAvatarUrl(compressed);
                setShowAvatarPicker(false);
            };
            reader.readAsDataURL(file);
        };
        input.click();
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
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">个人资料</h1>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 px-6 py-8">
                {/* 头像选择 */}
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

                {/* 头像选择器 */}
                {showAvatarPicker && (
                    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-medium text-gray-500 mb-4 text-center">选择头像</p>

                        {/* 从相册选择 */}
                        <button
                            onClick={handlePickFromGallery}
                            className="w-full mb-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                        >
                            <Icon name="photo_library" size={20} />
                            <span>从相册选择</span>
                        </button>

                        <p className="text-xs text-gray-400 text-center mb-3">或选择预设头像</p>

                        <div className="grid grid-cols-4 gap-3">
                            {AVATAR_OPTIONS.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setAvatarUrl(url);
                                        setShowAvatarPicker(false);
                                    }}
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

                {/* 用户名输入 */}
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

                {/* 预览 */}
                <div className="p-4 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">预览效果</p>
                    <p className="text-xl font-bold text-primary dark:text-primary">
                        早安，{username || '朋友'}
                    </p>
                </div>
            </main>

            {/* 保存按钮 */}
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
