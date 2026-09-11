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

    /**
     * Set when the stop was generated from a booking, which then owns it: the
     * next sync rewrites its stops and leaves hand-made ones alone.
     */
    @Column(name = "source_booking_id")
    private UUID sourceBookingId;

    /** Own coordinates, for a stop that is on the map without being a saved place. */
    private Double latitude;
    private Double longitude;

    /* The leg to the next stop, computed on the server and kept here (see
       TravelLegService). The key names what it was computed for — mode and
       both endpoints — so a changed order, pin or mode is noticed; a key with
       null seconds means no route exists between the two. */
    @Column(name = "travel_key", length = 160)
    private String travelKey;
    @Column(name = "travel_seconds")
    private Integer travelSeconds;
    @Column(name = "travel_meters")
    private Integer travelMeters;
    @Column(name = "travel_geometry", columnDefinition = "text")
    private String travelGeometry;
    @Column(name = "travel_estimated", nullable = false)
    private boolean travelEstimated = false;

    public UUID getId() { return id; }

    public UUID getSourceBookingId() { return sourceBookingId; }
    public void setSourceBookingId(UUID sourceBookingId) { this.sourceBookingId = sourceBookingId; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public String getTravelKey() { return travelKey; }
    public void setTravelKey(String travelKey) { this.travelKey = travelKey; }
    public Integer getTravelSeconds() { return travelSeconds; }
    public void setTravelSeconds(Integer travelSeconds) { this.travelSeconds = travelSeconds; }
    public Integer getTravelMeters() { return travelMeters; }
    public void setTravelMeters(Integer travelMeters) { this.travelMeters = travelMeters; }
    public String getTravelGeometry() { return travelGeometry; }
    public void setTravelGeometry(String travelGeometry) { this.travelGeometry = travelGeometry; }
    public boolean isTravelEstimated() { return travelEstimated; }
    public void setTravelEstimated(boolean travelEstimated) { this.travelEstimated = travelEstimated; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

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
