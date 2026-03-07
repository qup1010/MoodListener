/**
 * v1.3 活动管理页（沿用 /settings/tags 路由）
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  archiveActivity,
  createActivity,
  createActivityGroup,
  fetchActivityGroups,
  moveActivity,
  reorderActivities,
  reorderActivityGroups,
  updateActivity,
  updateActivityGroup
} from '../services';
import { ActivityGroupWithItems, ActivityItem } from '../types';
import { confirmAction, promptAction, showToast } from '../src/ui/feedback';

export const TagManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ActivityGroupWithItems[]>([]);

  const groupActionButtonClass = 'flex size-8 items-center justify-center rounded-lg border border-gray-200 text-[var(--ui-text-secondary-light)] dark:border-gray-700 dark:text-[var(--ui-text-secondary-dark)]';
  const itemActionButtonClass = 'flex size-7 items-center justify-center rounded-md border border-gray-200 text-[var(--ui-text-secondary-light)] dark:border-gray-700 dark:text-[var(--ui-text-secondary-dark)]';

  useEffect(() => {
    void loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchActivityGroups(true);
      setGroups(data);
    } catch (error) {
      console.error('加载活动分组失败:', error);
      showToast('加载失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    const name = await promptAction({
      title: '新增分组',
      message: '请输入分组名称',
      placeholder: '例如：睡眠、工作、生活',
      confirmText: '新增',
      cancelText: '取消'
    });

    if (!name?.trim()) return;

    try {
      await createActivityGroup({ name: name.trim() });
      await loadGroups();
      showToast('分组已新增', 'success');
    } catch (error) {
      console.error('新增分组失败:', error);
      showToast('新增失败，请重试', 'error');
    }
  };

  const handleRenameGroup = async (groupId: number, currentName: string) => {
    const name = await promptAction({
      title: '重命名分组',
      message: `当前名称：${currentName}`,
      placeholder: currentName,
      confirmText: '保存',
      cancelText: '取消'
    });

    if (!name?.trim()) return;

    try {
      await updateActivityGroup(groupId, { name: name.trim() });
      await loadGroups();
    } catch (error) {
      console.error('分组重命名失败:', error);
      showToast('操作失败', 'error');
    }
  };

  const moveGroup = async (groupId: number, direction: -1 | 1) => {
    const index = groups.findIndex((item) => item.id === groupId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= groups.length) return;

    const ordered = [...groups];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved);

    try {
      await reorderActivityGroups(ordered.map((item) => item.id));
      await loadGroups();
    } catch (error) {
      console.error('分组排序失败:', error);
      showToast('排序失败', 'error');
    }
  };

  const handleAddActivity = async (groupId: number) => {
    const name = await promptAction({
      title: '新增活动',
      message: '请输入活动名称',
      placeholder: '例如：运动、午睡、开会',
      confirmText: '新增',
      cancelText: '取消'
    });

    if (!name?.trim()) return;

    try {
      await createActivity({ group_id: groupId, name: name.trim(), icon: 'label' });
      await loadGroups();
      showToast('活动已新增', 'success');
    } catch (error) {
      console.error('新增活动失败:', error);
      showToast('新增失败，请重试', 'error');
    }
  };

  const handleRenameActivity = async (activity: ActivityItem) => {
    const name = await promptAction({
      title: '重命名活动',
      message: `当前名称：${activity.name}`,
      placeholder: activity.name,
      confirmText: '保存',
      cancelText: '取消'
    });

    if (!name?.trim()) return;

    try {
      await updateActivity(activity.id, { name: name.trim() });
      await loadGroups();
    } catch (error) {
      console.error('活动重命名失败:', error);
      showToast('操作失败', 'error');
    }
  };

  const handleArchiveActivity = async (activity: ActivityItem) => {
    const nextArchived = !activity.is_archived;
    const confirmed = await confirmAction({
      title: nextArchived ? '归档活动' : '恢复活动',
      message: nextArchived ? `归档后记录页不再显示「${activity.name}」` : `恢复后记录页将显示「${activity.name}」`,
      confirmText: nextArchived ? '归档' : '恢复',
      cancelText: '取消',
      danger: nextArchived
    });

    if (!confirmed) return;

    try {
      await archiveActivity(activity.id, nextArchived);
      await loadGroups();
    } catch (error) {
      console.error('归档活动失败:', error);
      showToast('操作失败', 'error');
    }
  };

  const moveActivityInGroup = async (group: ActivityGroupWithItems, activityId: number, direction: -1 | 1) => {
    const list = [...group.activities];
    const index = list.findIndex((item) => item.id === activityId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(nextIndex, 0, moved);

    try {
      await reorderActivities(group.id, list.map((item) => item.id));
      await loadGroups();
    } catch (error) {
      console.error('活动排序失败:', error);
      showToast('排序失败', 'error');
    }
  };

  const moveActivityToNextGroup = async (activity: ActivityItem) => {
    const currentGroupIndex = groups.findIndex((group) => group.id === activity.group_id);
    if (currentGroupIndex === -1 || groups.length < 2) return;

    const nextGroup = groups[(currentGroupIndex + 1) % groups.length];

    try {
      await moveActivity(activity.id, nextGroup.id);
      await loadGroups();
      showToast(`已移动到 ${nextGroup.name}`, 'success');
    } catch (error) {
      console.error('移动活动失败:', error);
      showToast('移动失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
        <button onClick={() => navigate('/settings', { replace: true })} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="arrow_back_ios_new" />
        </button>
        <h1 className="text-lg font-bold">活动管理</h1>
        <button onClick={() => void handleAddGroup()} className="size-10 rounded-full bg-primary text-white flex items-center justify-center">
          <Icon name="add" />
        </button>
      </header>

      <main className="px-4 py-4 pb-8 flex flex-col gap-3 overflow-y-auto">
        {groups.map((group, groupIndex) => (
          <section key={group.id} className="ui-card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-bold text-base">{group.name}</h2>
                <p className="text-xs text-gray-500">{group.activities.length} 个活动</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => void handleRenameGroup(group.id, group.name)} className="size-8 rounded-lg border border-gray-200 dark:border-gray-700"><Icon name="edit" size={16} /></button>
                <button onClick={() => void moveGroup(group.id, -1)} disabled={groupIndex === 0} className="size-8 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"><Icon name="arrow_upward" size={16} /></button>
                <button onClick={() => void moveGroup(group.id, 1)} disabled={groupIndex === groups.length - 1} className="size-8 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"><Icon name="arrow_downward" size={16} /></button>
                <button onClick={() => void handleAddActivity(group.id)} className="h-8 px-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold">+ 活动</button>
              </div>
            </div>

            {group.activities.length === 0 ? (
              <p className="text-sm text-gray-400">暂无活动</p>
            ) : (
              <div className="flex flex-col gap-2">
                {group.activities.map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name={activity.icon || 'label'} size={16} className="text-gray-400" />
                      <span className={`text-sm font-medium truncate ${activity.is_archived ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{activity.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => void handleRenameActivity(activity)} className={itemActionButtonClass}><Icon name="edit" size={14} className="shrink-0" /></button>
                      <button onClick={() => void moveActivityInGroup(group, activity.id, -1)} disabled={index === 0} className={`${itemActionButtonClass} disabled:opacity-40`}><Icon name="arrow_upward" size={14} className="shrink-0" /></button>
                      <button onClick={() => void moveActivityInGroup(group, activity.id, 1)} disabled={index === group.activities.length - 1} className={`${itemActionButtonClass} disabled:opacity-40`}><Icon name="arrow_downward" size={14} className="shrink-0" /></button>
                      <button onClick={() => void moveActivityToNextGroup(activity)} className={itemActionButtonClass}><Icon name="redo" size={14} className="shrink-0" /></button>
                      <button onClick={() => void handleArchiveActivity(activity)} className={`${itemActionButtonClass} border-primary/30 text-primary`}>
                        <Icon name={activity.is_archived ? 'unarchive' : 'archive'} size={14} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
};
