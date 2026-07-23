<?php
/**
 * Helper Functions for Response Handling and Performance
 */

/**
 * Send JSON response with optional compression
 *
 * @param mixed $data Data to send
 * @param int $statusCode HTTP status code
 * @param bool $compress Enable gzip compression
 */
function sendJsonResponse($data, int $statusCode = 200, bool $compress = true): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($compress && function_exists('gzencode') && isset($_SERVER['HTTP_ACCEPT_ENCODING'])) {
        $encodings = explode(',', $_SERVER['HTTP_ACCEPT_ENCODING']);
        $encodings = array_map('trim', $encodings);

        if (in_array('gzip', $encodings)) {
            $compressed = gzencode($json, 6);

            if ($compressed !== false && strlen($compressed) < strlen($json)) {
                header('Content-Encoding: gzip');
                header('Content-Length: ' . strlen($compressed));
                echo $compressed;
                return;
            }
        }
    }

    header('Content-Length: ' . strlen($json));
    echo $json;
}

/**
 * Send error response
 *
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendErrorResponse(string $message, int $statusCode = 400): void {
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Apply security headers
 */
function applySecurityHeaders(): void {
    SecurityHeaders::apply();
}

/**
 * Check rate limit
 *
 * @param string $key Rate limit key
 * @param int $maxAttempts Maximum attempts
 * @param int $window Time window in seconds
 * @return bool True if under limit, false if exceeded
 */
function checkRateLimit(string $key, int $maxAttempts = MAX_API_REQUESTS, int $window = API_WINDOW): bool {
    return RateLimit::attempt($key, $maxAttempts, $window);
}

/**
 * Validate required fields in input
 *
 * @param array $input Input data
 * @param array $required Required field names
 * @return array|null Array of missing fields or null if all present
 */
function validateRequiredFields(array $input, array $required): ?array {
    $missing = [];

    foreach ($required as $field) {
        if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
            $missing[] = $field;
        }
    }

    return empty($missing) ? null : $missing;
}

/**
 * Get paginated results
 *
 * @param array $data Full dataset
 * @param int $page Page number (1-indexed)
 * @param int $perPage Items per page
 * @return array Paginated data with metadata
 */
function paginate(array $data, int $page = 1, int $perPage = 20): array {
    $total = count($data);
    $totalPages = ceil($total / $perPage);
    $page = max(1, min($page, $totalPages));

    $offset = ($page - 1) * $perPage;
    $items = array_slice($data, $offset, $perPage);

    return [
        'data' => $items,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages
        ]
    ];
}

/**
 * Log performance metrics
 *
 * @param string $operation Operation name
 * @param float $duration Duration in seconds
 * @param array $context Additional context
 */
function logPerformance(string $operation, float $duration, array $context = []): void {
    if ($duration > 1.0) {
        $message = sprintf(
            'Slow operation: %s took %.4f seconds',
            $operation,
            $duration
        );

        if (!empty($context)) {
            $message .= ' - ' . json_encode($context);
        }

        error_log($message);
    }
}

/**
 * Measure execution time of a callable
 *
 * @param callable $callback Function to measure
 * @return array ['result' => mixed, 'duration' => float]
 */
function measureTime(callable $callback): array {
    $start = microtime(true);
    $result = $callback();
    $duration = microtime(true) - $start;

    return [
        'result' => $result,
        'duration' => $duration
    ];
}

/**
 * Generate ETag for response caching
 *
 * @param mixed $data Data to hash
 * @return string ETag value
 */
function generateETag($data): string {
    return '"' . md5(json_encode($data)) . '"';
}

/**
 * Check if client has valid cached version
 *
 * @param string $etag Current ETag
 * @return bool True if client cache is valid
 */
function checkClientCache(string $etag): bool {
    $clientETag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    return $clientETag === $etag;
}

/**
 * Send 304 Not Modified response
 */
function send304NotModified(string $etag): void {
    http_response_code(304);
    header('ETag: ' . $etag);
    header('Cache-Control: private, max-age=300');
    exit;
}

/**
 * Sanitize array of strings
 *
 * @param array $input Input array
 * @return array Sanitized array
 */
function sanitizeArray(array $input): array {
    return array_map(function($item) {
        return is_string($item) ? Sanitize::string($item) : $item;
    }, $input);
}

/**
 * Get client IP address (rate limiting, logging)
 *
 * @return string Client IP
 */
function getClientIp(): string {
    return Session::getClientIp();
}

/**
 * Check if request is JSON
 *
 * @return bool True if JSON request
 */
function isJsonRequest(): bool {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    return stripos($contentType, 'application/json') !== false;
}

/**
 * Get JSON input from request body
 *
 * @param bool $assoc Return as associative array
 * @return mixed Decoded JSON data
 */
function getJsonInput(bool $assoc = true) {
    $input = file_get_contents('php://input');
    return json_decode($input, $assoc);
}

/**
 * Batch database operations
 *
 * @param PDO $db Database connection
 * @param string $sql SQL with placeholders
 * @param array $dataRows Array of parameter arrays
 * @return bool Success status
 */
function batchInsert(PDO $db, string $sql, array $dataRows): bool {
    $db->beginTransaction();

    try {
        $stmt = $db->prepare($sql);

        foreach ($dataRows as $row) {
            $stmt->execute($row);
        }

        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollBack();
        error_log('Batch insert failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * Convert database result to tree structure
 *
 * @param array $data Flat data with id and parent_id
 * @param int $parentId Root parent ID
 * @return array Tree structure
 */
function buildTree(array $data, int $parentId = 0): array {
    $tree = [];

    foreach ($data as $item) {
        if ($item['parent_id'] == $parentId) {
            $children = buildTree($data, $item['id']);
            if (!empty($children)) {
                $item['children'] = $children;
            }
            $tree[] = $item;
        }
    }

    return $tree;
}

/**
 * Generate secure random token
 *
 * @param int $length Token length
 * @return string Random token
 */
function generateToken(int $length = 32): string {
    return bin2hex(random_bytes($length));
}

/**
 * Validate date string
 *
 * @param string $date Date string
 * @param string $format Date format
 * @return bool True if valid
 */
function isValidDate(string $date, string $format = 'Y-m-d'): bool {
    return Validator::date($date, $format);
}

/**
 * Get memory usage in human-readable format
 *
 * @return string Memory usage
 */
function getMemoryUsage(): string {
    $bytes = memory_get_usage(true);
    $units = ['B', 'KB', 'MB', 'GB'];

    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }

    return round($bytes, 2) . ' ' . $units[$i];
}

/**
 * Load environment variables from .env file
 * Useful for development when .env is not loaded by server
 *
 * @param string $path Path to .env file
 * @return bool True if loaded successfully
 */
function loadEnvFile(string $path = null): bool {
    if ($path === null) {
        // Try to find .env in project root (go up from config directory)
        $path = __DIR__ . '/../../../.env';
    }

    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse KEY=VALUE format
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            if (preg_match('/^(["\'])(.*)\\1$/', $value, $matches)) {
                $value = $matches[2];
            }

            // Only set if not already set in environment
            if (!getenv($key) && !isset($_ENV[$key])) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }

    return true;
}

// Auto-load .env file in development if not already loaded
if (!getenv('VITE_SUPABASE_URL') && !isset($_ENV['VITE_SUPABASE_URL'])) {
    loadEnvFile();
}
