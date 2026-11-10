import model.Booking;
import service.BookingFileService;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class BookingFileSwingForm extends JFrame {
    private final BookingFileService fileService = new BookingFileService();
    private final List<Booking> bookings = new ArrayList<>();
    private final DefaultTableModel tableModel = new DefaultTableModel(
            new Object[]{"PNR", "Passenger", "Flight", "Seat", "Date", "Fare (Rs.)", "Status"}, 0) {
        @Override
        public boolean isCellEditable(int row, int column) {
            return false;
        }
    };
    private final JTextField passengerField = new JTextField(12);
    private final JTextField flightField = new JTextField(8);
    private final JTextField seatField = new JTextField(5);
    private final JTextField dateField = new JTextField(LocalDate.now().toString(), 10);
    private final JTextField fareField = new JTextField("5000.00", 8);
    private final JLabel fileLabel = new JLabel("No booking file selected");
    private final JLabel statusLabel = new JLabel("Open a CSV file or add a booking to get started.");
    private Path currentFile;

    public BookingFileSwingForm() {
        setTitle("Airline Booking File Manager");
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setMinimumSize(new Dimension(820, 420));
        setLayout(new BorderLayout(8, 8));

        JPanel entryPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        entryPanel.setBorder(BorderFactory.createTitledBorder("New Booking"));
        entryPanel.add(new JLabel("Passenger"));
        entryPanel.add(passengerField);
        entryPanel.add(new JLabel("Flight"));
        entryPanel.add(flightField);
        entryPanel.add(new JLabel("Seat"));
        entryPanel.add(seatField);
        entryPanel.add(new JLabel("Date"));
        entryPanel.add(dateField);
        entryPanel.add(new JLabel("Fare"));
        entryPanel.add(fareField);
        JButton addButton = new JButton("Add");
        addButton.addActionListener(event -> addBooking());
        entryPanel.add(addButton);

        JTable table = new JTable(tableModel);
        table.setFillsViewportHeight(true);

        JButton openButton = new JButton("Open CSV...");
        openButton.addActionListener(event -> openCsv());
        JButton saveButton = new JButton("Save");
        saveButton.addActionListener(event -> saveCsv(false));
        JButton saveAsButton = new JButton("Save As...");
        saveAsButton.addActionListener(event -> saveCsv(true));
        JPanel filePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        filePanel.add(openButton);
        filePanel.add(saveButton);
        filePanel.add(saveAsButton);
        filePanel.add(fileLabel);

        JPanel bottomPanel = new JPanel(new BorderLayout());
        bottomPanel.add(filePanel, BorderLayout.NORTH);
        bottomPanel.add(statusLabel, BorderLayout.SOUTH);

        add(entryPanel, BorderLayout.NORTH);
        add(new JScrollPane(table), BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);
        pack();
        setLocationRelativeTo(null);
    }

    private void addBooking() {
        String passenger = passengerField.getText().trim();
        String flight = flightField.getText().trim();
        String seat = seatField.getText().trim();
        String date = dateField.getText().trim();
        if (passenger.isEmpty() || flight.isEmpty() || seat.isEmpty() || date.isEmpty()) {
            showError("Passenger, flight, seat, and date are required.");
            return;
        }

        try {
            double fare = Double.parseDouble(fareField.getText().trim());
            if (!Double.isFinite(fare) || fare < 0) {
                showError("Fare must be a finite, non-negative number.");
                return;
            }
            Booking booking = new Booking(passenger, flight, seat, date);
            booking.setFare(fare);
            bookings.add(booking);
            appendRow(booking);
            statusLabel.setText("Added booking " + booking.getPnr() + ". Save to persist changes.");
            passengerField.setText("");
            flightField.setText("");
            seatField.setText("");
        } catch (NumberFormatException exception) {
            showError("Fare must be a valid number.");
        }
    }

    private void openCsv() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Open booking CSV");
        if (chooser.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) return;

        Path selectedFile = chooser.getSelectedFile().toPath();
        try {
            List<Booking> loadedBookings = fileService.loadFromCsv(selectedFile);
            bookings.clear();
            bookings.addAll(loadedBookings);
            refreshTable();
            currentFile = selectedFile;
            fileLabel.setText(currentFile.toString());
            statusLabel.setText("Loaded " + bookings.size() + " booking(s).");
        } catch (IOException exception) {
            showError("Could not load booking file:\n" + exception.getMessage());
        }
    }

    private void saveCsv(boolean chooseFile) {
        if (chooseFile || currentFile == null) {
            JFileChooser chooser = new JFileChooser();
            chooser.setDialogTitle("Save booking CSV");
            if (currentFile != null) chooser.setSelectedFile(currentFile.toFile());
            if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
            currentFile = chooser.getSelectedFile().toPath();
        }

        try {
            fileService.saveToCsv(currentFile, bookings);
            fileLabel.setText(currentFile.toString());
            statusLabel.setText("Saved " + bookings.size() + " booking(s).");
        } catch (IOException exception) {
            showError("Could not save booking file:\n" + exception.getMessage());
        }
    }

    private void refreshTable() {
        tableModel.setRowCount(0);
        for (Booking booking : bookings) appendRow(booking);
    }

    private void appendRow(Booking booking) {
        tableModel.addRow(new Object[]{
                booking.getPnr(), booking.getPassengerName(), booking.getFlightNumber(),
                booking.getSeatNumber(), booking.getBookingDate(), booking.getFare(), booking.getStatus()
        });
    }

    private void showError(String message) {
        statusLabel.setText("File operation or booking input failed.");
        JOptionPane.showMessageDialog(this, message, "Booking File Error", JOptionPane.ERROR_MESSAGE);
    }
}
