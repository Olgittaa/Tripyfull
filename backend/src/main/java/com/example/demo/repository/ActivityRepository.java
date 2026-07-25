package com.example.demo.repository;

import com.example.demo.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    // Manual order is the source of truth (drag-and-drop); id breaks legacy ties.
    List<Activity> findByDayIdOrderByOrderIndexAscIdAsc(UUID dayId);
}
