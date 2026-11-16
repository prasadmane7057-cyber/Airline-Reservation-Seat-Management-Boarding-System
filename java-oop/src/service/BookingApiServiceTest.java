package service;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import model.Booking;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

public final class BookingApiServiceTest {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<String> createBody = new AtomicReference<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        server.createContext("/api/bookings", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            if ("POST".equals(exchange.getRequestMethod())) {
                createBody.set(readBody(exchange));
                respond(exchange, 201,
                        "{\"success\":true,\"booking\":{\"id\":42,\"pnr\":\"AB12CD34EF\","
                                + "\"booking_status\":\"CONFIRMED\",\"fare\":5000,"
                                + "\"seat_number\":\"12A\",\"flight_number\":\"AI101\"}}");
            } else {
                respond(exchange, 200,
                        "{\"success\":true,\"booking\":{\"id\":42,\"pnr\":\"AB12CD34EF\","
                                + "\"booking_status\":\"CONFIRMED\"}}");
            }
        });
        server.createContext("/api/bookings/", exchange -> respond(exchange, 200,
                "{\"success\":true,\"booking\":{\"id\":42,\"pnr\":\"AB12CD34EF\","
                        + "\"booking_status\":\"CONFIRMED\"}}"));
        server.createContext("/api/boarding/checkin", exchange -> respond(exchange, 200, "{\"success\":true}"));
        server.createContext("/api/boarding/verify", exchange -> respond(exchange, 200, "{\"success\":true}"));
        server.start();

        try {
            String url = "http://127.0.0.1:" + server.getAddress().getPort() + "/api";
            AirlineApiClient client = new AirlineApiClient(url, "test-access-token", HttpClient.newHttpClient());
            BookingApiService service = new BookingApiService(client);
            Booking booking = new Booking("Ada Lovelace", "AI101", "12A", "2026-11-16");

            service.createBooking(booking, 7, 4, 30, "Economy");
            check("backend PNR synchronized", "AB12CD34EF".equals(booking.getPnr()));
            check("backend booking ID synchronized", "42".equals(booking.getBookingId()));
            check("backend fare synchronized", booking.getFare() == 5000.0);
            check("access token sent as bearer credential",
                    "Bearer test-access-token".equals(authorization.get()));
            check("seat and passenger IDs sent", createBody.get().contains("\"passengerId\":7")
                    && createBody.get().contains("\"seatId\":30"));

            service.checkIn(booking);
            service.verifyBoarding(booking);
            check("boarding status synchronized only after API success", "BOARDED".equals(booking.getStatus()));
            check("server PNR validation succeeds", service.validatePnr("AB12CD34EF"));
        } finally {
            server.stop(0);
        }
        System.out.println("All Java backend API integration checks passed.");
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] response = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.close();
    }

    private static void check(String label, boolean condition) {
        if (!condition) throw new AssertionError(label);
    }
}
