package com.storage.account.service;
import com.storage.account.dto.*;
import com.storage.account.entity.*;
import com.storage.account.repository.*;
import com.storage.shared.exception.*;
import com.storage.shared.security.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service public class AuthService {
 private final UserRepository users; private final ActivityLogRepository logs; private final PasswordEncoder encoder; private final JwtTokenProvider jwt; private final AuthenticationManager authenticationManager;
 public AuthService(UserRepository users,ActivityLogRepository logs,PasswordEncoder encoder,JwtTokenProvider jwt,AuthenticationManager authenticationManager){this.users=users;this.logs=logs;this.encoder=encoder;this.jwt=jwt;this.authenticationManager=authenticationManager;}
 @Transactional public AuthResponse register(RegisterRequest r){ if(users.existsByEmail(r.email().toLowerCase().trim())) throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS); User u=new User();u.setEmail(r.email().toLowerCase().trim());u.setPasswordHash(encoder.encode(r.password()));u.setFullName(r.fullName().trim());u.setPhone(r.phone());u.setRole(UserRole.CUSTOMER);u=users.save(u); return response(u, UserPrincipal.create(u)); }
 @Transactional public AuthResponse login(LoginRequest r){ try { Authentication a=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(r.email().toLowerCase().trim(),r.password())); User u=users.findByEmail(r.email().toLowerCase().trim()).orElseThrow(()->new NotFoundException(ErrorCode.USER_NOT_FOUND)); log(u,"LOGIN_SUCCESS"); return response(u,(UserPrincipal)a.getPrincipal()); } catch(BadCredentialsException e){ throw new BusinessException(ErrorCode.INVALID_CREDENTIALS); } }
 @Transactional(readOnly=true) public UserDto me(String email){return UserDto.from(users.findByEmail(email).orElseThrow(()->new NotFoundException(ErrorCode.USER_NOT_FOUND)));}
 private AuthResponse response(User u,UserPrincipal p){ Authentication a=new UsernamePasswordAuthenticationToken(p,null,p.getAuthorities());return new AuthResponse(jwt.generateAccessToken(a),jwt.generateRefreshToken(u.getEmail(),u.getId()),"Bearer",86400000L,UserDto.from(u)); }
 private void log(User u,String action){ActivityLog l=new ActivityLog();l.setUserId(u.getId());l.setAction(action);l.setDescription("Authentication event");logs.save(l);}
}
