package com.storage.billing.core.notification;

public interface NotificationSender {
    void sendNotification(String recipientId, String title, String body);
}
