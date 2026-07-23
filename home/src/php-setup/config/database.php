<?php
/**
 * Enhanced Database Configuration with Performance Optimizations
 *
 * Features:
 * - Connection pooling via persistent connections
 * - Prepared statement caching
 * - Query result caching
 * - Connection retry logic
 * - Performance monitoring
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u747707511_run03');
define('DB_USER', getenv('DB_USER') ?: 'u747707511_run03');
define('DB_PASS', getenv('DB_PASS') ?: '!@#$%Command12');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

/**
 * Get Optimized PDO Database Connection
 *
 * @param bool $persistent Use persistent connection (default: true)
 * @return PDO Database connection instance
 * @throws PDOException if connection fails
 */
function getDatabase(bool $persistent = true): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            "mysql:host=%s;port=%d;dbname=%s;charset=%s",
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_STRINGIFY_FETCHES  => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            PDO::MYSQL_ATTR_FOUND_ROWS   => true,
            PDO::ATTR_PERSISTENT         => $persistent,
        ];

        $maxRetries = 3;
        $retryDelay = 100000; // 100ms in microseconds

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

                $pdo->exec("SET SESSION sql_mode='TRADITIONAL'");
                $pdo->exec("SET SESSION time_zone='+00:00'");

                break;
            } catch (PDOException $e) {
                if ($attempt === $maxRetries) {
                    error_log("Database connection failed after $maxRetries attempts: " . $e->getMessage());
                    throw new PDOException("Database connection failed");
                }

                usleep($retryDelay * $attempt);
            }
        }
    }

    return $pdo;
}

/**
 * Database Helper Class with Caching and Performance Features
 */
class Database {
    private static $instance = null;
    private $pdo;
    private $statementCache = [];
    private $queryCount = 0;
    private $queryTime = 0;

    private function __construct() {
        $this->pdo = getDatabase();
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Execute query with automatic prepared statement caching
     */
    public function query(string $sql, array $params = [], bool $useCache = false) {
        $startTime = microtime(true);

        if ($useCache) {
            require_once __DIR__ . '/cache.php';
            $cached = QueryCache::get($sql, $params);
            if ($cached !== null) {
                return $cached;
            }
        }

        $stmt = $this->getPreparedStatement($sql);
        $stmt->execute($params);

        $result = $stmt->fetchAll();

        $this->queryCount++;
        $this->queryTime += (microtime(true) - $startTime);

        if ($useCache) {
            QueryCache::set($sql, $params, $result);
        }

        return $result;
    }

    /**
     * Execute write query (INSERT/UPDATE/DELETE)
     */
    public function execute(string $sql, array $params = []): bool {
        $startTime = microtime(true);

        $stmt = $this->getPreparedStatement($sql);
        $result = $stmt->execute($params);

        $this->queryCount++;
        $this->queryTime += (microtime(true) - $startTime);

        return $result;
    }

    /**
     * Get single row
     */
    public function queryOne(string $sql, array $params = [], bool $useCache = false) {
        $results = $this->query($sql, $params, $useCache);
        return $results[0] ?? null;
    }

    /**
     * Get single value
     */
    public function queryValue(string $sql, array $params = [], bool $useCache = false) {
        $result = $this->queryOne($sql, $params, $useCache);
        return $result ? reset($result) : null;
    }

    /**
     * Begin transaction
     */
    public function beginTransaction(): bool {
        return $this->pdo->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit(): bool {
        return $this->pdo->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback(): bool {
        return $this->pdo->rollBack();
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId(): string {
        return $this->pdo->lastInsertId();
    }

    /**
     * Get prepared statement with caching
     */
    private function getPreparedStatement(string $sql): PDOStatement {
        $hash = md5($sql);

        if (!isset($this->statementCache[$hash])) {
            $this->statementCache[$hash] = $this->pdo->prepare($sql);
        }

        return $this->statementCache[$hash];
    }

    /**
     * Get performance statistics
     */
    public function getStats(): array {
        return [
            'query_count' => $this->queryCount,
            'query_time' => round($this->queryTime, 4),
            'avg_query_time' => $this->queryCount > 0 ? round($this->queryTime / $this->queryCount, 4) : 0,
            'cached_statements' => count($this->statementCache)
        ];
    }

    /**
     * Clear statement cache
     */
    public function clearStatementCache(): void {
        $this->statementCache = [];
    }

    /**
     * Get raw PDO instance
     */
    public function getPDO(): PDO {
        return $this->pdo;
    }
}
