package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private BookingCategory category;

    private String vendor;
    private String confirmationNumber;

    @Column(length = 500)
    private String bookingUrl;

    @Column(precision = 10, scale = 2)
    private BigDecimal fullPrice;

    @Column(length = 3)
    private String priceCurrency;

    @Column(precision = 12, scale = 6)
    private BigDecimal exchangeRate;

    @Column(length = 2000)
    private String notes;

    @Column(name = "linked_day_id")
    private UUID linkedDayId;

    // Transport fields
    private String flightNumber;
    private String fromPlace;
    private String toPlace;
    private LocalDateTime departureAt;
    private LocalDateTime arrivalAt;

    @Enumerated(EnumType.STRING)
    private TransportMode transportMode;

    // Flight specifics (mostly auto-filled by AeroDataBox)
    @Column(length = 8)
    private String fromIata;
    @Column(length = 8)
    private String toIata;
    private String departureTerminal;
    private String arrivalTerminal;
    private String seat;

    // Ferry specifics
    private String vesselName;
    private String cabin;        // seat type / cabin class

    // Car rental specifics
    private String carClass;     // class or model

    // Accommodation fields
    private String accommodationCity;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String roomType;
    private Integer guests;

    // Geocoded location (accommodation / places) — lat/lng auto-filled from name + city
    @Column(length = 500)
    private String address;
    private Double latitude;
    private Double longitude;

    private boolean paidSimple;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("uploadedAt ASC")
    private List<Attachment> attachments = new ArrayList<>();

    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BookingCategory getCategory() { return category; }
    public void setCategory(BookingCategory category) { this.category = category; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public String getConfirmationNumber() { return confirmationNumber; }
    public void setConfirmationNumber(String confirmationNumber) { this.confirmationNumber = confirmationNumber; }
    public String getBookingUrl() { return bookingUrl; }
    public void setBookingUrl(String bookingUrl) { this.bookingUrl = bookingUrl; }
    public BigDecimal getFullPrice() { return fullPrice; }
    public void setFullPrice(BigDecimal fullPrice) { this.fullPrice = fullPrice; }
    public String getPriceCurrency() { return priceCurrency; }
    public void setPriceCurrency(String priceCurrency) { this.priceCurrency = priceCurrency; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public UUID getLinkedDayId() { return linkedDayId; }
    public void setLinkedDayId(UUID linkedDayId) { this.linkedDayId = linkedDayId; }
    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
    public String getFromPlace() { return fromPlace; }
    public void setFromPlace(String fromPlace) { this.fromPlace = fromPlace; }
    public String getToPlace() { return toPlace; }
    public void setToPlace(String toPlace) { this.toPlace = toPlace; }
    public LocalDateTime getDepartureAt() { return departureAt; }
    public void setDepartureAt(LocalDateTime departureAt) { this.departureAt = departureAt; }
    public LocalDateTime getArrivalAt() { return arrivalAt; }
    public void setArrivalAt(LocalDateTime arrivalAt) { this.arrivalAt = arrivalAt; }
    public TransportMode getTransportMode() { return transportMode; }
    public void setTransportMode(TransportMode transportMode) { this.transportMode = transportMode; }
    public String getFromIata() { return fromIata; }
    public void setFromIata(String fromIata) { this.fromIata = fromIata; }
    public String getToIata() { return toIata; }
    public void setToIata(String toIata) { this.toIata = toIata; }
    public String getDepartureTerminal() { return departureTerminal; }
    public void setDepartureTerminal(String departureTerminal) { this.departureTerminal = departureTerminal; }
    public String getArrivalTerminal() { return arrivalTerminal; }
    public void setArrivalTerminal(String arrivalTerminal) { this.arrivalTerminal = arrivalTerminal; }
    public String getSeat() { return seat; }
    public void setSeat(String seat) { this.seat = seat; }
    public String getVesselName() { return vesselName; }
    public void setVesselName(String vesselName) { this.vesselName = vesselName; }
    public String getCabin() { return cabin; }
    public void setCabin(String cabin) { this.cabin = cabin; }
    public String getCarClass() { return carClass; }
    public void setCarClass(String carClass) { this.carClass = carClass; }
    public String getAccommodationCity() { return accommodationCity; }
    public void setAccommodationCity(String accommodationCity) { this.accommodationCity = accommodationCity; }
    public LocalDate getCheckIn() { return checkIn; }
    public void setCheckIn(LocalDate checkIn) { this.checkIn = checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public void setCheckOut(LocalDate checkOut) { this.checkOut = checkOut; }
    public LocalTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalTime checkInTime) { this.checkInTime = checkInTime; }
    public LocalTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalTime checkOutTime) { this.checkOutTime = checkOutTime; }
    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public Integer getGuests() { return guests; }
    public void setGuests(Integer guests) { this.guests = guests; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public boolean isPaidSimple() { return paidSimple; }
    public void setPaidSimple(boolean paidSimple) { this.paidSimple = paidSimple; }
    public List<Payment> getPayments() { return payments; }
    public List<Attachment> getAttachments() { return attachments; }
}
