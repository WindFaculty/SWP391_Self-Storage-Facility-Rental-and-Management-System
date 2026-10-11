CREATE TABLE social_identities (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(16) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT uk_social_identity UNIQUE (provider, provider_subject),
    CONSTRAINT fk_social_identity_user FOREIGN KEY (user_id) REFERENCES users(id)
);
