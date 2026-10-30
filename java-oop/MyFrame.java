
import javax.swing.*;

public class MyFrame {
    public static void main(String[] args) {

        // Create a frame
        JFrame frame = new JFrame("My First Swing");

        // Create a label
        JLabel label = new JLabel("Hello, Java Swing!");

        // Create buttons
        JButton btn1 = new JButton("Submit");
        JButton btn2 = new JButton("Clear");
        JButton btn3 = new JButton("Exit");

        // Set layout
        frame.setLayout(null);

        // Set positions and sizes
        label.setBounds(120, 40, 200, 30);
        btn1.setBounds(40, 100, 90, 30);
        btn2.setBounds(145, 100, 90, 30);
        btn3.setBounds(250, 100, 90, 30);

        // Add components to frame
        frame.add(label);
        frame.add(btn1);
        frame.add(btn2);
        frame.add(btn3);

        // Button actions
        btn1.addActionListener(e ->
            JOptionPane.showMessageDialog(frame, "Submit button clicked!")
        );

        btn2.addActionListener(e ->
            JOptionPane.showMessageDialog(frame, "Clear button clicked!")
        );

        btn3.addActionListener(e ->
            frame.dispose()
        );

        // Set frame properties
        frame.setSize(400, 250);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setLocationRelativeTo(null);

        // Display frame
        frame.setVisible(true);
    }
}
