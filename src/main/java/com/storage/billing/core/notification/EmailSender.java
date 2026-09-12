package com.storage.billing.core.notification;

public interface EmailSender {
    void sendEmail(String to, String subject, String content);
}
