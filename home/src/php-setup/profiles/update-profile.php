<?php
/**
 * Update User Profile Information
 *
 * Allows updating:
 * - Personal information (phone, address, etc.)
 * - Contact details
 * - Employee details
 *
 * Security: Requires authentication, validates input, uses prepared statements
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

    // Verify CSRF token
    $headers = getallheaders();
    $csrfToken = $headers['X-Csrf-Token'] ?? '';

    if (!Security::validateCsrfToken($csrfToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid CSRF token. Refresh the page and try again.'
        ]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid input data'
        ]);
        exit;
    }

    $db = getDatabase();
    $section = $input['section'] ?? null;

    // Begin transaction
    $db->beginTransaction();

    try {
        switch ($section) {
            case 'contact':
                // Update contact information
                $stmt = $db->prepare("
                    UPDATE users
                    SET phone = :phone,
                        email = :email,
                        updated_at = NOW()
                    WHERE id = :user_id
                ");

                $phone = sanitizeInput($input['phone'] ?? '');
                $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);

                if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception('Invalid email format');
                }

                $stmt->bindParam(':phone', $phone);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':user_id', $userId);
                $stmt->execute();
                break;

            case 'address':
                // Update address information
                // Combine components into single address field (base schema only has 'address')
                $stmt = $db->prepare("
                    UPDATE users
                    SET address = :address,
                        updated_at = NOW()
                    WHERE id = :user_id
                ");

                $street = sanitizeInput($input['address'] ?? '');
                $cityState = sanitizeInput($input['cityState'] ?? '');
                $postcode = sanitizeInput($input['postcode'] ?? '');

                // Combine into full address format
                $fullAddress = trim($street);
                if (!empty($cityState)) {
                    $fullAddress .= ', ' . $cityState;
                    if (!empty($postcode)) {
                        $fullAddress .= ' ' . $postcode;
                    }
                }

                $stmt->bindParam(':address', $fullAddress);
                $stmt->bindParam(':user_id', $userId);
                $stmt->execute();
                break;

            case 'employee':
                // Update employee details
                // Note: national_id is optional (only in profile_schema.sql)
                $stmt = $db->prepare("
                    UPDATE users
                    SET date_of_birth = :date_of_birth,
                        title = :title,
                        hire_date = :hire_date,
                        updated_at = NOW()
                    WHERE id = :user_id
                ");

                $dateOfBirth = $input['dateOfBirth'] ?? null;
                $title = sanitizeInput($input['title'] ?? '');
                $hireDate = $input['hireDate'] ?? null;

                // Validate dates
                if ($dateOfBirth && !validateDate($dateOfBirth)) {
                    throw new Exception('Invalid date of birth format');
                }
                if ($hireDate && !validateDate($hireDate)) {
                    throw new Exception('Invalid hire date format');
                }

                $stmt->bindParam(':date_of_birth', $dateOfBirth);
                $stmt->bindParam(':title', $title);
                $stmt->bindParam(':hire_date', $hireDate);
                $stmt->bindParam(':user_id', $userId);
                $stmt->execute();
                break;

            case 'avatar':
                // Update avatar URL
                $stmt = $db->prepare("
                    UPDATE users
                    SET avatar = :avatar,
                        updated_at = NOW()
                    WHERE id = :user_id
                ");

                $avatar = filter_var($input['avatar'] ?? '', FILTER_SANITIZE_URL);

                $stmt->bindParam(':avatar', $avatar);
                $stmt->bindParam(':user_id', $userId);
                $stmt->execute();
                break;

            default:
                throw new Exception('Invalid section specified');
        }

        // Log the profile update activity
        $stmt = $db->prepare("
            INSERT INTO user_activity (user_id, action, created_at)
            VALUES (:user_id, :action, NOW())
        ");

        $action = "updated profile section: {$section}";
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':action', $action);
        $stmt->execute();

        // Commit transaction
        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Profile update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}
