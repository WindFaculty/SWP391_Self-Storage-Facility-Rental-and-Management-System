package com.storage.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.*;

@Configuration
@ConditionalOnProperty(name = "app.google.enabled", havingValue = "true")
public class GoogleClientConfiguration {
    @Bean public ClientRegistrationRepository googleClients(
            @Value("${app.google.client-id:}") String id, @Value("${app.google.client-secret:}") String secret,
            @Value("${app.google.redirect-uri:}") String redirect) {
        if (id.isBlank() || secret.isBlank() || redirect.isBlank())
            throw new IllegalArgumentException("Enabled Google login requires client ID, secret and redirect URI");
        return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("google")
                .clientId(id).clientSecret(secret).clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE).redirectUri(redirect)
                .scope("openid", "email", "profile").authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token").jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .issuerUri("https://accounts.google.com").userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub").clientName("Google").build());
    }
}
