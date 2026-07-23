<?php
/**
 * Get User Profile Information
 *
 * Returns complete profile data including:
 * - Personal information
 * - Job information
 * - Recent activity
 * - Compensation data
 * - Professional info
 *
 * Security: Requires authentication
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

Session::start();

try {
    // Verify user is authenticated
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required'
        ]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $db = getDatabase();

    // Get user profile data - only query columns that exist in base schema
    // Additional columns from profile_schema.sql are optional
    $stmt = $db->prepare("
        SELECT
            u.id,
            u.username,
            u.email,
            u.name,
            u.title,
            u.role,
            u.phone,
            u.date_of_birth,
            u.hire_date,
            u.address,
            u.avatar,
            u.department,
            u.created_at,
            u.last_login
        FROM users u
        WHERE u.id = :user_id
    ");

    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Profile not found'
        ]);
        exit;
    }

    // Get job information
    $stmt = $db->prepare("
        SELECT
            department,
            division,
            manager,
            DATE_FORMAT(hire_date, '%b %d, %Y') as hire_date_formatted,
            location
        FROM user_job_info
        WHERE user_id = :user_id
        ORDER BY hire_date DESC
    ");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $jobInformation = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent activity
    $stmt = $db->prepare("
        SELECT
            a.id,
            a.action,
            a.created_at,
            u.name as user_name,
            u.avatar as user_avatar
        FROM user_activity a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = :user_id
        ORDER BY a.created_at DESC
        LIMIT 10
    ");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $recentActivity = array_map(function($activity) {
        $initials = '';
        $nameParts = explode(' ', $activity['user_name']);
        if (count($nameParts) >= 2) {
            $initials = strtoupper($nameParts[0][0] . $nameParts[1][0]);
        } else if (count($nameParts) === 1) {
            $initials = strtoupper(substr($nameParts[0], 0, 2));
        }

        return [
            'id' => $activity['id'],
            'user' => [
                'name' => $activity['user_name'],
                'initials' => $initials,
                'avatar' => $activity['user_avatar']
            ],
            'action' => $activity['action'],
            'date' => date('M d, Y', strtotime($activity['created_at'])),
            'time' => date('h:i A', strtotime($activity['created_at']))
        ];
    }, $activities);

    // Get compensation data
    $stmt = $db->prepare("
        SELECT
            amount,
            currency,
            period,
            DATE_FORMAT(effective_date, '%b %d, %Y') as effective_date_formatted
        FROM user_compensation
        WHERE user_id = :user_id
        ORDER BY effective_date DESC
        LIMIT 10
    ");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $compensations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $compensationData = array_map(function($comp) {
        return [
            'amount' => $comp['amount'] . ' ' . $comp['currency'] . ' per ' . $comp['period'],
            'effectiveDate' => $comp['effective_date_formatted']
        ];
    }, $compensations);

    // Get user initials
    $initials = '';
    $nameParts = explode(' ', $profile['name']);
    if (count($nameParts) >= 2) {
        $initials = strtoupper($nameParts[0][0] . $nameParts[1][0]);
    } else if (count($nameParts) === 1) {
        $initials = strtoupper(substr($nameParts[0], 0, 2));
    }

    // Parse address to extract components (for backward compatibility)
    $fullAddress = $profile['address'] ?? '';
    $addressComponents = parseAddress($fullAddress);

    // Build response
    $response = [
        'success' => true,
        'profile' => [
            'id' => $profile['id'],
            'name' => $profile['name'],
            'username' => $profile['username'],
            'email' => $profile['email'],
            'initials' => $initials,
            'avatar' => $profile['avatar'],
            'role' => $profile['role'],
            'personalInfo' => [
                'phone' => $profile['phone'] ?? '(629) 555-0123',
                'dateOfBirth' => $profile['date_of_birth'] ?? '1988-09-26',
                'nationalId' => 'N/A', // Optional field from profile_schema.sql
                'title' => $profile['title'] ?? 'Employee',
                'hireDate' => $profile['hire_date'] ?? date('Y-m-d'),
                'address' => $addressComponents['street'],
                'cityState' => $addressComponents['cityState'],
                'postcode' => $addressComponents['postcode']
            ],
            'professionalInfo' => [
                'role' => $profile['title'] ?? 'Employee',
                'department' => $profile['department'] ?? 'General',
                'memberSince' => date('M Y', strtotime($profile['created_at']))
            ]
        ],
        'jobInformation' => $jobInformation,
        'recentActivity' => $recentActivity,
        'compensationData' => $compensationData
    ];

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Profile fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch profile data'
    ]);
}

/**
 * Parse full address into components
 * Handles format: "Street Address, City State Postcode"
 * Example: "990 Market Street, Suite 200, San Francisco CA 94102"
 */
function parseAddress($fullAddress) {
    $result = [
        'street' => 'N/A',
        'cityState' => 'N/A',
        'postcode' => 'N/A'
    ];

    if (empty($fullAddress)) {
        return $result;
    }

    // Split by comma
    $parts = array_map('trim', explode(',', $fullAddress));

    if (count($parts) === 0) {
        return $result;
    }

    // Last part might contain "City State Postcode"
    $lastPart = trim($parts[count($parts) - 1]);

    // Try to extract postcode (5 digits or 5+4 format)
    if (preg_match('/\b(\d{5}(?:-\d{4})?)\b/', $lastPart, $matches)) {
        $result['postcode'] = $matches[1];
        // Remove postcode from the string to get city/state
        $cityStatePart = trim(str_replace($matches[1], '', $lastPart));
        $result['cityState'] = $cityStatePart ?: 'N/A';
    } else {
        // No postcode found, the whole last part is city/state
        $result['cityState'] = $lastPart;
    }

    // Everything except the last part is the street address
    if (count($parts) > 1) {
        array_pop($parts); // Remove the last part (city/state/postcode)
        $result['street'] = implode(', ', $parts);
    } else {
        // Only one part, use it as street if we found a postcode
        if ($result['postcode'] !== 'N/A') {
            $result['street'] = $fullAddress;
        } else {
            $result['street'] = $fullAddress;
        }
    }

    return $result;
}
