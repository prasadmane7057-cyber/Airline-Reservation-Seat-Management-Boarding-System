import java.sql.SQLException;

import model.DBConnection;

public class ConnectionTest {
    public static void main(String[] args) {
        try {
            DBConnection.testConnection();
            System.out.println("Database connection test passed.");
        } catch (ClassNotFoundException ex) {
            System.err.println("Database connection test failed: MySQL Connector/J is missing.");
            System.exit(1);
        } catch (SQLException ex) {
            System.err.println("Database connection test failed: " + ex.getMessage());
            System.exit(1);
        }
    }
}
