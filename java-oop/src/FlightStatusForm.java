import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import model.DBConnection;

/*
 * Airline Management System - Flight Status Update Form
 * Simple Swing concepts: JFrame, JLabel, JTextField, JComboBox, JButton, JTextArea
 * Storage: flights.csv  (format: flightNo,destination,status)
 *
 * Compile : javac FlightStatusForm.java
 * Run     : java FlightStatusForm
 */
public class FlightStatusForm extends JFrame implements ActionListener {

    // File used to store data
    static final String FILE = "flights.csv";

    // Form components
    JLabel lblFlight, lblDest, lblStatus;
    JTextField txtFlight, txtDest;
    JComboBox<String> cmbStatus;
    JButton btnAdd, btnUpdate, btnView, btnTestConnection;
    JTextArea area;
    private JPanel flightActionsPanel;
    private final Set<String> flightNumbers = new HashSet<>();
    private boolean flightNumbersLoaded;

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
        btnTestConnection = new JButton("Test Connection");

        flightActionsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        flightActionsPanel.setBorder(BorderFactory.createTitledBorder("Flight Actions"));
        flightActionsPanel.add(btnUpdate);
        flightActionsPanel.add(btnView);

        JPanel connectionPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        connectionPanel.setBorder(BorderFactory.createTitledBorder("Database"));
        connectionPanel.add(btnTestConnection);

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
            loadFlightNumbers();
            flightActionsPanel.setVisible(!flightNumbers.isEmpty());
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, "Error reading flights: " + ex.getMessage());
        }

        // Register button clicks
        btnAdd.addActionListener(this);
        btnUpdate.addActionListener(this);
        btnView.addActionListener(this);
        btnTestConnection.addActionListener(this);

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
        }
    }

    private void testDatabaseConnection() {
        try {
            DBConnection.testConnection();
            JOptionPane.showMessageDialog(this, "Database connection successful.");
        } catch (ClassNotFoundException ex) {
            JOptionPane.showMessageDialog(this,
                    "MySQL JDBC driver is missing. Add Connector/J to the Java classpath.",
                    "Connection Test Failed", JOptionPane.ERROR_MESSAGE);
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this,
                    "Database connection failed: " + ex.getMessage(),
                    "Connection Test Failed", JOptionPane.ERROR_MESSAGE);
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
            if (flightExists(no)) {
                JOptionPane.showMessageDialog(this, "Flight already exists. Use Update Status.");
                return;
            }
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, "Error reading flights: " + ex.getMessage());
            return;
        }

        try (FileWriter fw = new FileWriter(FILE, true)) { // true = append mode
            fw.write(no + "," + dest + "," + status + "\n");
            flightNumbers.add(normalizeFlightNumber(no));
            flightActionsPanel.setVisible(true);
            revalidate();
            JOptionPane.showMessageDialog(this, "Flight added.");
            txtFlight.setText("");
            txtDest.setText("");
        } catch (IOException ex) {
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

        File original = new File(FILE);
        File temp = new File("temp.csv");
        boolean found = false;

        try (BufferedReader br = new BufferedReader(new FileReader(original));
             PrintWriter pw = new PrintWriter(new FileWriter(temp))) {

            String line;
            while ((line = br.readLine()) != null) {
                String[] p = line.split(",");
                if (p[0].equalsIgnoreCase(no)) {
                    line = p[0] + "," + p[1] + "," + status; // new status
                    found = true;
                }
                pw.println(line);
            }
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, "No flights saved yet.");
            temp.delete();
            return;
        }

        if (found) {
            original.delete();
            temp.renameTo(original);
            JOptionPane.showMessageDialog(this, "Status updated.");
        } else {
            temp.delete();
            JOptionPane.showMessageDialog(this, "Flight not found.");
        }
    }

    // VIEW: read the file line by line and show it in the text area
    void viewAll() {
        area.setText("Flight No | Destination | Status\n");
        area.append("--------------------------------------\n");
        try (BufferedReader br = new BufferedReader(new FileReader(FILE))) {
            String line;
            while ((line = br.readLine()) != null) {
                area.append(line.replace(",", "  |  ") + "\n");
            }
        } catch (IOException ex) {
            area.append("No flights saved yet.\n");
        }
    }

    // The first check loads the CSV once; later checks use the in-memory index.
    boolean flightExists(String no) throws IOException {
        loadFlightNumbers();
        return flightNumbers.contains(normalizeFlightNumber(no));
    }

    private void loadFlightNumbers() throws IOException {
        if (!flightNumbersLoaded) {
            File file = new File(FILE);
            if (file.exists()) {
                try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        int delimiter = line.indexOf(',');
                        String flightNo = delimiter < 0 ? line : line.substring(0, delimiter);
                        flightNumbers.add(normalizeFlightNumber(flightNo));
                    }
                }
            }
            flightNumbersLoaded = true;
        }
    }

    private String normalizeFlightNumber(String no) {
        return no.toLowerCase(Locale.ROOT);
    }

    public static void main(String[] args) {
        new FlightStatusForm();
    }
}