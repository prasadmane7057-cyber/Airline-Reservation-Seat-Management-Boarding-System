package service;

import model.Passenger;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Pattern;

public final class AirlineApiClient {
    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z0-9-]{1,80}");

    private final String baseUrl;
    private final String accessToken;
    private final HttpClient http;

    public AirlineApiClient() throws IOException {
        this(environment("AIRLINE_API_URL", "http://localhost:5000/api"),
                environment("AIRLINE_API_TOKEN", null),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    public AirlineApiClient(String baseUrl, String accessToken, HttpClient http) throws IOException {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            throw new IOException("Set AIRLINE_API_URL to the Express API base URL.");
        }
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new IOException("Set AIRLINE_API_TOKEN to a Supabase access token; do not use a service-role key.");
        }
        if (http == null) throw new IllegalArgumentException("HTTP client is required.");
        try {
            URI parsed = URI.create(baseUrl.trim());
            if (!("http".equalsIgnoreCase(parsed.getScheme()) || "https".equalsIgnoreCase(parsed.getScheme()))
                    || parsed.getHost() == null) {
                throw new IllegalArgumentException("Invalid API URL.");
            }
        } catch (IllegalArgumentException exception) {
            throw new IOException("AIRLINE_API_URL must be an absolute HTTP or HTTPS URL.", exception);
        }
        String normalizedUrl = baseUrl.trim().replaceAll("/+$", "");
        this.baseUrl = normalizedUrl.endsWith("/api") ? normalizedUrl : normalizedUrl + "/api";
        this.accessToken = accessToken.trim();
        this.http = http;
    }

    private static String environment(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    public String createPassenger(Passenger passenger) throws IOException, InterruptedException {
        requirePassenger(passenger);
        String body = "{\"fullName\":" + quote(passenger.getName())
                + ",\"email\":" + quote(passenger.getEmail())
                + ",\"phone\":" + quote(passenger.getPhone() == null ? "" : passenger.getPhone()) + "}";
        return request("POST", "/passengers", body);
    }

    public String updatePassenger(long passengerId, Passenger passenger)
            throws IOException, InterruptedException {
        requirePassenger(passenger);
        if (passengerId <= 0) throw new IllegalArgumentException("Passenger ID must be positive.");
        String body = "{\"fullName\":" + quote(passenger.getName())
                + ",\"email\":" + quote(passenger.getEmail())
                + ",\"phone\":" + quote(passenger.getPhone() == null ? "" : passenger.getPhone()) + "}";
        return request("PUT", "/passengers/" + passengerId, body);
    }

    public String getPassenger(long passengerId) throws IOException, InterruptedException {
        if (passengerId <= 0) throw new IllegalArgumentException("Passenger ID must be positive.");
        return request("GET", "/passengers/" + passengerId, null);
    }

    public String createBooking(long passengerId, long flightId, long seatId, String travelClass)
            throws IOException, InterruptedException {
        if (passengerId <= 0 || flightId <= 0 || seatId <= 0) {
            throw new IllegalArgumentException("Passenger, flight, and seat IDs must be positive.");
        }
        if (!"Economy".equals(travelClass) && !"Business".equals(travelClass)
                && !"First Class".equals(travelClass)) {
            throw new IllegalArgumentException("Travel class must be Economy, Business, or First Class.");
        }
        String body = "{\"passengerId\":" + passengerId
                + ",\"flightId\":" + flightId
                + ",\"seatId\":" + seatId
                + ",\"travelClass\":" + quote(travelClass) + "}";
        return request("POST", "/bookings", body);
    }

    public String getBooking(String idOrPnr) throws IOException, InterruptedException {
        return request("GET", "/bookings/" + pathSegment(idOrPnr), null);
    }

    public String searchByPnr(String pnr) throws IOException, InterruptedException {
        return getBooking(normalizePnr(pnr));
    }

    public String cancelBooking(String idOrPnr) throws IOException, InterruptedException {
        return request("POST", "/bookings/" + pathSegment(idOrPnr) + "/cancel", "{}");
    }

    public String checkIn(String pnr) throws IOException, InterruptedException {
        return request("POST", "/boarding/checkin", "{\"pnr\":" + quote(normalizePnr(pnr)) + "}");
    }

    public String verifyBoarding(String pnr, String seatNumber)
            throws IOException, InterruptedException {
        if (seatNumber == null || !seatNumber.trim().matches("[0-9]{1,3}[A-Za-z]{1,2}")) {
            throw new IllegalArgumentException("A valid seat number is required.");
        }
        String body = "{\"pnr\":" + quote(normalizePnr(pnr))
                + ",\"seatNumber\":" + quote(seatNumber.trim().toUpperCase(Locale.ROOT)) + "}";
        return request("POST", "/boarding/verify", body);
    }

    public String getBoardingPass(String idOrPnr) throws IOException, InterruptedException {
        return request("GET", "/boarding/pass/" + pathSegment(idOrPnr), null);
    }

    static String jsonField(String json, String field) {
        if (json == null || field == null) return null;
        int index = 0;
        while (index < json.length()) {
            if (json.charAt(index) != '"') {
                index++;
                continue;
            }
            ParsedString key = parseString(json, index);
            if (key == null) return null;
            int valueIndex = skipWhitespace(json, key.next);
            if (valueIndex >= json.length() || json.charAt(valueIndex) != ':') {
                index = key.next;
                continue;
            }
            valueIndex = skipWhitespace(json, valueIndex + 1);
            if (field.equals(key.value)) {
                if (valueIndex < json.length() && json.charAt(valueIndex) == '"') {
                    ParsedString value = parseString(json, valueIndex);
                    return value == null ? null : value.value;
                }
                int end = valueIndex;
                while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}'
                        && json.charAt(end) != ']') {
                    end++;
                }
                return json.substring(valueIndex, end).trim();
            }
            index = key.next;
        }
        return null;
    }

    private static final class ParsedString {
        private final String value;
        private final int next;

        private ParsedString(String value, int next) {
            this.value = value;
            this.next = next;
        }
    }

    private static ParsedString parseString(String json, int start) {
        StringBuilder value = new StringBuilder();
        for (int index = start + 1; index < json.length(); index++) {
            char current = json.charAt(index);
            if (current == '"') return new ParsedString(value.toString(), index + 1);
            if (current != '\\') {
                value.append(current);
                continue;
            }
            if (++index >= json.length()) return null;
            char escaped = json.charAt(index);
            switch (escaped) {
                case '"': value.append('"'); break;
                case '\\': value.append('\\'); break;
                case '/': value.append('/'); break;
                case 'b': value.append('\b'); break;
                case 'f': value.append('\f'); break;
                case 'n': value.append('\n'); break;
                case 'r': value.append('\r'); break;
                case 't': value.append('\t'); break;
                case 'u':
                    if (index + 4 >= json.length()) return null;
                    try {
                        value.append((char) Integer.parseInt(json.substring(index + 1, index + 5), 16));
                    } catch (NumberFormatException exception) {
                        return null;
                    }
                    index += 4;
                    break;
                default: return null;
            }
        }
        return null;
    }

    private static int skipWhitespace(String value, int index) {
        while (index < value.length() && Character.isWhitespace(value.charAt(index))) index++;
        return index;
    }

    private static void requirePassenger(Passenger passenger) {
        if (passenger == null || passenger.getName() == null || passenger.getName().trim().isEmpty()
                || passenger.getEmail() == null || passenger.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Passenger name and email are required.");
        }
    }

    private static String normalizePnr(String pnr) {
        if (pnr == null || !pnr.trim().matches("[A-Za-z0-9]{6,10}")) {
            throw new IllegalArgumentException("A valid PNR is required.");
        }
        return pnr.trim().toUpperCase(Locale.ROOT);
    }

    private static String pathSegment(String value) {
        if (value == null || !IDENTIFIER.matcher(value.trim()).matches()) {
            throw new IllegalArgumentException("Booking ID or PNR contains unsupported characters.");
        }
        return value.trim();
    }

    private static String quote(String value) {
        StringBuilder result = new StringBuilder("\"");
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            switch (current) {
                case '"': result.append("\\\""); break;
                case '\\': result.append("\\\\"); break;
                case '\b': result.append("\\b"); break;
                case '\f': result.append("\\f"); break;
                case '\n': result.append("\\n"); break;
                case '\r': result.append("\\r"); break;
                case '\t': result.append("\\t"); break;
                default:
                    if (current < 0x20) {
                        result.append(String.format("\\u%04x", (int) current));
                    } else {
                        result.append(current);
                    }
            }
        }
        return result.append('"').toString();
    }

    private String request(String method, String path, String body)
            throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("Authorization", "Bearer " + accessToken);
        if (body == null) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        }

        HttpResponse<String> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String detail = response.body() == null ? "" : response.body();
            throw new IOException("Airline API request failed (HTTP " + response.statusCode() + "): " + detail);
        }
        return response.body();
    }
}
