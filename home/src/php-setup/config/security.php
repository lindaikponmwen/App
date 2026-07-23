<?php
/**
 * Enhanced Security Configuration
 *
 * Comprehensive security features including:
 * - Session management with hijacking protection
 * - CSRF protection with token rotation
 * - Rate limiting with configurable thresholds
 * - Input sanitization and validation
 * - Security headers
 * - IP filtering
 * - Password policy enforcement
 */

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
ini_set('session.sid_length', 48);
ini_set('session.sid_bits_per_character', 6);

// Enable secure cookies in production (requires HTTPS)
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// CSRF Token configuration
define('CSRF_TOKEN_NAME', '_csrf_token');
define('CSRF_TOKEN_EXPIRY', 3600); // 1 hour

// Password configuration
define('PASSWORD_MIN_LENGTH', 8);
define('PASSWORD_COST', 12); // bcrypt cost factor

// Session timeout (in seconds)
define('SESSION_TIMEOUT', 86400); // 24 hours
define('INACTIVITY_TIMEOUT', 1800); // 30 minutes

// Rate limiting
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_ATTEMPT_WINDOW', 900); // 15 minutes
define('MAX_API_REQUESTS', 60);
define('API_WINDOW', 60); // 60 requests per minute

/**
 * CSRF Protection Class with Multiple Token Support
 */
class CSRF {
    private static $maxTokens = 5;

    public static function generateToken(): string {
        Session::start();

        $token = bin2hex(random_bytes(32));
        $tokenTime = time();

        if (!isset($_SESSION['csrf_tokens'])) {
            $_SESSION['csrf_tokens'] = [];
        }

        self::cleanOldTokens();

        $_SESSION['csrf_tokens'][$token] = $tokenTime;

        while (count($_SESSION['csrf_tokens']) > self::$maxTokens) {
            array_shift($_SESSION['csrf_tokens']);
        }

        return $token;
    }

    public static function validateToken(string $token): bool {
        Session::start();

        if (empty($token) || !isset($_SESSION['csrf_tokens'][$token])) {
            return false;
        }

        $tokenTime = $_SESSION['csrf_tokens'][$token];

        if (time() - $tokenTime > CSRF_TOKEN_EXPIRY) {
            unset($_SESSION['csrf_tokens'][$token]);
            return false;
        }
        //only unset each time if you need to always invalidate token
        //unset($_SESSION['csrf_tokens'][$token]);

        return true;
    }

    public static function getToken(): string {
        Session::start();

        if (!isset($_SESSION['csrf_tokens']) || empty($_SESSION['csrf_tokens'])) {
            return self::generateToken();
        }

        $tokens = $_SESSION['csrf_tokens'];
        $latestToken = array_key_last($tokens);

        if (time() - $tokens[$latestToken] > CSRF_TOKEN_EXPIRY) {
            return self::generateToken();
        }

        return $latestToken;
    }

    private static function cleanOldTokens(): void {
        if (!isset($_SESSION['csrf_tokens'])) {
            return;
        }

        $now = time();
        foreach ($_SESSION['csrf_tokens'] as $token => $timestamp) {
            if ($now - $timestamp > CSRF_TOKEN_EXPIRY) {
                unset($_SESSION['csrf_tokens'][$token]);
            }
        }
    }
}

/**
 * Password Hashing Utilities
 */
class PasswordHash {
    /**
     * Hash password using bcrypt
     *
     * @param string $password Plain text password
     * @return string Hashed password
     */
    public static function hash($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
    }

    /**
     * Verify password against hash
     *
     * @param string $password Plain text password
     * @param string $hash Hashed password
     * @return bool True if password matches, false otherwise
     */
    public static function verify($password, $hash) {
        return password_verify($password, $hash);
    }

    /**
     * Check if password needs rehashing
     *
     * @param string $hash Hashed password
     * @return bool True if needs rehashing, false otherwise
     */
    public static function needsRehash($hash) {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
    }
}

