import assert from 'node:assert/strict';

import { createLocalNotificationClient } from '../src/services/localNotificationClient.js';

let thenAccessed = false;

const plugin = new Proxy({
  checkPermissions: async () => ({ display: 'granted' as const }),
  requestPermissions: async () => ({ display: 'granted' as const }),
  createChannel: async () => undefined,
  getPending: async () => ({ notifications: [] }),
  cancel: async () => undefined,
  schedule: async () => undefined
}, {
  get(target, prop, receiver) {
    if (prop === 'then') {
      thenAccessed = true;
      throw new Error('then trap should not be touched');
    }
    return Reflect.get(target, prop, receiver);
  }
});

const client = await Promise.resolve(createLocalNotificationClient(plugin));

assert.equal(thenAccessed, false);
assert.equal(typeof client.checkPermissions, 'function');
assert.equal(typeof client.schedule, 'function');

console.log('localNotificationClient test passed');
