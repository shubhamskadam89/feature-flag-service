package com.shubhamkadam.feature_flag_service.security;

import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class ApiKeyGenerator {

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final int KEY_LENGTH_BYTES = 32;

    public ApiKeyResult generateApiKey(String environmentName) {
        // Sanitize environment name for prefix (alphanumeric, lowercase, max 10 chars)
        String sanitizedName = environmentName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        if (sanitizedName.length() > 10) {
            sanitizedName = sanitizedName.substring(0, 10);
        }
        
        String prefix = "env_" + sanitizedName + "_";
        
        byte[] randomBytes = new byte[KEY_LENGTH_BYTES];
        secureRandom.nextBytes(randomBytes);
        String randomSuffix = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        
        String plaintextKey = prefix + randomSuffix;
        String hash = hashApiKey(plaintextKey);
        
        return new ApiKeyResult(plaintextKey, prefix, hash);
    }

    public String hashApiKey(String plaintextKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(plaintextKey.getBytes());
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public static class ApiKeyResult {
        private final String plaintextKey;
        private final String prefix;
        private final String hash;

        public ApiKeyResult(String plaintextKey, String prefix, String hash) {
            this.plaintextKey = plaintextKey;
            this.prefix = prefix;
            this.hash = hash;
        }

        public String getPlaintextKey() {
            return plaintextKey;
        }

        public String getPrefix() {
            return prefix;
        }

        public String getHash() {
            return hash;
        }
    }
}
