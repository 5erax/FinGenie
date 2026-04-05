import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification handler only on native (web doesn't support it)
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

/**
 * Registers the device for push notifications and returns the Expo push token.
 * Returns null if running on a simulator, permissions are denied, or registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === "web") {
    return null;
  }

  if (!Device.isDevice) {
    if (__DEV__) console.warn("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions before requesting
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    if (__DEV__) console.warn("Push notification permission not granted");
    return null;
  }

  // Set up Android notification channels
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Mặc định",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#a78bfa",
    });

    await Notifications.setNotificationChannelAsync("alerts", {
      name: "Cảnh báo tài chính",
      importance: Notifications.AndroidImportance.HIGH,
      description: "Thông báo về chi tiêu và ngân sách",
    });

    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Nhắc nhở",
      importance: Notifications.AndroidImportance.DEFAULT,
      description: "Nhắc nhở ghi chép giao dịch",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    if (__DEV__) console.error("Failed to get Expo push token:", error);
    return null;
  }
}

/**
 * Schedules a local notification immediately (or with a custom trigger).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput,
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: trigger ?? null,
  });
}

/**
 * Schedules a daily reminder at the given hour/minute (24h, local time).
 * Cancels any existing reminder first to avoid duplicates.
 * Defaults to 20:00 (8 PM).
 */
export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Ghi chép chi tiêu",
      body: "Đừng quên ghi lại các khoản chi tiêu hôm nay nhé! 📝",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancels all scheduled notifications in the 'reminders' channel.
 */
export async function cancelDailyReminder() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    // Cancel reminders by matching the known title
    if (notif.content.title === "Ghi chép chi tiêu") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/** Returns the current app icon badge count. */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/** Sets the app icon badge count. Pass 0 to clear. */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
