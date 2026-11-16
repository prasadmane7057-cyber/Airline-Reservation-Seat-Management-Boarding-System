package service;

import model.Booking;
import model.Passenger;

import java.io.IOException;

public final class BookingApiService {
    private final AirlineApiClient api;

    public BookingApiService(AirlineApiClient api) {
        if (api == null) throw new IllegalArgumentException("Airline API client is required.");
        this.api = api;
    }

    public String createPassenger(Passenger passenger) throws IOException, InterruptedException {
        String response = api.createPassenger(passenger);
        String id = AirlineApiClient.jsonField(response, "id");
        if (id == null) throw new IOException("Airline API response did not include a passenger ID.");
        passenger.setId(id);
        return response;
    }

    public String createBooking(
            Booking booking,
            Passenger passenger,
            long flightId,
            long seatId,
            String travelClass
    ) throws IOException, InterruptedException {
        if (passenger == null || passenger.getId() == null) {
            throw new IllegalArgumentException("Passenger must be synchronized with the backend first.");
        }
        try {
            return createBooking(booking, Long.parseLong(passenger.getId()), flightId, seatId, travelClass);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Passenger ID must be the numeric backend ID.", exception);
        }
    }

    public String createBooking(
            Booking booking,
            long passengerId,
            long flightId,
            long seatId,
            String travelClass
    ) throws IOException, InterruptedException {
        requireBooking(booking);
        String response = api.createBooking(passengerId, flightId, seatId, travelClass);
        synchronizeBooking(booking, response);
        return response;
    }

    public String retrieveBooking(Booking booking, String idOrPnr)
            throws IOException, InterruptedException {
        requireBooking(booking);
        String response = api.getBooking(idOrPnr);
        synchronizeBooking(booking, response);
        return response;
    }

    public boolean validatePnr(String pnr) throws IOException, InterruptedException {
        String response = api.searchByPnr(pnr);
        return pnr.equalsIgnoreCase(AirlineApiClient.jsonField(response, "pnr"));
    }

    public String cancelBooking(Booking booking) throws IOException, InterruptedException {
        requireBooking(booking);
        String identifier = booking.getPnr();
        if (identifier == null || identifier.trim().isEmpty()) identifier = booking.getBookingId();
        String response = api.cancelBooking(identifier);
        booking.setStatus("CANCELLED");
        return response;
    }

    public String checkIn(Booking booking) throws IOException, InterruptedException {
        requireBooking(booking);
        return api.checkIn(booking.getPnr());
    }

    public String verifyBoarding(Booking booking) throws IOException, InterruptedException {
        requireBooking(booking);
        if (!booking.canBoard()) {
            throw new IllegalStateException("Only a confirmed, not-yet-boarded booking can board.");
        }
        if (booking.getSeatNumber() == null || booking.getSeatNumber().trim().isEmpty()) {
            throw new IllegalStateException("A seat number is required for boarding verification.");
        }
        String response = api.verifyBoarding(booking.getPnr(), booking.getSeatNumber());
        booking.confirmBoarding();
        return response;
    }

    private static void synchronizeBooking(Booking booking, String response) throws IOException {
        String pnr = AirlineApiClient.jsonField(response, "pnr");
        String id = AirlineApiClient.jsonField(response, "id");
        String status = AirlineApiClient.jsonField(response, "booking_status");
        String fare = AirlineApiClient.jsonField(response, "fare");
        String seatNumber = AirlineApiClient.jsonField(response, "seat_number");
        String flightNumber = AirlineApiClient.jsonField(response, "flight_number");
        if (pnr == null || id == null) {
            throw new IOException("Airline API response did not include a booking ID and PNR.");
        }
        booking.setPnr(pnr);
        booking.setBookingId(id);
        if (status != null) booking.setStatus(status);
        if (seatNumber != null) booking.setSeatNumber(seatNumber);
        if (flightNumber != null) booking.setFlightNumber(flightNumber);
        if (fare != null) {
            try {
                booking.setFare(Double.parseDouble(fare));
            } catch (NumberFormatException exception) {
                throw new IOException("Airline API returned an invalid fare.", exception);
            }
        }
    }

    private static void requireBooking(Booking booking) {
        if (booking == null) throw new IllegalArgumentException("Booking is required.");
        if (booking.getPnr() == null || booking.getPnr().trim().isEmpty()) {
            throw new IllegalArgumentException("Booking PNR is required.");
        }
    }
}
