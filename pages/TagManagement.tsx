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

  const groupActionButtonClass = 'sketch-icon-button flex size-8 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed';
  const itemActionButtonClass = 'sketch-icon-button flex size-7 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed';

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
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        加载中...
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate('/settings', { replace: true })} className="sketch-icon-button flex size-10 items-center justify-center">
            <Icon name="arrow_back_ios_new" size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-lg font-extrabold tracking-tight">活动管理</h1>
            <p className="mt-0.5 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">整理分组、顺序和显示状态。</p>
          </div>
          <button onClick={() => void handleAddGroup()} className="sketch-icon-button flex size-10 items-center justify-center">
            <Icon name="add" size={20} />
          </button>
        </div>
      </header>

      <main className="page-content flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col gap-3">
          {groups.map((group, groupIndex) => (
            <section key={group.id} className="ui-card ui-card--subtle p-4" style={{ transform: `rotate(${groupIndex % 2 === 0 ? '-0.35deg' : '0.35deg'})` }}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-base">{group.name}</h2>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{group.activities.length} 个活动</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => void handleRenameGroup(group.id, group.name)} className={groupActionButtonClass}><Icon name="edit" size={16} /></button>
                  <button type="button" onClick={() => void moveGroup(group.id, -1)} disabled={groupIndex === 0} className={groupActionButtonClass}><Icon name="arrow_upward" size={16} /></button>
                  <button type="button" onClick={() => void moveGroup(group.id, 1)} disabled={groupIndex === groups.length - 1} className={groupActionButtonClass}><Icon name="arrow_downward" size={16} /></button>
                </div>
              </div>

              <div className="mb-3 flex justify-end">
                <button type="button" onClick={() => void handleAddActivity(group.id)} className="ui-action-secondary !w-auto min-h-8 px-3 text-xs">
                  <Icon name="add" size={14} />
                  添加活动
                </button>
              </div>

              {group.activities.length === 0 ? (
                <div className="sketch-note text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">这个分组里还没有活动。</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {group.activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-2 rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] px-3 py-2.5 shadow-[2px_2px_0_rgba(44,44,44,0.08)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] text-[var(--ui-brand-primary-strong)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)] dark:text-[var(--ui-brand-primary)]">
                          <Icon name={activity.icon || 'label'} size={16} />
                        </div>
                        <span className={`truncate text-sm font-semibold ${activity.is_archived ? 'line-through text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]' : 'text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]'}`}>
                          {activity.name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => void handleRenameActivity(activity)} className={itemActionButtonClass}><Icon name="edit" size={14} className="shrink-0" /></button>
                        <button type="button" onClick={() => void moveActivityInGroup(group, activity.id, -1)} disabled={index === 0} className={itemActionButtonClass}><Icon name="arrow_upward" size={14} className="shrink-0" /></button>
                        <button type="button" onClick={() => void moveActivityInGroup(group, activity.id, 1)} disabled={index === group.activities.length - 1} className={itemActionButtonClass}><Icon name="arrow_downward" size={14} className="shrink-0" /></button>
                        <button type="button" onClick={() => void moveActivityToNextGroup(activity)} className={itemActionButtonClass}><Icon name="redo" size={14} className="shrink-0" /></button>
                        <button type="button" onClick={() => void handleArchiveActivity(activity)} className={`${itemActionButtonClass} text-primary`}>
                          <Icon name={activity.is_archived ? 'unarchive' : 'archive'} size={14} className="shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};
