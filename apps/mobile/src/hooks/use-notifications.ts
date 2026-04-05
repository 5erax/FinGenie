import { useCallback, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { registerForPushNotifications } from "../lib/notifications";

interface NotificationState {
  expoPushToken: string | null;
  hasPermission: boolean;
  isLoading: boolean;
}

/**
 * Initializes push notifications on mount, wires up foreground and tap listeners,
 * and provides the current permission state + a manual re-request callback.
 */
export function useNotifications() {
  const router = useRouter();
  const [state, setState] = useState<NotificationState>({
    expoPushToken: null,
    hasPermission: false,
    isLoading: true,
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Push notifications are not supported on web
    if (Platform.OS === "web") {
      setState({ expoPushToken: null, hasPermission: false, isLoading: false });
      return;
    }

    // Register on mount and store token
    registerForPushNotifications()
      .then((token) => {
        setState({
          expoPushToken: token,
          hasPermission: token !== null,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({
          expoPushToken: null,
          hasPermission: false,
          isLoading: false,
        });
      });

    // Foreground: notification received while app is open
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Notification handled by the OS tray; no additional action needed here
      });

    // User tapped a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;

        if (data?.route) {
          router.push(data.route as string);
        } else if (data?.type === "alert") {
          router.push("/alerts");
        } else if (data?.type === "transaction") {
          router.push("/(tabs)/transactions");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  /**
   * Manually re-request permission (e.g. from a settings screen).
   * Returns the token, or null if denied.
   */
  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const token = await registerForPushNotifications();
    setState({
      expoPushToken: token,
      hasPermission: token !== null,
      isLoading: false,
    });
    return token;
  }, []);

  return { ...state, requestPermission };
}