/**
 * UID Generator for unique user identifiers
 */
class UIDGenerator {
    /**
     * Generate a unique alphanumeric UID
     * Length: 5-15 characters (default: 10)
     *
     * @param PDO $db Database connection to check uniqueness
     * @param int $length Length of UID (5-15)
     * @return string Unique UID
     */
    public static function generate($db, int $length = 10): string {
        // Validate length
        if ($length < 5 || $length > 15) {
            $length = 10;
        }

        $maxAttempts = 100;
        $attempts = 0;

        do {
            $uid = self::generateRandomUID($length);
            $attempts++;

            // Check if UID exists in database
            $stmt = $db->prepare("SELECT id FROM users WHERE uid = ?");
            $stmt->execute([$uid]);
            $exists = $stmt->fetch();

            if (!$exists) {
                return $uid;
            }

            // If too many attempts, increase length
            if ($attempts >= $maxAttempts && $length < 15) {
                $length++;
                $attempts = 0;
            }

        } while ($attempts < $maxAttempts * 2);

        // Fallback: use timestamp-based UID
        return self::generateFallbackUID($length);
    }

    /**
     * Generate random alphanumeric string
     *
     * @param int $length Length of string
     * @return string Random alphanumeric string
     */
    private static function generateRandomUID(int $length): string {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        $charactersLength = strlen($characters);
        $uid = '';

        for ($i = 0; $i < $length; $i++) {
            $uid .= $characters[random_int(0, $charactersLength - 1)];
        }

        return $uid;
    }

    /**
     * Generate fallback UID using timestamp and random bytes
     *
     * @param int $length Length of UID
     * @return string Fallback UID
     */
    private static function generateFallbackUID(int $length): string {
        $timestamp = base_convert(time(), 10, 36);
        $random = bin2hex(random_bytes(ceil($length / 2)));
        $combined = strtoupper(substr($timestamp . $random, 0, $length));
        return $combined;
    }
}

/**
 * Enhanced Session Management with Hijacking Protection
 */
class Session {
    private static $started = false;

    public static function start(): bool {
        if (self::$started) {
            return true;
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_name('DRLEVY_SESSION');
            session_start();
            self::$started = true;

            if (!self::validateSession()) {
                self::destroy();
                return false;
            }

            if (!isset($_SESSION['created'])) {
                $_SESSION['created'] = time();
            } elseif (time() - $_SESSION['created'] > 1800) {
                session_regenerate_id(true);
                $_SESSION['created'] = time();
            }

            if (isset($_SESSION['last_activity'])) {
                if (time() - $_SESSION['last_activity'] > INACTIVITY_TIMEOUT) {
                    self::destroy();
                    return false;
                }
            }
            $_SESSION['last_activity'] = time();
        }

        return true;
    }

    private static function validateSession(): bool {
        $currentUserAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (isset($_SESSION['user_agent'])) {
            if ($_SESSION['user_agent'] !== $currentUserAgent) {
                return false;
            }
        } else {
            $_SESSION['user_agent'] = $currentUserAgent;
        }

        return true;
    }

    public static function isLoggedIn(): bool {
        return isset($_SESSION['user_id']) && isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
    }

    public static function login(array $user, bool $rememberMe = false): void {
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['authenticated'] = true;
        $_SESSION['login_time'] = time();
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    public static function setUser($userData) {
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['username'] = $userData['username'];
        $_SESSION['role'] = $userData['role'];
        $_SESSION['authenticated'] = true;
        $_SESSION['login_time'] = time();
    }

    public static function getUser(): ?array {
        if (!self::isLoggedIn()) {
            return null;
        }

        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ];
    }

    public static function destroy(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];

            if (isset($_COOKIE[session_name()])) {
                setcookie(session_name(), '', time() - 3600, '/');
            }

