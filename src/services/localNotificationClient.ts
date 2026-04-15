export interface LocalNotificationClient {
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
  createChannel: (options: {
    id: string;
    name: string;
    description: string;
    importance: number;
    visibility: number;
    sound: string;
    vibration: boolean;
  }) => Promise<unknown>;
  getPending: () => Promise<{ notifications: any[] }>;
  cancel: (options: { notifications: Array<{ id: number }> }) => Promise<unknown>;
  schedule: (options: { notifications: any[] }) => Promise<unknown>;
}

export const createLocalNotificationClient = (plugin: LocalNotificationClient): LocalNotificationClient => ({
  checkPermissions: () => plugin.checkPermissions(),
  requestPermissions: () => plugin.requestPermissions(),
  createChannel: (options) => plugin.createChannel(options),
  getPending: () => plugin.getPending(),
  cancel: (options) => plugin.cancel(options),
  schedule: (options) => plugin.schedule(options)
});
