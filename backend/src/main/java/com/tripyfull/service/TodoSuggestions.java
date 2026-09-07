package com.tripyfull.service;

import java.util.List;

/**
 * The to-dos most trips share. Each carries a day offset: negative counts back
 * from departure ("check the passport two months out"), positive counts from
 * the trip's end (the things you do once you are home). The list is deliberately
 * short and plain — it is a starting point the owner prunes, not a checklist to
 * be obeyed.
 */
public final class TodoSuggestions {

    private TodoSuggestions() {}

    /** @param offsetDays days relative to departure; {@code afterEnd} shifts the anchor to the last day */
    public record Template(String key, String title, String group, String why, int offsetDays, boolean afterEnd) {}

    private static Template before(String key, String title, String group, String why, int daysBefore) {
        return new Template(key, title, group, why, -daysBefore, false);
    }

    private static Template after(String key, String title, String group, String why, int daysAfter) {
        return new Template(key, title, group, why, daysAfter, true);
    }

    public static final List<Template> ALL = List.of(
            // Documents
            before("passport-validity", "Check passport validity", "Documents",
                    "Many countries want six months left on entry.", 60),
            before("entry-rules", "Check visa / entry rules", "Documents",
                    "Rules change; an e-visa can take a couple of weeks.", 45),
            before("insurance", "Buy travel insurance", "Documents",
                    "Medical cover abroad, cancellation, lost luggage.", 21),
            before("document-copies", "Photograph passport, tickets, insurance", "Documents",
                    "A copy in the cloud and one with a person at home.", 3),
            // Money
            before("notify-bank", "Tell the bank where you are going", "Money",
                    "So the card is not blocked on the first foreign payment.", 7),
            before("cash", "Get some local cash", "Money",
                    "Small places, markets and taxis often take cash only.", 2),
            before("card-limits", "Check card limits and fees abroad", "Money",
                    "Raise the daily limit; know the foreign-currency fee.", 7),
            // Health
            before("vaccinations", "Check vaccinations", "Health",
                    "Some need weeks to take effect.", 45),
            before("prescriptions", "Stock up on prescription medicine", "Health",
                    "Enough for the whole trip plus a few days.", 7),
            before("first-aid", "Pack a small first-aid kit", "Health",
                    "Painkillers, plasters, stomach tablets, sunscreen.", 2),
            // Bookings
            before("airport-transfer", "Sort the transfer from the airport", "Bookings",
                    "Know how you get to the first hotel before you land.", 7),
            before("online-checkin", "Check in online", "Bookings",
                    "Usually opens 24–48 hours before the flight.", 1),
            before("confirmations", "Save all confirmations offline", "Bookings",
                    "Screenshots or PDFs — airports have bad signal.", 1),
            // Tech
            before("esim", "Set up an eSIM or roaming", "Tech",
                    "Cheaper arranged at home than at the airport.", 5),
            before("offline-maps", "Download offline maps", "Tech",
                    "The destination area and the first city, at least.", 2),
            before("chargers", "Pack chargers and a plug adapter", "Tech",
                    "Check the socket type of the country.", 2),
            // Home
            before("home-plants-mail", "Arrange plants, pets and mail", "Home",
                    "Someone to water, feed and empty the letterbox.", 5),
            before("home-fridge", "Empty the fridge, take out the rubbish", "Home",
                    "Nothing rotting for three weeks.", 0),
            // Packing
            before("packing-list", "Write the packing list", "Packing",
                    "Weather at the destination, not at home.", 7),
            before("pack", "Pack", "Packing",
                    "The night before is too late for missing items.", 2),
            // After
            after("expenses", "Sort receipts and close the budget", "After",
                    "While the receipts are still in the bag.", 3),
            after("photos", "Back up the photos", "After",
                    "Before the phone is full again.", 7)
    );
}
