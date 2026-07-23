<?php
/**
 * EmailService.php - Core SMTP Engine
 * Uses PHPMailer to send emails via Gmail SMTP
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Adjust path to your PHPMailer location
require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

class EmailService {
    private $mail;

    public function __construct() {
        $this->mail = new PHPMailer(true);
        
        // Server settings
        $this->mail->isSMTP();
        $this->mail->Host       = 'smtp.gmail.com';
        $this->mail->SMTPAuth   = true;
        $this->mail->Username   = 'pharmacometric3@gmail.com';
        $this->mail->Password   = 'pnqs udkf vdxw sahc';
        $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mail->Port       = 587;
        
        // Default sender
        $this->mail->setFrom('pharmacometric3@gmail.com', 'Dr. Levy AI');
    }

    /**
     * Sends an email
     * @param string $to Recipient email
     * @param string $subject Email subject
     * @param string $body HTML body
     * @return bool
     */
    public function sendMail($to, $subject, $body) {
        try {
            $this->mail->clearAddresses();
            $this->mail->addAddress($to);
            $this->mail->isHTML(true);
            $this->mail->Subject = $subject;
            $this->mail->Body    = $body;
            
            return $this->mail->send();
        } catch (Exception $e) {
            error_log("Email Error: " . $this->mail->ErrorInfo);
            return false;
        }
    }
}

