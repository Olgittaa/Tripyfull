package com.tripyfull.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private ActivityType type;

    private LocalTime startTime;
    private LocalTime endTime;

    private String address;

    @Column(precision = 10, scale = 2)
    private BigDecimal costEstimate;

    @Column(length = 3)
    private String costCurrency;

    @Column(length = 2000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(nullable = false)
    private int orderIndex;

    /** How to travel to the day's next mapped stop: foot | taxi | bus | train | car | plane. */
    @Column(length = 8)
    private String travelModeToNext;

    /** Requires advance booking (tours, shows) — surface a reminder before the date. */
    @Column(name = "needs_booking", nullable = false)
    private boolean needsBooking = false;

    public UUID getId() { return id; }
    public Day getDay() { return day; }
    public void setDay(Day day) { this.day = day; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getCostEstimate() { return costEstimate; }
    public void setCostEstimate(BigDecimal costEstimate) { this.costEstimate = costEstimate; }
    public String getCostCurrency() { return costCurrency; }
    public void setCostCurrency(String costCurrency) { this.costCurrency = costCurrency; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Place getPlace() { return place; }
    public void setPlace(Place place) { this.place = place; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public String getTravelModeToNext() { return travelModeToNext; }
    public void setTravelModeToNext(String travelModeToNext) { this.travelModeToNext = travelModeToNext; }
    public boolean isNeedsBooking() { return needsBooking; }
    public void setNeedsBooking(boolean needsBooking) { this.needsBooking = needsBooking; }
}
