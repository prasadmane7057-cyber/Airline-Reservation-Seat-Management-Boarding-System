package model;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class SupabaseClient {
    private static final String FLIGHTS_TABLE = "flights";

    private final String url;
    private final String key;
    private final HttpClient http;

    public SupabaseClient() throws IOException {
        this.url = value("SUPABASE_URL", "VITE_SUPABASE_URL");
        this.key = value("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY",
                "VITE_SUPABASE_PUBLISHABLE_KEY");
        this.http = HttpClient.newHttpClient();
    }

    private static String value(String... names) throws IOException {
        for (String name : names) {
            String value = System.getenv(name);
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }

        Path current = Path.of("").toAbsolutePath();
        for (Path directory = current; directory != null; directory = directory.getParent()) {
            Path envFile = directory.resolve("frontend").resolve(".env.local");
            if (Files.isRegularFile(envFile)) {
                for (String line : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                    String trimmed = line.trim();
                    if (!trimmed.startsWith("#") && trimmed.contains("=")) {
                        int separator = trimmed.indexOf('=');
                        String name = trimmed.substring(0, separator).trim();
                        String envValue = trimmed.substring(separator + 1).trim();
                        for (String requested : names) {
                            if (requested.equals(name)) {
                                return envValue;
                            }
                        }
                    }
                }
            }
        }
        throw new IOException("Supabase is not configured. Set SUPABASE_URL and "
                + "SUPABASE_ANON_KEY or configure frontend/.env.local.");
    }

    public void testConnection() throws IOException, InterruptedException {
        request("GET", "/rest/v1/" + FLIGHTS_TABLE + "?select=flight_number&limit=1", null);
    }

    public boolean flightExists(String flightNumber) throws IOException, InterruptedException {
        String response = request("GET", "/rest/v1/" + FLIGHTS_TABLE
                + "?select=flight_number&flight_number=eq."
                + encodeQuery(flightNumber) + "&limit=1", null);
        return response.trim().startsWith("[{");
    }

    public void addFlight(String flightNumber, String destination, String status)
            throws IOException, InterruptedException {
        String json = "[{\"flight_number\":\"" + json(flightNumber.toUpperCase(Locale.ROOT))
                + "\",\"destination\":\"" + json(destination.toUpperCase(Locale.ROOT))
                + "\",\"status\":\"" + json(status) + "\"}]";
        request("POST", "/rest/v1/" + FLIGHTS_TABLE, json);
    }

    public void updateStatus(String flightNumber, String status)
            throws IOException, InterruptedException {
        request("PATCH", "/rest/v1/" + FLIGHTS_TABLE
                + "?flight_number=eq." + encodeQuery(flightNumber.toUpperCase(Locale.ROOT)),
                "{\"status\":\"" + json(status) + "\"}");
    }

    public List<String[]> viewFlights() throws IOException, InterruptedException {
        String response = request("GET", "/rest/v1/" + FLIGHTS_TABLE
                + "?select=flight_number,destination,status&order=flight_number.asc", null);
        return parseFlights(response);
    }

    private String request(String method, String path, String body)
            throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url.replaceAll("/+$", "") + path))
                .header("apikey", key)
                .header("Authorization", "Bearer " + key)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Prefer", method.equals("POST") ? "return=minimal" : "return=minimal");

        if (body == null) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.method(method, HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        }

        HttpResponse<String> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            if (response.statusCode() == 404 && response.body().contains("public.flights")) {
                throw new IOException("The Supabase flights table is missing. Run "
                        + "database/supabase_flights.sql in the Supabase SQL Editor, "
                        + "then reload the form.");
            }
            throw new IOException("Supabase request failed (HTTP " + response.statusCode()
                    + "): " + response.body());
        }
        return response.body();
    }

    private static List<String[]> parseFlights(String json) {
        List<String[]> flights = new ArrayList<>();
        String[] objects = json.split("\\},\\{");
        for (String object : objects) {
            String number = read(object, "flight_number");
            String destination = read(object, "destination");
            String status = read(object, "status");
            if (number != null) {
                flights.add(new String[]{number, destination == null ? "" : destination,
                        status == null ? "" : status});
            }
        }
        return flights;
    }

    private static String read(String json, String field) {
        String marker = "\"" + field + "\":";
        int index = json.indexOf(marker);
        if (index < 0) return null;
        int quote = json.indexOf('"', index + marker.length());
        if (quote < 0) return null;
        int end = json.indexOf('"', quote + 1);
        return end < 0 ? null : json.substring(quote + 1, end)
                .replace("\\\"", "\"").replace("\\n", "\n");
    }

    private static String encodeQuery(String value) {
        return value.toUpperCase(Locale.ROOT).replace(" ", "%20");
    }

    private static String json(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
