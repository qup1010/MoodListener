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
            ? 'bg-emerald-600/95 text-white'
            : toast.type === 'error'
              ? 'bg-rose-600/95 text-white'
              : 'bg-slate-900/90 text-white';

          return (
            <div
              key={toast.id}
              className={`animate-in fade-in slide-in-from-top-2 pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl ${style}`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900 animate-in slide-in-from-bottom-4">
            {confirmState.options.title && (
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {confirmState.options.title}
              </h3>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {confirmState.options.message}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="h-11 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {confirmState.options.cancelText || '取消'}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`h-11 rounded-xl text-sm font-semibold text-white transition-colors ${(confirmState.options.confirmTone === 'danger' || confirmState.options.danger) ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary hover:brightness-110'}`}
              >
                {confirmState.options.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div className="fixed inset-0 z-[131] flex items-center justify-center bg-black/45 px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900 animate-in slide-in-from-bottom-4">
            {promptState.options.title && (
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {promptState.options.title}
              </h3>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {promptState.options.message}
            </p>
            <input
              autoFocus
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState.options.placeholder || ''}
              className="mt-4 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closePrompt(null)}
                className="h-11 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {promptState.options.cancelText || '取消'}
              </button>
              <button
                type="button"
                onClick={() => closePrompt(promptValue.trim())}
                className="h-11 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:brightness-110"
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
