<?php
/*
 * Endpoint: /main-api/verify-otp-and-submit.php
 * Description: Verifies the OTP. If valid, sends the full lead details to support.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

session_start();

$input = json_decode(file_get_contents("php://input"), true);

$userOtp = isset($input['otp']) ? intval($input['otp']) : 0;
$formData = isset($input['formData']) ? $input['formData'] : [];

// 1. Verify OTP
if (!isset($_SESSION['otp']) || !isset($_SESSION['otp_expiry'])) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please request a new code.']);
    exit;
}

if (time() > $_SESSION['otp_expiry']) {
    echo json_encode(['success' => false, 'message' => 'Code expired. Please request a new code.']);
    exit;
}

// Note: checking userOtp against session OTP. 
// In a real app, ensure strict type checking or string comparison.
if ($userOtp != $_SESSION['otp']) {
    echo json_encode(['success' => false, 'message' => 'Invalid verification code.']);
    exit;
}

// 2. Prepare Data for Support Team
$to = "support@drlevy.ai";
$subject = "New Demo Request: " . ($formData['firstName'] ?? 'Unknown') . " " . ($formData['lastName'] ?? '');

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: website-leads@drlevy.ai" . "\r\n";
$headers .= "Reply-To: " . ($formData['email'] ?? 'no-reply@drlevy.ai') . "\r\n";

// HTML Email Template for Support
$body = "
<html>
<body style='font-family: Segoe UI, sans-serif; color: #333;'>
  <div style='background: #020617; color: #fff; padding: 20px;'>
    <h1>New Demo Request</h1>
  </div>
  <div style='padding: 20px; background: #fff; border: 1px solid #ddd;'>
    <table style='width: 100%; border-collapse: collapse;'>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 200px;'>Name:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars(($formData['firstName'] ?? '') . ' ' . ($formData['lastName'] ?? '')) . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Email:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['email'] ?? '') . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Phone:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['phone'] ?? '') . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Job Title:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['jobTitle'] ?? '') . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Organization Type:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['category'] ?? '') . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Institution Size:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['size'] ?? '') . "</td></tr>
      <tr><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Organization Name:</td><td style='padding: 10px; border-bottom: 1px solid #eee;'>" . htmlspecialchars($formData['orgName'] ?? '') . "</td></tr>
    </table>
    <p style='margin-top: 20px; font-size: 12px; color: #666;'>This lead was verified via OTP at " . date('Y-m-d H:i:s') . "</p>
  </div>
</body>
</html>
";

// Uncomment to send
// mail($to, $subject, $body, $headers);

// Clear Session
unset($_SESSION['otp']);
unset($_SESSION['otp_expiry']);
unset($_SESSION['otp_email']);

echo json_encode(['success' => true, 'message' => 'Demo request submitted successfully.']);
?>