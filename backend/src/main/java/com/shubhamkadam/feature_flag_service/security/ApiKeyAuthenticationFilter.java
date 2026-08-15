package com.shubhamkadam.feature_flag_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates requests to the evaluation API ({@code /api/v1/evaluate/**}) using
 * environment API keys supplied in the {@code X-Api-Key} header.
 *
 * <p>Verification steps:
 * <ol>
 *   <li>Extract the {@code X-Api-Key} header.</li>
 *   <li>Hash the plaintext key (SHA-256) and look up the environment by hash.</li>
 *   <li>Verify the {@code {environmentId}} path segment matches the resolved environment
 *       — prevents using a valid key from Environment A to query Environment B.</li>
 *   <li>Attach the resolved {@link Environment} to the request as an attribute
 *       ({@value #RESOLVED_ENVIRONMENT_ATTR}) so the controller can use it without
 *       an extra DB round-trip.</li>
 * </ol>
 *
 * <p>Any failure returns {@code 401} without revealing whether the environment exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    /** Request attribute name under which the authenticated {@link Environment} is stored. */
    public static final String RESOLVED_ENVIRONMENT_ATTR = "resolvedEnvironment";

    private static final String API_KEY_HEADER = "X-Api-Key";
    private static final String EVALUATE_PATH_PREFIX = "/api/v1/evaluate/";

    // ObjectMapper is not a Spring-managed bean in this context; instantiate directly.
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final EnvironmentRepository environmentRepository;
    private final ApiKeyGenerator apiKeyGenerator;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only intercept evaluation requests; all other paths skip this filter.
        return !request.getRequestURI().startsWith(EVALUATE_PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            log.warn(
                "Evaluation request rejected: missing {} header [uri={}]",
                API_KEY_HEADER,
                request.getRequestURI()
            );
            writeUnauthorized(response);
            return;
        }

        // Hash the supplied key and look up the matching environment.
        String keyHash = apiKeyGenerator.hashApiKey(apiKey);
        Environment environment = environmentRepository.findByApiKeyHashAndDeletedAtIsNull(keyHash).orElse(null);

        if (environment == null) {
            log.warn(
                "Evaluation request rejected: no active environment matches supplied API key [uri={}]",
                request.getRequestURI()
            );
            writeUnauthorized(response);
            return;
        }

        // Validate that the path environmentId matches the key's environment.
        // This prevents using env_staging_xxx to query /environments/<prod-uuid>/features/...
        UUID pathEnvironmentId = extractEnvironmentId(request.getRequestURI());
        if (pathEnvironmentId == null || !pathEnvironmentId.equals(environment.getId())) {
            log.warn(
                "Evaluation request rejected: API key environment {} does not match path environmentId {} [uri={}]",
                environment.getId(),
                pathEnvironmentId,
                request.getRequestURI()
            );
            writeUnauthorized(response);
            return;
        }

        // Auth passed — attach the resolved environment for zero-cost downstream access.
        request.setAttribute(RESOLVED_ENVIRONMENT_ATTR, environment);
        log.debug(
            "Evaluation request authenticated for environment {} [uri={}]",
            environment.getId(),
            request.getRequestURI()
        );

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the {@code {environmentId}} segment from an evaluation URI of the form:
     * {@code /api/v1/evaluate/environments/{environmentId}/features/{featureKey}}
     *
     * @return the parsed UUID, or {@code null} if the URI is malformed or UUID is invalid
     */
    private UUID extractEnvironmentId(String uri) {
        // URI shape: /api/v1/evaluate/environments/{environmentId}/features/{featureKey}
        // Segment index (split on /):  0  1    2       3              4        5
        try {
            String[] segments = uri.split("/");
            // segments[0]="" segments[1]="api" segments[2]="v1"
            // segments[3]="evaluate" segments[4]="environments" segments[5]={environmentId}
            if (segments.length < 6) {
                return null;
            }
            return UUID.fromString(segments[5]);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        OBJECT_MAPPER.writeValue(response.getWriter(), Map.of("status", 401, "message", "Invalid or missing API key"));
    }
}
