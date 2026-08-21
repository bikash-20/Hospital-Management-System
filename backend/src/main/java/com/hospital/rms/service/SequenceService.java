package com.hospital.rms.service;

import com.hospital.rms.entity.SequenceCounter;
import com.hospital.rms.repository.SequenceCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SequenceService {

    private final SequenceCounterRepository sequenceCounterRepository;

    /**
     * Allocates a value while holding a database row lock for this key.
     * <p>The JPA {@code @Lock(PESSIMISTIC_WRITE)} on the repository is the
     * actual serialization mechanism — it works across multiple JVM instances
     * (whereas {@code synchronized} would not). The DB lock is sufficient.
     */
    @Transactional
    public long next(String key, long minimumCurrentValue) {
        SequenceCounter counter = sequenceCounterRepository.findBySequenceKey(key)
            .orElseGet(() -> SequenceCounter.builder()
                .sequenceKey(key)
                .currentValue(minimumCurrentValue)
                .build());

        if (counter.getCurrentValue() < minimumCurrentValue) {
            counter.setCurrentValue(minimumCurrentValue);
        }

        counter.setCurrentValue(counter.getCurrentValue() + 1);
        return sequenceCounterRepository.save(counter).getCurrentValue();
    }
}