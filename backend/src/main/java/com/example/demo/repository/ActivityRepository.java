package com.example.demo.repository;

import com.example.demo.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByDayIdOrderByStartTimeAscOrderIndexAsc(UUID dayId);
    int countByDayId(UUID dayId);
}
