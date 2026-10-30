package com.clinicify.repository;

import com.clinicify.model.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTokenRepository extends JpaRepository<QueueToken, Long> {

    @Query("SELECT COALESCE(MAX(t.tokenNumber), 100) FROM QueueToken t WHERE t.queueDate = :queueDate")
    Integer findMaxTokenNumber(@Param("queueDate") LocalDate queueDate);

    List<QueueToken> findByQueueDateOrderByPriorityFlagDescTokenNumberAsc(LocalDate queueDate);

    Optional<QueueToken> findByQueueDateAndQueueStatus(LocalDate queueDate, QueueToken.QueueStatus status);

    @Query("SELECT t FROM QueueToken t WHERE t.queueDate = :queueDate AND t.queueStatus = :status ORDER BY t.priorityFlag DESC, t.tokenNumber ASC")
    List<QueueToken> findActiveWaitingQueue(@Param("queueDate") LocalDate queueDate, @Param("status") QueueToken.QueueStatus status);

    Optional<QueueToken> findFirstByQueueDateAndQueueStatusOrderByPriorityFlagDescTokenNumberAsc(
            LocalDate queueDate, QueueToken.QueueStatus status
    );

    Optional<QueueToken> findByVisit_VisitId(Long visitId);
}

