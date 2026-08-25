package com.tripyfull.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "days")
public class Day {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private LocalDate date;

    private String city;

    private String overnightStay;

    @Column(name = "linked_booking_id")
    private UUID linkedBookingId;

    @Column(length = 1000)
    private String notes;

    /** Buffer day: intentionally left unplanned (weather, rest, spontaneous finds). */
    @Column(name = "is_buffer", nullable = false)
    private boolean isBuffer = false;

    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, id ASC")
    private List<Activity> activities = new ArrayList<>();

    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Expense> expenses = new ArrayList<>();

    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getOvernightStay() { return overnightStay; }
    public void setOvernightStay(String overnightStay) { this.overnightStay = overnightStay; }
    public UUID getLinkedBookingId() { return linkedBookingId; }
    public void setLinkedBookingId(UUID linkedBookingId) { this.linkedBookingId = linkedBookingId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public boolean isBuffer() { return isBuffer; }
    public void setBuffer(boolean buffer) { this.isBuffer = buffer; }
    public List<Activity> getActivities() { return activities; }
    public List<Expense> getExpenses() { return expenses; }
}
