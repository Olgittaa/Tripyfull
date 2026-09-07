package com.tripyfull.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One thing to do for a trip — before it, during it, or after. */
@Entity
@Table(name = "todos")
public class TodoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @NotBlank
    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 2000)
    private String notes;

    /** Free text; the owner decides how the list is grouped. */
    @Column(name = "group_name", length = 80)
    private String groupName;

    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean done = false;

    @Column(nullable = false)
    private int orderIndex;

    /** Set when the item came from the built-in suggestions; keeps it from being offered again. */
    @Column(name = "template_key", length = 80)
    private String templateKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public String getTemplateKey() { return templateKey; }
    public void setTemplateKey(String templateKey) { this.templateKey = templateKey; }
    public Instant getCreatedAt() { return createdAt; }
}
