package com.shubhamkadam.feature_flag_service.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);
}
