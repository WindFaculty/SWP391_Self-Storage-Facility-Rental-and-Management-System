package com.storage.account.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "social_identities")
public class SocialIdentity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 16)
    private String provider;
    @Column(name = "provider_subject", nullable = false, length = 255)
    private String subject;
    @Column(name = "user_id", nullable = false)
    private Long userId;

    protected SocialIdentity() {}
    public SocialIdentity(String provider, String subject, Long userId) {
        this.provider = provider;
        this.subject = subject;
        this.userId = userId;
    }
    public Long getUserId() { return userId; }
}
