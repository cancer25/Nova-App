export const scheduleNotificationAsync = async () => 'web-notification-id';
export const cancelScheduledNotificationAsync = async () => {};
export const setNotificationHandler = () => {};
export const requestPermissionsAsync = async () => ({ status: 'granted' });
export const getPermissionsAsync = async () => ({ status: 'granted' });

export default {
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  setNotificationHandler,
  requestPermissionsAsync,
  getPermissionsAsync,
};
