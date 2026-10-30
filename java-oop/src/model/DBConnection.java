package model;
//Import package
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Class: DBConnection
 * Demonstrates: Singleton JDBC Connection Architecture for MySQL
 */
public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/airline_reservation?useSSL=false&allowPublicKeyRetrieval=true";
    private static final String USER = "root";
    private static final String PASSWORD = System.getenv().getOrDefault("AIRLINE_DB_PASSWORD", "password");
    private static Connection connection = null;

    public static void main(String[] args) {
        try {
            testConnection();
            System.out.println("Database connection successful.");
        } catch (ClassNotFoundException e) {
            System.err.println("Database connection failed: MySQL JDBC driver is missing from the classpath.");
            System.exit(1);
        } catch (SQLException e) {
            System.err.println("Database connection failed: " + e.getMessage());
            System.exit(1);
        }
    }
//Add driver
    public static void testConnection() throws ClassNotFoundException, SQLException {
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection testConnection = DriverManager.getConnection(URL, USER, PASSWORD)) {
            if (!testConnection.isValid(3)) {
                throw new SQLException("The database connection did not pass validation.");
            }
        }
    }

    public static Connection getConnection() {
        if (connection == null) {
            try {
                // Load MySQL JDBC Driver
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println(" Connected to MySQL database successfully.");
            } catch (ClassNotFoundException e) {
                System.out.println("  MySQL JDBC driver is missing from the classpath.");
            } catch (SQLException e) {
                System.out.println("  MySQL connection failed: " + e.getMessage());
            }
        }
        return connection;
    }
}
