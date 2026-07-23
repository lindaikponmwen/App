<?php
/*
 * Endpoint: /main-api/send-otp.php
 * Description: Generates a 6-digit OTP, stores it in a session, and sends it to the provided email.
 */

// Allow CORS for development (Remove/Restrict in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

session_start();

$input = json_decode(file_get_contents("php://input"), true);
$email = isset($input['email']) ? filter_var($input['email'], FILTER_SANITIZE_EMAIL) : null;

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// Generate 6-digit OTP
$otp = rand(100000, 999999);

// Store in session for verification
$_SESSION['otp'] = $otp;
$_SESSION['otp_email'] = $email;
$_SESSION['otp_expiry'] = time() + 300; // 5 minutes expiration

// Email Logic
$subject = "Your DrLevy AI Verification Code";
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: no-reply@drlevy.ai" . "\r\n";

$message = "
<html>
<head>
  <title>Verification Code</title>
</head>
<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
  <div style='max-w-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;'>
    <h2 style='color: #333;'>Verify your request</h2>
    <p>Please use the following code to verify your email address and complete your demo request:</p>
    <div style='background: #f0f8ff; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0078D4; margin: 20px 0;'>
      {$otp}
    </div>
    <p style='font-size: 12px; color: #888;'>This code will expire in 5 minutes.</p>
  </div>
</body>
</html>
";

// Uncomment the line below to actually send email on a configured server
// $mailSent = mail($email, $subject, $message, $headers);

// FOR DEMO PURPOSES: We simulate success and log the OTP to console/response so you can test it
// In production, remove the 'debug_otp' field.
echo json_encode([
    'success' => true, 
    'message' => 'OTP sent successfully.',
    'debug_otp' => $otp // REMOVE THIS IN PRODUCTION
]);
?>