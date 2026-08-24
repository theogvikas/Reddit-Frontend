import axiosInstance from "./axiosInstance";

// Fetch all notifications for the logged-in user
export const fetchNotifications = async () => {
  try {
    const response = await axiosInstance.get("/notification");
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: error?.response?.data?.errMsg || "Failed to fetch notifications" };
  }
};

// Fetch unread notification count (for bell badge polling)
export const fetchUnreadCount = async () => {
  try {
    const response = await axiosInstance.get("/notification/unread-count");
    return response.data;
  } catch (error) {
    return { isSuccess: false, count: 0 };
  }
};

// Mark notification(s) as read - pass notificationId to mark one, omit to mark all
export const markNotificationsRead = async (notificationId) => {
  try {
    const response = await axiosInstance.post("/notification/mark-read", notificationId ? { notificationId } : {});
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: error?.response?.data?.errMsg || "Failed to mark as read" };
  }
};
