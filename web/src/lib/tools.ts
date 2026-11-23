import { tool } from "ai";
import { z } from "zod";
import { springGet } from "@/lib/springApi";

// The agent's tools. The model never sees this code — only each tool's NAME, its
// DESCRIPTION and the descriptions of its PARAMETERS. From those alone it decides whether
// to call a tool, which one, and with what. So the texts below are prompts, not comments.
//
// Every description answers the same four questions:
//   1. When to call it      — the kinds of user questions it is for
//   2. What comes back      — so the model knows whether the answer will be in there
//   3. When NOT to call it  — the neighbouring tool, or "you already have this"
//   4. Where the IDs come from — the page context or another tool, never the user

// ---- Shapes of the Spring responses (only the fields we pass on) ----

type TripResponse = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  baseCurrency: string;
  status: string;
};

type DayResponse = {
  id: string;
  dayNumber: number;
  date: string | null;
  city: string | null;
  overnightStay: string | null;
  notes: string | null;
  isBuffer: boolean;
  activityCount: number;
};

type ActivityResponse = {
  name: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  address: string | null;
  placeName: string | null;
  costEstimate: number | null;
  costCurrency: string | null;
  notes: string | null;
  needsBooking: boolean;
  bookingDepartureAt: string | null;
  bookingArrivalAt: string | null;
  travelMode: string | null;
  travelSeconds: number | null;
  travelMeters: number | null;
};

// Results are trimmed to what helps an answer. Spring's day response also holds route
// geometry — hundreds of coordinates that would cost tokens and tell the model nothing.
function dayInfo(d: DayResponse) {
  return {
    dayId: d.id,
    dayNumber: d.dayNumber,
    date: d.date,
    city: d.city,
    overnightStay: d.overnightStay,
    isReserveDay: d.isBuffer,
    stopCount: d.activityCount,
    notes: d.notes,
  };
}

function stopInfo(a: ActivityResponse) {
  return {
    name: a.placeName ?? a.name,
    type: a.type,
    startTime: a.startTime,
    endTime: a.endTime,
    address: a.address,
    cost: a.costEstimate != null ? `${a.costEstimate} ${a.costCurrency ?? ""}`.trim() : null,
    needsBooking: a.needsBooking,
    departure: a.bookingDepartureAt,
    arrival: a.bookingArrivalAt,
    notes: a.notes,
    toNextStop:
      a.travelSeconds != null
        ? { mode: a.travelMode, minutes: Math.round(a.travelSeconds / 60), km: Math.round((a.travelMeters ?? 0) / 100) / 10 }
        : null,
  };
}

/** The tools for one request, bound to the signed-in user's token. */
export function createTools(token: string | null) {
  return {
    get_trip: tool({
      description:
        "Read the overview of one of the user's trips: title, destination, start and end dates, " +
        "status, currency, and the list of days — for each day its number, date, city, where the " +
        "user sleeps, whether it is a reserve day, and how many stops are planned (not the stops " +
        "themselves).\n" +
        "Use it for questions about the trip as a whole: dates and length, which cities on which " +
        "days, which days are still empty, where the user stays. Also use it to find the dayId of " +
        "a day the user names by number, date or city (\"day 3\", \"on Friday\", \"in Krabi\").\n" +
        "Do not use it to see what happens during a day — call get_day for that. Do not call it " +
        "again if this conversation already has the overview and nothing has changed.",
      inputSchema: z.object({
        tripId: z
          .uuid()
          .describe(
            "The trip's ID. When the user says \"my trip\" or \"this trip\", take the current trip's " +
              "tripId from the page context. Never ask the user for an ID and never make one up.",
          ),
      }),
      execute: async ({ tripId }) => {
        const [trip, days] = await Promise.all([
          springGet<TripResponse>(`/api/trips/${tripId}`, token),
          springGet<DayResponse[]>(`/api/trips/${tripId}/days`, token),
        ]);
        return {
          tripId: trip.id,
          title: trip.title,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          status: trip.status,
          currency: trip.baseCurrency,
          days: days.map(dayInfo),
        };
      },
    }),

    get_day: tool({
      description:
        "Read one day of a trip in detail: its date, city and overnight stay, and every stop in " +
        "order — name, type, start and end time, address, estimated cost, whether it still needs " +
        "booking, flight or transfer departure and arrival times, notes, and how the user gets to " +
        "the next stop (mode, minutes, km).\n" +
        "Use it for questions about what happens on a particular day: \"what's on today\", \"when " +
        "do I leave for the airport\", \"is there time for lunch\", \"what still needs booking on " +
        "day 2\", \"how far is it between my stops\".\n" +
        "Reads one day per call; to compare several days, call it once per day. For the trip's " +
        "overall dates and cities use get_trip instead.",
      inputSchema: z.object({
        tripId: z
          .uuid()
          .describe("The ID of the trip the day belongs to — the current trip's tripId from the page context."),
        dayId: z
          .uuid()
          .describe(
            "The day's ID. For \"today\" or \"this day\", the current dayId from the page context. For " +
              "a day the user names by number, date or city, look its dayId up with get_trip first. " +
              "Never ask the user for an ID and never make one up.",
          ),
      }),
      execute: async ({ tripId, dayId }) => {
        const [days, stops] = await Promise.all([
          springGet<DayResponse[]>(`/api/trips/${tripId}/days`, token),
          springGet<ActivityResponse[]>(`/api/days/${dayId}/itinerary`, token),
        ]);
        const day = days.find((d) => d.id === dayId);
        if (!day) throw new Error("This day is not part of that trip.");
        return { ...dayInfo(day), stops: stops.map(stopInfo) };
      },
    }),
  };
}
