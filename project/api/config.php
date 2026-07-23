<?php
// api/config.php

// Security Constants
define('S3_FOLDER_PREFIX', 'xdemo/'); // Default prefix if needed, though frontend sends one
define('PRESIGNED_URL_EXPIRY', 3600); // 1 hour
define('MAX_FILE_NAME_LENGTH', 255);
define('ALLOWED_ORIGIN', 'https://run03.drlevy.ai/' ?: '*'); // Default to * for dev, restrict in prod


// AWS Credentials
define('AWS_ACCESS_KEY_ID', 'AKIARRXY7PCKGVDFBS47');
define('AWS_SECRET_ACCESS_KEY', 'TdLqAr3Y42WuLV9/UuKOTJUwb7oE5ETmJn8VhGls');
define('AWS_DEFAULT_REGION', 'ca-central-1'); // e.g., 'us-east-1', 'eu-west-1', etc.
define('AWS_BUCKET', 'bucket54-sas'); // Your S3 bucket name


// Basic API Key for frontend-backend handshake
define('API_KEY', 'secure-upload-key-123');

// CORS Handling
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = ALLOWED_ORIGIN;
echo $_SERVER['HTTP_ORIGIN'];
if ($allowedOrigin === '*' || $origin === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . ($allowedOrigin === '*' ? '*' : $origin));
} else {
    // Optionally handle disallowed origin
    // header('HTTP/1.1 403 Forbidden');
    exit('Origin not allowed');
}

// Security Headers
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Supabase-Auth');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Handle Preflight Options Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper Functions

/**
 * Send a JSON error response and exit.
 * @param string $message
 * @param int $statusCode
 */
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit();
}

/**
 * Validate the request method.
 * @param string $expectedMethod
 */
function validateRequestMethod($expectedMethod) {
    if ($_SERVER['REQUEST_METHOD'] !== $expectedMethod) {
        sendError('Method not allowed', 405);
    }
}

/**
 * Validate API Key (Placeholder)
 * @return bool
 */
function validateApiKey() {
    $headers = getallheaders();
    // Implementation for API key check can go here
    return true; 
}
?>