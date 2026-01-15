/**
 * 记录心情页面
 * 用户选择情绪、添加标签、输入内容、上传图片后保存
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { createEntry, fetchTagsByMood, uploadImage, Tag } from '../services';
import { MoodType } from '../types';

export const RecordMood: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMood, setSelectedMood] = useState<MoodType>('positive');
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 默认不选择任何标签
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [details, setDetails] = useState({
    location: '',
    time: '下午时段'
  });

  // 根据情绪类型加载对应标签
  useEffect(() => {
    loadTags(selectedMood);
  }, [selectedMood]);

  const loadTags = async (mood: MoodType) => {
    try {
      const tags = await fetchTagsByMood(mood);
      setAvailableTags(tags);
      // 切换情绪时清空已选标签
      setSelectedTags([]);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  /**
   * 处理图片上传
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadImage(file);
        setImages(prev => [...prev, result.url]);
      }
    } catch (error: any) {
      alert(error.message || '图片上传失败');
    } finally {
      setUploading(false);
      // 清空 input 以便再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /**
   * 获取当前位置
   */
  const getCurrentLocation = async () => {
    if (fetchingLocation) return;

    setFetchingLocation(true);
    try {
      // 使用浏览器 Geolocation API
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;

      // 尝试通过反向地理编码获取地址名称
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'zh-CN,zh' } }
        );
        const data = await response.json();
        const address = data.address;
        // 构建简短地址
        const locationName = address.road || address.neighbourhood || address.suburb || address.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setDetails(prev => ({ ...prev, location: locationName }));
      } catch {
        // 反向地理编码失败，使用坐标
        setDetails(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
      }
    } catch (error: any) {
      if (error.code === 1) {
        alert('请允许位置权限');
      } else {
        alert('获取位置失败');
      }
    } finally {
      setFetchingLocation(false);
    }
  };

  /**
   * 保存心情记录
   */
  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().slice(0, 5);  // HH:mm

      // 根据选择的标签生成标题
      const title = selectedTags.length > 0
        ? selectedTags.slice(0, 2).join(' · ')
        : getMoodTitle(selectedMood);

      await createEntry({
        date,
        time,
        mood: selectedMood,
        title,
        content: content || undefined,
        tags: selectedTags,
        location: details.location || undefined,
        images: images.length > 0 ? images : undefined
      });

      // 保存成功，跳转到历史页面
      navigate('/history');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 根据情绪类型生成默认标题
   */
  const getMoodTitle = (mood: MoodType): string => {
    switch (mood) {
      case 'positive': return '今天心情不错';
      case 'neutral': return '平静的一天';
      case 'negative': return '有些低落';
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased selection:bg-primary/10">
      <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md transition-colors duration-300">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
        >
          <Icon name="arrow_back_ios_new" size={24} className="text-[#121617] dark:text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <h2 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">记录心情</h2>
        <div className="size-10 shrink-0"></div>
      </header>

      <main className="px-4 pt-2 flex flex-col gap-8">
        {/* 情绪选择 */}
        <section>
          <h2 className="text-[#121617] dark:text-white tracking-tight text-[28px] font-extrabold leading-tight text-center mb-6">你现在感觉如何？</h2>
          <div className="grid grid-cols-3 gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => setSelectedMood('positive')}
            >
              <input checked={selectedMood === 'positive'} className="peer sr-only" id="cat_positive" name="mood_category" type="radio" readOnly />
              <label className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-transparent shadow-sm hover:shadow-md transition-all duration-300 h-32 justify-center ${selectedMood === 'positive' ? 'bg-mood-positive shadow-lg shadow-mood-positive/30' : 'bg-white dark:bg-gray-800/50'}`} htmlFor="cat_positive">
                <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${selectedMood === 'positive' ? 'bg-white/30 text-white' : 'bg-mood-positive/10 dark:bg-mood-positive/20 text-[#166534] dark:text-mood-positive'}`}>
                  <Icon name="sentiment_satisfied" className="text-3xl" fill />
                </div>
                <span className={`text-sm font-bold ${selectedMood === 'positive' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>积极</span>
              </label>
            </div>
            <div
              className="relative group cursor-pointer"
              onClick={() => setSelectedMood('neutral')}
            >
              <input checked={selectedMood === 'neutral'} className="peer sr-only" id="cat_neutral" name="mood_category" type="radio" readOnly />
              <label className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-transparent shadow-sm hover:shadow-md transition-all duration-300 h-32 justify-center ${selectedMood === 'neutral' ? 'bg-mood-neutral shadow-lg shadow-mood-neutral/30 opacity-100' : 'bg-white dark:bg-gray-800/50 opacity-70 hover:opacity-100'}`} htmlFor="cat_neutral">
                <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${selectedMood === 'neutral' ? 'bg-white/30 text-[#422006]' : 'bg-mood-neutral/10 dark:bg-mood-neutral/20 text-[#854d0e] dark:text-mood-neutral'}`}>
                  <Icon name="sentiment_neutral" className="text-3xl" fill />
                </div>
                <span className={`text-sm font-bold ${selectedMood === 'neutral' ? 'text-[#422006]' : 'text-gray-600 dark:text-gray-400'}`}>中性</span>
              </label>
            </div>
            <div
              className="relative group cursor-pointer"
              onClick={() => setSelectedMood('negative')}
            >
              <input checked={selectedMood === 'negative'} className="peer sr-only" id="cat_negative" name="mood_category" type="radio" readOnly />
              <label className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-transparent shadow-sm hover:shadow-md transition-all duration-300 h-32 justify-center ${selectedMood === 'negative' ? 'bg-mood-negative shadow-lg shadow-mood-negative/30 opacity-100' : 'bg-white dark:bg-gray-800/50 opacity-70 hover:opacity-100'}`} htmlFor="cat_negative">
                <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${selectedMood === 'negative' ? 'bg-white/30 text-white' : 'bg-mood-negative/10 dark:bg-mood-negative/20 text-[#991b1b] dark:text-mood-negative'}`}>
                  <Icon name="sentiment_dissatisfied" className="text-3xl" fill />
                </div>
                <span className={`text-sm font-bold ${selectedMood === 'negative' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>消极</span>
              </label>
            </div>
          </div>
        </section>

        {/* 标签选择 */}
        <section>
          <h3 className="text-[#121617] dark:text-white text-lg font-bold leading-tight mb-4">选择情绪标签</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.length > 0 ? (
              availableTags.map(tag => {
                const isActive = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm transition-all active:scale-95 ${isActive
                      ? 'bg-primary dark:bg-gray-200 dark:text-primary text-white hover:brightness-105'
                      : 'bg-white dark:bg-gray-800/50 border border-transparent dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105'
                      }`}
                  >
                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{tag.name}</span>
                    {isActive && <Icon name="check" className="text-base" />}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 italic">加载标签中...</p>
            )}
          </div>
        </section>

        {/* 内容输入 */}
        <section>
          <h3 className="text-[#121617] dark:text-white text-lg font-bold leading-tight mb-4">此刻的想法...</h3>
          <div className="relative rounded-2xl bg-white dark:bg-gray-800/50 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="relative rounded-xl border-2 border-transparent focus-within:border-primary/20 dark:focus-within:border-white/20 transition-colors">
              <textarea
                className="w-full bg-transparent border-0 rounded-xl p-4 text-base text-[#121617] dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 min-h-[140px] resize-none leading-relaxed outline-none"
                placeholder="写下你现在的思绪..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
              <div className="flex justify-between items-center px-4 pb-3 pt-1">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    aria-label="Add photo"
                    className="p-2 text-gray-400 hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Icon name="image" size={20} />
                  </button>
                  <button
                    aria-label="Add location"
                    className={`p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors ${details.location ? 'text-primary' : 'text-gray-400 hover:text-primary dark:hover:text-white'}`}
                    onClick={getCurrentLocation}
                    disabled={fetchingLocation}
                  >
                    <Icon name="location_on" size={20} />
                  </button>
                </div>
                <span className="text-xs font-medium text-gray-400">
                  {uploading ? '上传中...' : fetchingLocation ? '定位中...' : details.location || '刚刚'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 已上传图片预览 */}
        {images.length > 0 && (
          <section>
            <h3 className="text-[#121617] dark:text-white text-lg font-bold leading-tight mb-4">已添加图片</h3>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                  <img src={img} alt={`图片 ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 位置和时间 */}
        <section>
          <div className="flex items-stretch gap-4 p-4 rounded-2xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 group">
            <div className="relative size-14 rounded-xl overflow-hidden shadow-sm shrink-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/100/100')" }}></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            <div className="flex flex-col justify-center flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="wb_sunny" className="text-primary dark:text-mood-neutral text-[16px]" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-mood-neutral">{details.time}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                记录地点 <span className="font-semibold text-gray-900 dark:text-gray-200">{details.location || '未设置'}</span>
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="self-center p-2 rounded-full hover:bg-primary/10 dark:hover:bg-white/10 text-primary dark:text-mood-neutral transition-colors"
            >
              <Icon name="edit" size={20} />
            </button>
          </div>
        </section>
      </main>

      {/* 保存按钮 */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-background-light via-background-light/95 to-transparent dark:from-background-dark dark:via-background-dark/95 z-40 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 h-14 bg-primary dark:bg-gray-100 dark:text-primary text-white rounded-xl shadow-lg shadow-primary/25 dark:shadow-black/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-bold text-lg tracking-wide">
            {saving ? '保存中...' : '保存记录'}
          </span>
          {!saving && <Icon name="send" className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>

      {/* 编辑详情弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">编辑详情</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">位置</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus-within:ring-2 ring-primary/20 transition-all">
                  <Icon name="location_on" className="text-primary" />
                  <input
                    type="text"
                    value={details.location}
                    onChange={(e) => setDetails({ ...details, location: e.target.value })}
                    placeholder="输入位置"
                    className="bg-transparent border-none p-0 text-gray-900 dark:text-white w-full focus:ring-0 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">时段</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus-within:ring-2 ring-primary/20 transition-all">
                  <Icon name="schedule" className="text-primary" />
                  <select
                    value={details.time}
                    onChange={(e) => setDetails({ ...details, time: e.target.value })}
                    className="bg-transparent border-none p-0 text-gray-900 dark:text-white w-full focus:ring-0 font-medium"
                  >
                    <option>上午时段</option>
                    <option>下午时段</option>
                    <option>晚间时段</option>
                    <option>凌晨</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
