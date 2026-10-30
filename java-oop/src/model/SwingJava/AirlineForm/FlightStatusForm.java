package model.SwingJava.AirlineForm;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.sql.*;

import model.DBConnection;

/*
 * Airline Management System - Flight Status Update Form
 * Simple Swing concepts: JFrame, JLabel, JTextField, JComboBox, JButton, JTextArea
 * Storage: MySQL database "airline", table "flights"
 *
 * Include the MySQL Connector/J JAR on the classpath when compiling and running.
 */
public class FlightStatusForm extends JFrame implements ActionListener {

    private Connection getConnection() throws SQLException {
        Connection connection = DBConnection.getConnection();
        if (connection == null || connection.isClosed()) {
            throw new SQLException("Unable to connect. Verify MySQL and AIRLINE_DB_PASSWORD.");
        }
        return connection;
    }

    // Form components
    JLabel lblFlight, lblDest, lblStatus;
    JTextField txtFlight, txtDest;
    JComboBox<String> cmbStatus;
    JButton btnAdd, btnUpdate, btnView;
    JTextArea area;

    public FlightStatusForm() {
        setTitle("Flight Status Update");
        setSize(450, 450);
        setLayout(new FlowLayout());
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        // Labels and input fields
        lblFlight = new JLabel("Flight No:");
        txtFlight = new JTextField(15);

        lblDest = new JLabel("Destination code:");
        txtDest = new JTextField(15);

        lblStatus = new JLabel("Status:");
        String[] statuses = {"SCHEDULED", "BOARDING", "DEPARTED", "DELAYED", "CANCELLED", "COMPLETED"};
        cmbStatus = new JComboBox<>(statuses);

        // Buttons
        btnAdd = new JButton("Add Flight");
        btnUpdate = new JButton("Update Status");
        btnView = new JButton("View All");

        // Output area
        area = new JTextArea(12, 35);
        area.setEditable(false);

        // Add everything to the frame
        add(lblFlight);  add(txtFlight);
        add(lblDest);    add(txtDest);
        add(lblStatus);  add(cmbStatus);
        add(btnAdd);     add(btnUpdate);   add(btnView);
        add(new JScrollPane(area));

        // Register button clicks
        btnAdd.addActionListener(this);
        btnUpdate.addActionListener(this);
        btnView.addActionListener(this);

        setVisible(true);
    }

    // Runs when any button is clicked
    public void actionPerformed(ActionEvent e) {
        if (e.getSource() == btnAdd) {
            addFlight();
        } else if (e.getSource() == btnUpdate) {
            updateStatus();
        } else if (e.getSource() == btnView) {
            viewAll();
        }
    }

    // ADD: inserts a flight into the database.
    void addFlight() {
        String no = txtFlight.getText().trim();
        String dest = txtDest.getText().trim();
        String status = (String) cmbStatus.getSelectedItem();

        if (no.isEmpty() || dest.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill all fields.");
            return;
        }

        String sql = "INSERT INTO flights "
                + "(flight_number, aircraft_id, from_airport_id, to_airport_id, "
                + "departure_time, arrival_time, duration, status) "
                + "SELECT ?, 1, 1, a.id, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), "
                + "'2h', ? FROM airports a WHERE a.airport_code = ?";
        try {
            Connection conn = getConnection();
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, no.toUpperCase());
                stmt.setString(2, status);
                stmt.setString(3, dest.toUpperCase());
                int inserted = stmt.executeUpdate();
                if (inserted == 0) {
                    JOptionPane.showMessageDialog(this, "Unknown destination airport code. Example: DEL, BOM, BLR.");
                    return;
                }
                JOptionPane.showMessageDialog(this, "Flight added.");
                txtFlight.setText("");
                txtDest.setText("");
            }
        } catch (SQLException ex) {
            if ("23000".equals(ex.getSQLState())) {
                JOptionPane.showMessageDialog(this, "Flight already exists. Use Update Status.");
            } else {
                JOptionPane.showMessageDialog(this, "Database error: " + ex.getMessage());
            }
        }
    }

    // UPDATE: changes the status for the selected flight number.
    void updateStatus() {
        String no = txtFlight.getText().trim();
        String status = (String) cmbStatus.getSelectedItem();

        if (no.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Enter the flight number to update.");
            return;
        }

        String sql = "UPDATE flights SET status = ? WHERE flight_number = ?";
        try {
            Connection conn = getConnection();
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, status);
                stmt.setString(2, no.toUpperCase());

                if (stmt.executeUpdate() > 0) {
                    JOptionPane.showMessageDialog(this, "Status updated.");
                } else {
                    JOptionPane.showMessageDialog(this, "Flight not found.");
                }
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Database error: " + ex.getMessage());
        }
    }

    // VIEW: reads all flights from the database and shows them in the text area.
    void viewAll() {
        area.setText("Flight No | Destination | Status\n");
        area.append("--------------------------------------\n");

        String sql = "SELECT f.flight_number, a.airport_code AS destination, f.status "
                + "FROM flights f JOIN airports a ON a.id = f.to_airport_id "
                + "ORDER BY f.flight_number";
        try {
            Connection conn = getConnection();
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                boolean hasFlights = false;
                while (rs.next()) {
                    hasFlights = true;
                    area.append(rs.getString("flight_number") + "  |  "
                            + rs.getString("destination") + "  |  "
                            + rs.getString("status") + "\n");
                }
                if (!hasFlights) {
                    area.append("No flights saved yet.\n");
                }
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Database error: " + ex.getMessage());
        }
    }

    public static void main(String[] args) {
        new FlightStatusForm();
    }
}