import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.IOException;
import java.util.List;

import model.SupabaseClient;

/*
 * Airline Management System - Flight Status Update Form
 * Simple Swing concepts: JFrame, JLabel, JTextField, JComboBox, JButton, JTextArea
 * Storage: Supabase PostgreSQL flights table
 *
 * Compile : javac FlightStatusForm.java
 * Run     : java FlightStatusForm
 */
public class FlightStatusForm extends JFrame implements ActionListener {

    // Form components
    JLabel lblFlight, lblDest, lblStatus;
    JTextField txtFlight, txtDest;
    JComboBox<String> cmbStatus;
    JButton btnAdd, btnUpdate, btnView, btnTestConnection, btnBookingFiles;
    JTextArea area;
    private JPanel flightActionsPanel;
    private SupabaseClient supabase;

    public FlightStatusForm() {
        setTitle("Flight Status Update");
        setSize(450, 450);
        setLayout(new FlowLayout());
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        // Labels and input fields
        lblFlight = new JLabel("Flight No:");
        txtFlight = new JTextField(15);

        lblDest = new JLabel("Destination:");
        txtDest = new JTextField(15);

        lblStatus = new JLabel("Status:");
        String[] statuses = {"On Time", "Delayed", "Cancelled", "Boarding", "Departed"};
        cmbStatus = new JComboBox<>(statuses);

        // Buttons
        btnAdd = new JButton("Add Flight");
        btnUpdate = new JButton("Update Status");
        btnView = new JButton("View All");
        btnTestConnection = new JButton("Test Supabase");
        btnBookingFiles = new JButton("Manage Booking Files");

        flightActionsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        flightActionsPanel.setBorder(BorderFactory.createTitledBorder("Flight Actions"));
        flightActionsPanel.add(btnUpdate);
        flightActionsPanel.add(btnView);

        JPanel connectionPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        connectionPanel.setBorder(BorderFactory.createTitledBorder("Supabase"));
        connectionPanel.add(btnTestConnection);
        connectionPanel.add(btnBookingFiles);

        // Output area
        area = new JTextArea(12, 35);
        area.setEditable(false);

        // Add everything to the frame
        add(lblFlight);  add(txtFlight);
        add(lblDest);    add(txtDest);
        add(lblStatus);  add(cmbStatus);
        add(btnAdd);
        add(connectionPanel);
        add(flightActionsPanel);
        add(new JScrollPane(area));

        try {
            supabase = new SupabaseClient();
            flightActionsPanel.setVisible(true);
        } catch (IOException ex) {
            flightActionsPanel.setVisible(false);
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Supabase Configuration",
                    JOptionPane.ERROR_MESSAGE);
        }

        // Register button clicks
        btnAdd.addActionListener(this);
        btnUpdate.addActionListener(this);
        btnView.addActionListener(this);
        btnTestConnection.addActionListener(this);
        btnBookingFiles.addActionListener(this);

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
        } else if (e.getSource() == btnTestConnection) {
            testDatabaseConnection();
        } else if (e.getSource() == btnBookingFiles) {
            new BookingFileSwingForm().setVisible(true);
        }
    }

    private void testDatabaseConnection() {
        try {
            if (supabase == null) {
                supabase = new SupabaseClient();
            }
            supabase.testConnection();
            JOptionPane.showMessageDialog(this, "Supabase connection successful.");
        } catch (IOException | InterruptedException ex) {
            JOptionPane.showMessageDialog(this,
                    "Supabase connection failed: " + ex.getMessage(),
                    "Supabase Connection Failed", JOptionPane.ERROR_MESSAGE);
        }
    }

    // ADD: builds the duplicate-check index once, then checks duplicates in O(1) on average
    void addFlight() {
        String no = txtFlight.getText().trim();
        String dest = txtDest.getText().trim().replace(",", " "); // commas would break the CSV
        String status = (String) cmbStatus.getSelectedItem();

        if (no.isEmpty() || dest.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill all fields.");
            return;
        }
        no = no.replace(",", "");

        try {
            ensureSupabase();
            if (supabase.flightExists(no)) {
                JOptionPane.showMessageDialog(this, "Flight already exists. Use Update Status.");
                return;
            }
        } catch (IOException | InterruptedException ex) {
            JOptionPane.showMessageDialog(this, "Error reading flights: " + ex.getMessage());
            return;
        }

        try {
            supabase.addFlight(no, dest, status);
            flightActionsPanel.setVisible(true);
            revalidate();
            JOptionPane.showMessageDialog(this, "Flight added.");
            txtFlight.setText("");
            txtDest.setText("");
        } catch (IOException | InterruptedException ex) {
            JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
        }
    }

    // UPDATE: copy every line to a temp file, changing only the matching flight
    // Time O(n), extra memory O(1) because only one line is held at a time
    void updateStatus() {
        String no = txtFlight.getText().trim();
        String status = (String) cmbStatus.getSelectedItem();

        if (no.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Enter the flight number to update.");
            return;
        }

        try {
            ensureSupabase();
            if (!supabase.flightExists(no)) {
                JOptionPane.showMessageDialog(this, "Flight not found.");
                return;
            }
            supabase.updateStatus(no, status);
            JOptionPane.showMessageDialog(this, "Status updated.");
        } catch (IOException | InterruptedException ex) {
            JOptionPane.showMessageDialog(this, "Supabase error: " + ex.getMessage());
            return;
        }
    }

    // VIEW: read the file line by line and show it in the text area
    void viewAll() {
        area.setText("Flight No | Destination | Status\n");
        area.append("--------------------------------------\n");
        try {
            ensureSupabase();
            List<String[]> flights = supabase.viewFlights();
            if (flights.isEmpty()) {
                area.append("No flights saved yet.\n");
            } else {
                for (String[] flight : flights) {
                    area.append(flight[0] + "  |  " + flight[1] + "  |  " + flight[2] + "\n");
                }
            }
        } catch (IOException | InterruptedException ex) {
            area.append("Supabase error: " + ex.getMessage() + "\n");
        }
    }

    private void ensureSupabase() throws IOException {
        if (supabase == null) {
            supabase = new SupabaseClient();
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            FlightStatusForm form = new FlightStatusForm();
            form.setLocationRelativeTo(null);
        });
    }
}