import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  confirmTone?: 'primary' | 'danger';
}

export interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'password';
}

interface FeedbackHandlers {
  notify: (message: string, type?: ToastType, durationMs?: number) => void;
  askConfirm: (options: ConfirmOptions) => Promise<boolean>;
  askPrompt: (options: PromptOptions) => Promise<string | null>;
  dismissOverlay: () => boolean;
}

const defaultHandlers: FeedbackHandlers = {
  notify: (message) => {
    window.alert(message);
  },
  askConfirm: async (options) => {
    return window.confirm(options.message);
  },
  askPrompt: async (options) => {
    return window.prompt(options.message, options.defaultValue || '') ?? null;
  },
  dismissOverlay: () => false
};

const feedbackBridge: { current: FeedbackHandlers } = { current: defaultHandlers };

const FeedbackContext = createContext<FeedbackHandlers>(defaultHandlers);

export const showToast = (message: string, type: ToastType = 'info', durationMs = 2200) => {
  feedbackBridge.current.notify(message, type, durationMs);
};

export const confirmAction = (options: ConfirmOptions | string): Promise<boolean> => {
  const normalized = typeof options === 'string' ? { message: options } : options;
  return feedbackBridge.current.askConfirm(normalized);
};

export const promptAction = (options: PromptOptions | string): Promise<string | null> => {
  const normalized = typeof options === 'string' ? { message: options } : options;
  return feedbackBridge.current.askPrompt(normalized);
};

export const dismissTopOverlay = (): boolean => {
  return feedbackBridge.current.dismissOverlay();
};

export const useFeedback = () => useContext(FeedbackContext);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [promptState, setPromptState] = useState<{
    options: PromptOptions;
    resolve: (value: string | null) => void;
  } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const idRef = useRef(1);

  const handlers = useMemo<FeedbackHandlers>(() => ({
    notify: (message, type = 'info', durationMs = 2200) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, durationMs);
    },
    askConfirm: (options) => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({ options, resolve });
      });
    },
    askPrompt: (options) => {
      return new Promise<string | null>((resolve) => {
        setPromptValue(options.defaultValue || '');
        setPromptState({ options, resolve });
      });
    },
    dismissOverlay: () => {
      if (promptState) {
        promptState.resolve(null);
        setPromptState(null);
        return true;
      }

      if (confirmState) {
        confirmState.resolve(false);
        setConfirmState(null);
        return true;
      }

      return false;
    }
  }), [confirmState, promptState]);

  useEffect(() => {
    feedbackBridge.current = handlers;
    return () => {
      feedbackBridge.current = defaultHandlers;
    };
  }, [handlers]);

  const closeConfirm = (result: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(result);
    setConfirmState(null);
  };

  const closePrompt = (result: string | null) => {
    if (!promptState) return;
    promptState.resolve(result);
    setPromptState(null);
  };

  return (
    <FeedbackContext.Provider value={handlers}>
      {children}

      <div className="pointer-events-none fixed left-0 right-0 top-[calc(env(safe-area-inset-top)+10px)] z-[120] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const style = toast.type === 'success'
            ? 'border-[rgba(79,139,99,0.45)] bg-[#f3f0e7] text-[#2c2c2c] dark:border-[rgba(127,183,144,0.5)] dark:bg-[#2b241f] dark:text-[#efe5d6]'
            : toast.type === 'error'
              ? 'border-[rgba(184,100,88,0.45)] bg-[#f6ece8] text-[#2c2c2c] dark:border-[rgba(239,156,144,0.48)] dark:bg-[#302420] dark:text-[#efe5d6]'
              : 'border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] text-[var(--ui-text-primary-light)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)] dark:text-[var(--ui-text-primary-dark)]';

          return (
            <div
              key={toast.id}
              className={`animate-in fade-in slide-in-from-top-2 pointer-events-auto max-w-md rounded-[12px] border-2 border-dashed px-4 py-2.5 text-sm font-medium shadow-[3px_3px_0_rgba(44,44,44,0.18)] ${style}`}
              style={{ transform: 'rotate(-0.6deg)' }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(44,44,44,0.22)] px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[14px] border-2 border-dashed border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] p-5 shadow-[5px_5px_0_rgba(44,44,44,0.2)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)] animate-in slide-in-from-bottom-4" style={{ transform: 'rotate(-1deg)' }}>
            {confirmState.options.title && (
              <h3 className="text-base font-bold italic text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
                {confirmState.options.title}
              </h3>
            )}
            <p className="mt-2 text-sm leading-relaxed text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
              {confirmState.options.message}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="ui-action-secondary"
              >
                {confirmState.options.cancelText || '取消'}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`ui-action-primary ${(confirmState.options.confirmTone === 'danger' || confirmState.options.danger) ? '!bg-[#b86458] !border-[#b86458] !text-[#fbf6ee] dark:!bg-[#b86458] dark:!border-[#b86458]' : ''}`}
              >
                {confirmState.options.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div className="fixed inset-0 z-[131] flex items-center justify-center bg-[rgba(44,44,44,0.22)] px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[14px] border-2 border-dashed border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] p-5 shadow-[5px_5px_0_rgba(44,44,44,0.2)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)] animate-in slide-in-from-bottom-4" style={{ transform: 'rotate(0.8deg)' }}>
            {promptState.options.title && (
              <h3 className="text-base font-bold italic text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
                {promptState.options.title}
              </h3>
            )}
            <p className="mt-2 text-sm leading-relaxed text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
              {promptState.options.message}
            </p>
            <div className="ui-input-shell mt-4">
              <input
                autoFocus
                type={promptState.options.inputType || 'text'}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={promptState.options.placeholder || ''}
                className="ui-input"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closePrompt(null)}
                className="ui-action-secondary"
              >
                {promptState.options.cancelText || '取消'}
              </button>
              <button
                type="button"
                onClick={() => closePrompt(promptValue.trim())}
                className="ui-action-primary"
              >
                {promptState.options.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};
