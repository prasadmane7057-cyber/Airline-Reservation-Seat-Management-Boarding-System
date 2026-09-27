package model;

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
    private static final String PASSWORD = "password";
    private static Connection connection = null;

    public static Connection getConnection() {
        if (connection == null) {
            try {
                // Load MySQL JDBC Driver
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println(" Connected to MySQL database successfully.");
            } catch (ClassNotFoundException e) {
                System.out.println("  MySQL JDBC Driver not found in classpath (Expected for standalone CLI demo).");
            } catch (SQLException e) {
                System.out.println("  MySQL Database unreachable (Ensure MySQL service is running on port 3306).");
            }
        }
        return connection;
    }
}
