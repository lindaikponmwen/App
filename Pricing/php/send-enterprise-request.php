<?php
/**
 * drlevy AI - Enterprise Request Handler
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/EmailService.php';
require_once __DIR__ . '/EmailTemplates.php';

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    jsonResponse(['error' => 'Invalid input data'], 400);
}

// Validate required fields
$requiredFields = ['name', 'companyName', 'email', 'phone', 'companySize', 'message', 'package'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        jsonResponse(['error' => "Field '$field' is required"], 400);
    }
}

// Database Integration
$db = getDB();

try {
    // Insert the request into enterprise_applications (Table created manually by user)
    $stmt = $db->prepare("INSERT INTO enterprise_applications 
        (full_name, company_name, work_email, phone_number, company_size, usage_needs, package_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['name'],
        $data['companyName'],
        $data['email'],
        $data['phone'],
        $data['companySize'],
        $data['message'],
        $data['package']
    ]);

    // Initialize Email Service
    $emailService = new EmailService();

    // 1. Send Lead Notification to Admin
    $adminSubject = "NEW ENTERPRISE LEAD: " . $data['companyName'];
    $adminBody = EmailTemplates::getEnterpriseLeadHtml($data);
    $emailService->sendMail('mathildaasemota88@gmail.com', $adminSubject, $adminBody);

    // 2. Send Thank You Email to User
    $userSubject = "We've received your Enterprise application - Dr. Levy AI";
    $userBody = EmailTemplates::getThankYouEmailHtml($data['name']);
    $emailService->sendMail($data['email'], $userSubject, $userBody);

    // Success response
    jsonResponse([
        'success' => true,
        'message' => 'Your enterprise request has been received. Our team will contact you shortly.'
    ]);

} catch (PDOException $e) {
    error_log("Enterprise Request DB Error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to save enterprise request. Please try again later.'], 500);
} catch (Exception $e) {
    error_log("Enterprise Request General Error: " . $e->getMessage());
    jsonResponse(['error' => 'An unexpected error occurred.'], 500);
}
?>
