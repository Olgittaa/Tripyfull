package com.tripyfull.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    // columnDefinition stops Hibernate emitting a value CHECK constraint, so adding
    // new enum values later never breaks inserts under ddl-auto=update.
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(32)")
    private PlaceType type = PlaceType.OTHER;

    @Column(length = 2)
    private String country;   // ISO 3166-1 alpha-2, e.g. "GR"

    private String city;

    private String address;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 2000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "place_photos", joinColumns = @JoinColumn(name = "place_id"))
    @Column(name = "url", length = 1000)
    private List<String> photos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "place_links", joinColumns = @JoinColumn(name = "place_id"))
    @Column(name = "url", length = 1000)
    private List<String> links = new ArrayList<>();

    /** OSM identifier (e.g. "N123", "W456") used to deduplicate geocoded results. */
    @Column(name = "osm_id")
    private String osmId;

    /**
     * Planning rating 1–5: 5 = worth the whole trip, 4 = big detour OK,
     * 3 = small detour, 2 = only if on the way, 1 = maybe skip.
     */
    @Column(nullable = false)
    private int rating = 3;

    /** Why this rating (e.g. "iconic view, but 2h queue"). */
    @Column(name = "rating_comment", length = 500)
    private String ratingComment;

    /** Typical time to visit, in minutes — feeds day-capacity planning. */
    @Column(name = "visit_minutes")
    private Integer visitMinutes;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(8)", nullable = false)
    private PlaceAudience audience = PlaceAudience.ALL;

    /** Needs special preparation (gear, fitness, permits). */
    @Column(name = "needs_preparation", nullable = false)
    private boolean needsPreparation = false;

    /** Requires advance booking (tours, shows, popular restaurants). */
    @Column(name = "needs_booking", nullable = false)
    private boolean needsBooking = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PlaceVisibility visibility = PlaceVisibility.PRIVATE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PlaceSource source = PlaceSource.MANUAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // Nullable so adding the column to an existing (non-empty) table doesn't fail on update.
    @Column(updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public PlaceType getType() { return type; }
    public void setType(PlaceType type) { this.type = type; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { this.photos = photos; }
    public List<String> getLinks() { return links; }
    public void setLinks(List<String> links) { this.links = links; }
    public String getOsmId() { return osmId; }
    public void setOsmId(String osmId) { this.osmId = osmId; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getRatingComment() { return ratingComment; }
    public void setRatingComment(String ratingComment) { this.ratingComment = ratingComment; }
    public Integer getVisitMinutes() { return visitMinutes; }
    public void setVisitMinutes(Integer visitMinutes) { this.visitMinutes = visitMinutes; }
    public PlaceAudience getAudience() { return audience; }
    public void setAudience(PlaceAudience audience) { this.audience = audience; }
    public boolean isNeedsPreparation() { return needsPreparation; }
    public void setNeedsPreparation(boolean needsPreparation) { this.needsPreparation = needsPreparation; }
    public boolean isNeedsBooking() { return needsBooking; }
    public void setNeedsBooking(boolean needsBooking) { this.needsBooking = needsBooking; }
    public PlaceVisibility getVisibility() { return visibility; }
    public void setVisibility(PlaceVisibility visibility) { this.visibility = visibility; }
    public PlaceSource getSource() { return source; }
    public void setSource(PlaceSource source) { this.source = source; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
