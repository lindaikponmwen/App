<?php
/**
 * Registration Endpoint
 *
 * Handles user registration with validation, reCAPTCHA verification, and email confirmation
 */

// Ensure no output before JSON response
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'https://run03.drlevy.ai/'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/email.php';

// Start session
Session::start();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate CSRF token
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!CSRF::validateToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token. Refresh the page and try again.']);
        exit;
    }

    // Validate reCAPTCHA token
    if (!isset($input['recaptchaToken']) || empty($input['recaptchaToken'])) {
        throw new Exception('reCAPTCHA verification is required');
    }

    $recaptchaToken = $input['recaptchaToken'];
    $recaptchaSecret = getenv('RECAPTCHA_SECRET_KEY') ?: '';

    // Only validate reCAPTCHA if secret key is configured
    if (!empty($recaptchaSecret)) {
        // Verify reCAPTCHA
        $recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
        $recaptchaData = [
            'secret' => $recaptchaSecret,
            'response' => $recaptchaToken,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];

        $options = [
            'http' => [
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => http_build_query($recaptchaData)
            ]
        ];

        $context = stream_context_create($options);
        $recaptchaResponse = @file_get_contents($recaptchaUrl, false, $context);

        if ($recaptchaResponse === false) {
            error_log('reCAPTCHA verification request failed');
            throw new Exception('reCAPTCHA verification failed. Please try again.');
        }

        $result = json_decode($recaptchaResponse);

        if (!$result->success || ($result->score ?? 1.0) < 0.5) {
            error_log('reCAPTCHA verification failed. Score: ' . ($result->score ?? 'N/A'));
            throw new Exception('reCAPTCHA verification failed. Please try again.');
        }
    } else {
        // Development mode: log warning but allow registration
        error_log('WARNING: RECAPTCHA_SECRET_KEY not configured - running in development mode without bot protection');
    }

    // Validate required fields (department removed)
    $requiredFields = ['username', 'email', 'password', 'confirmPassword', 'name', 'title'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            throw new Exception("Field '$field' is required");
        }
    }

    // Sanitize inputs
    $username = Sanitize::string($input['username']);
    $email = Sanitize::email($input['email']);
    $password = $input['password'];
    $confirmPassword = $input['confirmPassword'];
    $name = Sanitize::string($input['name']);
    $title = Sanitize::string($input['title']);

    // Validate minimum length for username, name, and title
    if (strlen($username) < 6) {
        throw new Exception('Username must be at least 6 characters');
    }

    if (strlen($name) < 6) {
        throw new Exception('Full name must be at least 6 characters');
    }

    if (strlen($title) < 6) {
        throw new Exception('Job title must be at least 6 characters');
    }

    // Validate email
    if (!Sanitize::isValidEmail($email)) {
        throw new Exception('Invalid email address');
    }

    // Validate password match
    if ($password !== $confirmPassword) {
        throw new Exception('Passwords do not match');
    }

    // Validate password strength
    $passwordErrors = [];

    if (strlen($password) < 8) {
        $passwordErrors[] = 'at least 8 characters';
    }

    if (!preg_match('/[A-Z]/', $password)) {
        $passwordErrors[] = 'one uppercase letter';
    }

    if (!preg_match('/[a-z]/', $password)) {
        $passwordErrors[] = 'one lowercase letter';
    }

    if (!preg_match('/[0-9]/', $password)) {
        $passwordErrors[] = 'one number';
    }

    if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
        $passwordErrors[] = 'one special character';
    }

    if (!empty($passwordErrors)) {
        throw new Exception('Password must contain: ' . implode(', ', $passwordErrors));
    }

    // Get database connection
    try {
        $db = getDatabase();
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        throw new Exception('Database connection failed. Please try again later.');
    }

    // Check if username or email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Username or email already exists']);
        exit;
    }

    // Hash password
    $passwordHash = PasswordHash::hash($password);

    // Generate initials
    $nameParts = explode(' ', $name);
    $initials = '';
    foreach ($nameParts as $part) {
        if (!empty($part)) {
            $initials .= strtoupper($part[0]);
        }
    }
    $initials = substr($initials, 0, 5);

    // Generate unique UID
    try {
        $uid = UIDGenerator::generate($db, 10);
    } catch (Exception $e) {
        error_log("UID generation error: " . $e->getMessage());
        throw new Exception('Failed to generate user ID. Please try again.');
    }

    // Generate email verification token
    $verificationToken = bin2hex(random_bytes(32));
    $verificationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Insert user (account is inactive until email is verified, role set to 'unsubscribed' to prompt plan selection)
    $stmt = $db->prepare("
        INSERT INTO users (uid, username, email, password_hash, name, initials, role, title, hire_date, is_active, email_verified, email_verification_token, email_verification_expires)
        VALUES (?, ?, ?, ?, ?, ?, 'unsubscribed', ?, CURDATE(), FALSE, FALSE, ?, ?)
    ");

    $stmt->execute([$uid, $username, $email, $passwordHash, $name, $initials, $title, $verificationToken, $verificationExpires]);
    $userId = $db->lastInsertId();

    // Add default member permissions
    $defaultPermissions = ['read', 'write'];
    $permStmt = $db->prepare("INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)");

    foreach ($defaultPermissions as $permission) {
        $permStmt->execute([$userId, $permission]);
    }

    // Send verification email
    $frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
    $verificationLink = $frontendUrl . '/verify-email?token=' . $verificationToken;

    $emailSent = sendEmailVerificationEmail($email, $name, $verificationLink);

    if (!$emailSent) {
        error_log("Failed to send verification email to: {$email}");
    }

    // Generate new CSRF token
    $newCsrfToken = CSRF::generateToken();

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful. Please check your email to verify your account.',
        'csrfToken' => $newCsrfToken,
        'requiresEmailVerification' => true
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
