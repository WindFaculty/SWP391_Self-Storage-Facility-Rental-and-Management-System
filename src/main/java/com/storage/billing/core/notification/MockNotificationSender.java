package com.storage.billing.core.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(MockNotificationSender.class);

    @Override
    public void sendNotification(String recipientId, String title, String body) {
        log.info("[NOTIFICATION_SENT_MOCK] Recipient: {}, Title: {}, Body: {}", recipientId, title, body);
    }
}
