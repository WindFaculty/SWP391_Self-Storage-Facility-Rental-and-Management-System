package com.storage.account;

import com.storage.account.entity.*;
import com.storage.account.repository.*;
import com.storage.account.service.GoogleAccountService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.security.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.*;
import org.springframework.security.oauth2.core.oidc.*;
import org.springframework.security.oauth2.core.oidc.user.*;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.mysql.MySQLContainer;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.google.enabled=true", "app.google.client-id=test-client", "app.google.client-secret=test-secret", "app.google.redirect-uri=http://localhost:8080/api/v1/login/oauth2/code/google"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class GoogleLoginTests {
    @Container @ServiceConnection static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    @Autowired GoogleAccountService accounts;
    @Autowired UserRepository users;
    @Autowired SocialIdentityRepository identities;
    @Autowired GoogleOAuthHandlers handlers;
    @Autowired MockMvc mvc;
    private OidcUser principal(String subject, String email, boolean verified) {
        Instant now = Instant.now();
        return new DefaultOidcUser(List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")),
            new OidcIdToken("mock-id-token", now, now.plusSeconds(300), Map.of("sub", subject,
                "email", email, "email_verified", verified, "name", "Google Customer", "iss", "https://accounts.google.com", "aud", List.of("test-client"))));
    }
    private String unique() { return UUID.randomUUID().toString(); }
    @Test void newAccountAndRepeatedLoginUseOneCustomerDespiteElevatedProviderAuthority() {
        String sub=unique(), email=unique()+"@example.com";
        var first=accounts.login(principal(sub,email,true));
        var again=accounts.login(principal(sub,"changed@example.com",true));
        assertEquals(UserRole.CUSTOMER, first.user().role());
        assertEquals(first.user().id(), again.user().id());
        assertEquals(email,again.user().email());
        assertEquals(first.user().id(), identities.findByProviderAndSubject("google",sub).orElseThrow().getUserId());
    }
    @Test void emailConflictDoesNotLinkExistingPasswordAccount() {
        String email=unique()+"@example.com"; User user=new User(); user.setEmail(email); user.setFullName("Existing");
        user.setPasswordHash("existing-password-hash"); user.setRole(UserRole.ADMIN); users.saveAndFlush(user);
        String sub=unique(); assertThrows(BusinessException.class,()->accounts.login(principal(sub,email,true)));
        assertTrue(identities.findByProviderAndSubject("google",sub).isEmpty());
        assertEquals(UserRole.ADMIN, users.findByEmail(email).orElseThrow().getRole());
    }
    @Test void disabledLinkedAccountCannotLoginAndStoredRoleIsPreserved() {
        String sub=unique(); var auth=accounts.login(principal(sub,unique()+"@example.com",true));
        User user=users.findById(auth.user().id()).orElseThrow(); user.setRole(UserRole.BUSINESS_MANAGER); users.saveAndFlush(user);
        assertEquals(UserRole.BUSINESS_MANAGER,accounts.login(principal(sub,user.getEmail(),true)).user().role());
        user.setStatus(UserStatus.DISABLED); users.saveAndFlush(user);
        assertThrows(BusinessException.class,()->accounts.login(principal(sub,user.getEmail(),true)));
    }
    @Test void unverifiedEmailIsRejectedBeforePersistence() {
        String sub=unique(), email=unique()+"@example.com";
        assertThrows(BusinessException.class,()->accounts.login(principal(sub,email,false)));
        assertTrue(identities.findByProviderAndSubject("google",sub).isEmpty()); assertFalse(users.existsByEmail(email));
    }
    @Test void subjectIsCaseSensitive() {
        String sub=unique(); var a=accounts.login(principal(sub+"A",unique()+"@example.com",true));
        var b=accounts.login(principal(sub+"a",unique()+"@example.com",true)); assertNotEquals(a.user().id(),b.user().id());
    }
    @Test void concurrentFirstLoginCreatesOneAccount() throws Exception {
        String sub=unique(), email=unique()+"@example.com"; CountDownLatch start=new CountDownLatch(1);
        try (var pool=Executors.newFixedThreadPool(2)) {
            Callable<Long> task=()->{ start.await(); return accounts.login(principal(sub,email,true)).user().id(); };
            var a=pool.submit(task); var b=pool.submit(task); start.countDown(); assertEquals(a.get(30,TimeUnit.SECONDS),b.get(30,TimeUnit.SECONDS));
        }
    }
    @Test void successIssuesHttpOnlyCookiesWithoutTokensInRedirectAndCookieLifecycleWorks() throws Exception {
        MockHttpServletRequest request=new MockHttpServletRequest(); request.getSession(); MockHttpServletResponse response=new MockHttpServletResponse();
        var oidc=principal(unique(),unique()+"@example.com",true);
        handlers.success(request,response,new OAuth2AuthenticationToken(oidc,oidc.getAuthorities(),"google"));
        assertEquals("http://localhost:5173/auth?oauth=success",response.getRedirectedUrl());
        assertNull(request.getSession(false));
        assertTrue(response.getHeaders("Set-Cookie").stream().allMatch(h->h.contains("HttpOnly")&&h.contains("SameSite=Lax")));
        Cookie access=response.getCookie(AuthCookies.ACCESS), refresh=response.getCookie(AuthCookies.REFRESH);
        assertNotNull(access); assertNotNull(refresh);
        mvc.perform(get("/auth/me").cookie(access)).andExpect(status().isOk()).andExpect(jsonPath("$.data.role").value("CUSTOMER"));
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/admin/users").cookie(access)).andExpect(status().isForbidden());
        mvc.perform(post("/auth/cookie/refresh").cookie(refresh)).andExpect(status().isForbidden());
        var csrfResponse=mvc.perform(get("/auth/cookie/csrf")).andReturn().getResponse();
        String token=com.jayway.jsonpath.JsonPath.read(csrfResponse.getContentAsString(),"$.data.token");
        Cookie csrfCookie=csrfResponse.getCookie("XSRF-TOKEN"); assertNotNull(csrfCookie);
        var rotated=mvc.perform(post("/auth/cookie/refresh").cookie(refresh,csrfCookie).header("X-XSRF-TOKEN",token)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").doesNotExist()).andReturn().getResponse();
        Cookie next=rotated.getCookie(AuthCookies.REFRESH); assertNotNull(next);
        mvc.perform(post("/auth/cookie/refresh").cookie(refresh,csrfCookie).header("X-XSRF-TOKEN",token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/cookie/logout").cookie(next,csrfCookie).header("X-XSRF-TOKEN",token)).andExpect(status().isOk());
        mvc.perform(post("/auth/cookie/refresh").cookie(next,csrfCookie).header("X-XSRF-TOKEN",token)).andExpect(status().isUnauthorized());
    }
    @Test void missingAuthorizationRequestAndCancelledCallbackFailSafely() throws Exception {
        mvc.perform(get("/login/oauth2/code/google").param("code","untrusted-code").param("state","invalid"))
            .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("http://localhost:5173/auth?oauth_error=authentication_failed"));
        mvc.perform(get("/login/oauth2/code/google").param("error","access_denied").param("state","invalid"))
            .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("http://localhost:5173/auth?oauth_error=authentication_failed"));
    }
    @Test void authorizationIncludesPkceAndNonceAndMismatchedStateIsRejected() throws Exception {
        var started=mvc.perform(get("/oauth2/authorization/google")).andExpect(status().is3xxRedirection()).andReturn();
        String destination=started.getResponse().getRedirectedUrl(); assertNotNull(destination);
        assertTrue(destination.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
        assertTrue(destination.contains("code_challenge=")); assertTrue(destination.contains("code_challenge_method=S256"));
        assertTrue(destination.contains("nonce=")); assertTrue(destination.contains("state="));
        mvc.perform(get("/login/oauth2/code/google").session((MockHttpSession)started.getRequest().getSession(false))
                .param("code","untrusted-code").param("state","mismatched-state"))
            .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("http://localhost:5173/auth?oauth_error=authentication_failed"));
    }
    @Test void passwordCookieLoginUsesBrowserCsrfContractAndRestoresProfile() throws Exception {
        var csrfResponse=mvc.perform(get("/auth/cookie/csrf")).andExpect(status().isOk()).andReturn().getResponse();
        String token=com.jayway.jsonpath.JsonPath.read(csrfResponse.getContentAsString(),"$.data.token");
        Cookie csrfCookie=csrfResponse.getCookie("XSRF-TOKEN"); assertNotNull(csrfCookie); assertTrue(csrfCookie.isHttpOnly());
        String email=unique()+"@example.com", password="password-123456";
        String registration="{\"email\":\""+email+"\",\"password\":\""+password+"\",\"fullName\":\"Password Customer\"}";
        mvc.perform(post("/auth/cookie/register").cookie(csrfCookie).header("X-XSRF-TOKEN",token)
            .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(registration)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.user.role").value("CUSTOMER")).andExpect(jsonPath("$.data.accessToken").doesNotExist());
        var login=mvc.perform(post("/auth/cookie/login").cookie(csrfCookie).header("X-XSRF-TOKEN",token)
            .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\""+password+"\"}"))
            .andExpect(status().isOk()).andReturn().getResponse();
        Cookie access=login.getCookie(AuthCookies.ACCESS), refresh=login.getCookie(AuthCookies.REFRESH); assertNotNull(access); assertNotNull(refresh);
        mvc.perform(get("/auth/me").cookie(access)).andExpect(status().isOk()).andExpect(jsonPath("$.data.email").value(email));
        var logout=mvc.perform(post("/auth/cookie/logout").cookie(csrfCookie,refresh).header("X-XSRF-TOKEN",token))
            .andExpect(status().isOk()).andReturn().getResponse();
        assertEquals(0,logout.getCookie(AuthCookies.ACCESS).getMaxAge()); assertEquals(0,logout.getCookie(AuthCookies.REFRESH).getMaxAge());
        mvc.perform(post("/auth/cookie/refresh").cookie(csrfCookie,refresh).header("X-XSRF-TOKEN",token)).andExpect(status().isUnauthorized());
    }
}