            session_destroy();
            self::$started = false;
        }
    }

    public static function regenerate() {
        session_regenerate_id(true);
        $_SESSION['last_regeneration'] = time();
    }

    public static function getClientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        $proxyHeaders = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP'
        ];

        foreach ($proxyHeaders as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                break;
            }
        }

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
    }
}

/**
 * Enhanced Rate Limiting with Persistent Storage
 */
class RateLimit {
    private static $storageFile = '/tmp/rate_limits.json';

    public static function attempt(string $key, int $maxAttempts = MAX_LOGIN_ATTEMPTS, int $windowSeconds = LOGIN_ATTEMPT_WINDOW): bool {
        $attempts = self::getAttempts($key);
        $now = time();

        $attempts = array_filter($attempts, function($timestamp) use ($now, $windowSeconds) {
            return $now - $timestamp < $windowSeconds;
        });

        if (count($attempts) >= $maxAttempts) {
            error_log("Rate limit exceeded for key: $key");
            return false;
        }

        $attempts[] = $now;
        self::saveAttempts($key, $attempts);

        return true;
    }

    public static function isExceeded($identifier, $action = 'login'): bool {
        return !self::attempt($action . '_' . $identifier, MAX_LOGIN_ATTEMPTS, LOGIN_ATTEMPT_WINDOW);
    }

    public static function recordAttempt($identifier, $action = 'login'): void {
        $key = $action . '_' . $identifier;
        $attempts = self::getAttempts($key);
        $attempts[] = time();
        self::saveAttempts($key, $attempts);
    }

    public static function reset($identifier, $action = 'login'): void {
        $key = $action . '_' . $identifier;
        $data = self::loadData();
        unset($data[$key]);
        self::saveData($data);
    }

    private static function getAttempts(string $key): array {
        $data = self::loadData();
        return $data[$key] ?? [];
    }

    private static function saveAttempts(string $key, array $attempts): void {
        $data = self::loadData();
        $data[$key] = $attempts;
        self::saveData($data);
    }

    private static function loadData(): array {
        if (!file_exists(self::$storageFile)) {
            return [];
        }

        $content = @file_get_contents(self::$storageFile);
        return $content ? json_decode($content, true) : [];
    }

    private static function saveData(array $data): void {
        @file_put_contents(self::$storageFile, json_encode($data), LOCK_EX);
    }
}

/**
 * Enhanced Input Sanitization
 */
class Sanitize {
    public static function string(?string $input): string {
        if ($input === null) {
            return '';
        }
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public static function email(?string $input): string {
        if ($input === null) {
            return '';
        }
        return filter_var(trim($input), FILTER_SANITIZE_EMAIL);
    }

    public static function isValidEmail($email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function int($input): int {
        return (int) filter_var($input, FILTER_SANITIZE_NUMBER_INT);
    }

    public static function float($input): float {
        return (float) filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }

    public static function url(?string $input): string {
        if ($input === null) {
            return '';
        }
        return filter_var(trim($input), FILTER_SANITIZE_URL);
    }

    public static function filename(?string $input): string {
        if ($input === null) {
            return '';
        }
        $input = basename($input);
        $input = preg_replace('/[^a-zA-Z0-9._-]/', '', $input);
        return $input;
    }
}

/**
 * Input Validation Class
 */
class Validator {
    public static function email(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function url(string $url): bool {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    public static function length(string $input, int $min, int $max): bool {
        $length = mb_strlen($input);
        return $length >= $min && $length <= $max;
    }

    public static function required($input): bool {
        if (is_string($input)) {
            return trim($input) !== '';
        }
        return !empty($input);
    }

    public static function date(string $date, string $format = 'Y-m-d'): bool {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    public static function enum(string $value, array $allowedValues): bool {
        return in_array($value, $allowedValues, true);
    }
}

/**
 * Security Headers Class
 */
class SecurityHeaders {
    public static function apply(): void {
        header('X-Frame-Options: DENY');
        header('X-Content-Type-Options: nosniff');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header("Content-Security-Policy: default-src 'self'");

        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }
}
