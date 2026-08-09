package com.shubhamkadam.feature_flag_service.config;

import com.shubhamkadam.feature_flag_service.security.OrganizationContextInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final OrganizationContextInterceptor organizationContextInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry
            .addInterceptor(organizationContextInterceptor)
            .addPathPatterns("/api/v1/**")
            .excludePathPatterns("/api/v1/auth/**", "/api/v1/evaluation/**");
    }
}
