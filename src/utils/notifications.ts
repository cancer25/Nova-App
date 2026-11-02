export interface ScheduleReminderParams {
  id: string;
  title: string;
  body?: string;
  date: Date | string; // Target local date/time
}

let notificationsInitialized = false;

// Safe dynamic accessor for expo-notifications on mobile
function getExpoNotifications() {
  if (typeof window !== 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  } catch {
    return 'Local';
  }
}

export async function initNotifications(): Promise<boolean> {
  if (notificationsInitialized) return true;

  const ExpoNotif = getExpoNotifications();
  if (ExpoNotif) {
    try {
      ExpoNotif.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldVibrate: true,
          priority: ExpoNotif.AndroidNotificationPriority?.MAX ?? 5,
        }),
      });

      if (typeof ExpoNotif.setNotificationChannelAsync === 'function') {
        await ExpoNotif.setNotificationChannelAsync('reminders_alarm_channel', {
          name: 'NOVA Reminders & Alarms',
          importance: ExpoNotif.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#4A6B53',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
          bypassDnd: false,
        });
      }

      const { status } = await ExpoNotif.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      notificationsInitialized = status === 'granted';
      return notificationsInitialized;
    } catch (e) {
      console.warn('Failed to initialize mobile notifications', e);
      return false;
    }
  }

  // Web notification permissions
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        const res = await Notification.requestPermission();
        notificationsInitialized = res === 'granted';
      } else {
        notificationsInitialized = Notification.permission === 'granted';
      }
      return notificationsInitialized;
    } catch {
      return false;
    }
  }

  return false;
}

// Play web alarm audio chime
function playWebChime() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

// Active in-memory timers for web
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function scheduleTaskReminder(params: ScheduleReminderParams): Promise<string | null> {
  await initNotifications();

  const targetDate = typeof params.date === 'string' ? new Date(params.date) : params.date;
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;

  if (diffMs <= 0) {
    console.warn('Target reminder date is in the past');
    return null;
  }

  const notifId = `reminder-${params.id}-${Date.now()}`;

  const ExpoNotif = getExpoNotifications();
  if (ExpoNotif) {
    try {
      // Mobile schedule with exact local timestamp
      const scheduledId = await ExpoNotif.scheduleNotificationAsync({
        content: {
          title: `🔔 ${params.title}`,
          body: params.body || 'Task reminder from NOVA',
          sound: 'default',
          priority: ExpoNotif.AndroidNotificationPriority?.MAX ?? 5,
          channelId: 'reminders_alarm_channel',
          data: { taskId: params.id },
        },
        trigger: {
          type: ExpoNotif.SchedulableTriggerInputTypes?.DATE ?? 'date',
          date: targetDate,
        },
      });
      return scheduledId;
    } catch (e) {
      console.error('Error scheduling native notification', e);
      return null;
    }
  }

  // Web fallback with setTimeout and browser notification
  if (webTimers.has(params.id)) {
    clearTimeout(webTimers.get(params.id)!);
    webTimers.delete(params.id);
  }

  const timer = setTimeout(() => {
    playWebChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 ${params.title}`, {
          body: params.body || 'Task reminder from NOVA',
          icon: '/assets/images/icon.png',
        });
      } catch (e) {
        console.warn('Notification constructor error', e);
      }
    }
    webTimers.delete(params.id);
  }, diffMs);

  webTimers.set(params.id, timer);
  return notifId;
}

export async function cancelTaskReminder(notificationId?: string | null, taskId?: string): Promise<void> {
  if (!notificationId && !taskId) return;

  const ExpoNotif = getExpoNotifications();
  if (ExpoNotif && notificationId) {
    try {
      await ExpoNotif.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('Failed to cancel native notification', e);
    }
  }

  if (taskId && webTimers.has(taskId)) {
    clearTimeout(webTimers.get(taskId)!);
    webTimers.delete(taskId);
  }
}
