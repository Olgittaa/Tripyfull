package com.tripyfull.repository;

import com.tripyfull.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByTripIdOrderByNameAsc(UUID tripId);

    /**
     * Drops stored exchange rates on every booking the user owns. Stored rates
     * convert "priceCurrency -> user's base at fill time", so they all go stale
     * the moment the base currency changes; clearing lets auto-fill / live budget
     * rates re-resolve against the new base.
     */
    @Modifying
    @Query("update Booking b set b.exchangeRate = null where b.trip.owner.id = :ownerId")
    int clearExchangeRatesForOwner(@Param("ownerId") Long ownerId);
}
