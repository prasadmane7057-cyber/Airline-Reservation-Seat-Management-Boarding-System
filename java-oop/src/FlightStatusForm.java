import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;

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

        lblDest = new JLabel("Destination:");
        txtDest = new JTextField(15);

        lblStatus = new JLabel("Status:");
        String[] statuses = {"On Time", "Delayed", "Cancelled", "Boarding", "Departed"};
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

    // ADD: appends one line to the file -> O(1) to write, O(n) to check duplicates
    void addFlight() {
        String no = txtFlight.getText().trim();
        String dest = txtDest.getText().trim().replace(",", " "); // commas would break the CSV
        String status = (String) cmbStatus.getSelectedItem();

        if (no.isEmpty() || dest.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill all fields.");
            return;
        }
        no = no.replace(",", "");

        if (flightExists(no)) {
            JOptionPane.showMessageDialog(this, "Flight already exists. Use Update Status.");
            return;
        }

        try (FileWriter fw = new FileWriter(FILE, true)) { // true = append mode
            fw.write(no + "," + dest + "," + status + "\n");
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

    // Helper: checks whether a flight number is already in the file
    boolean flightExists(String no) {
        try (BufferedReader br = new BufferedReader(new FileReader(FILE))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.split(",")[0].equalsIgnoreCase(no)) {
                    return true;
                }
            }
        } catch (IOException ex) {
            // file does not exist yet, so no duplicates
        }
        return false;
    }

    public static void main(String[] args) {
        new FlightStatusForm();
    }
}