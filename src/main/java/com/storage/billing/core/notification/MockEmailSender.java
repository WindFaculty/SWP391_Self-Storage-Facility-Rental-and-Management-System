package com.storage.billing.core.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(MockEmailSender.class);

    @Override
    public void sendEmail(String to, String subject, String content) {
        log.info("[EMAIL_SENT_MOCK] To: {}, Subject: {}, Content Preview: {}",
                to, subject, content != null && content.length() > 50 ? content.substring(0, 50) + "..." : content);
    }
}
