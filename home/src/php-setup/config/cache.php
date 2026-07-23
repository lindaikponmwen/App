<?php
/**
 * Caching Layer for Performance Optimization
 *
 * Provides file-based caching with TTL support
 * Can be easily swapped with Redis/Memcached for production
 */

class Cache {
    private static $cacheDir = '/tmp/drlevy_cache';
    private static $defaultTTL = 3600; // 1 hour
    private static $enabled = true;

    /**
     * Initialize cache directory
     */
    private static function init(): void {
        if (!file_exists(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0755, true);
        }
    }

    /**
     * Get item from cache
     *
     * @param string $key Cache key
     * @return mixed|null Cached value or null if not found/expired
     */
    public static function get(string $key) {
        if (!self::$enabled) {
            return null;
        }

        self::init();

        $filename = self::getFilename($key);

        if (!file_exists($filename)) {
            return null;
        }

        $data = @file_get_contents($filename);
        if ($data === false) {
            return null;
        }

        $cached = @unserialize($data);
        if ($cached === false) {
            self::delete($key);
            return null;
        }

        if ($cached['expiry'] > 0 && time() > $cached['expiry']) {
            self::delete($key);
            return null;
        }

        return $cached['value'];
    }

    /**
     * Store item in cache
     *
     * @param string $key Cache key
     * @param mixed $value Value to cache
     * @param int $ttl Time to live in seconds (0 = no expiry)
     * @return bool Success status
     */
    public static function set(string $key, $value, int $ttl = null): bool {
        if (!self::$enabled) {
            return false;
        }

        self::init();

        $ttl = $ttl ?? self::$defaultTTL;
        $expiry = $ttl > 0 ? time() + $ttl : 0;

        $data = serialize([
            'value' => $value,
            'expiry' => $expiry,
            'created' => time()
        ]);

        $filename = self::getFilename($key);
        return @file_put_contents($filename, $data, LOCK_EX) !== false;
    }

    /**
     * Delete item from cache
     *
     * @param string $key Cache key
     * @return bool Success status
     */
    public static function delete(string $key): bool {
        self::init();

        $filename = self::getFilename($key);
        if (file_exists($filename)) {
            return @unlink($filename);
        }

        return true;
    }

    /**
     * Check if cache key exists and is valid
     *
     * @param string $key Cache key
     * @return bool True if exists and valid
     */
    public static function has(string $key): bool {
        return self::get($key) !== null;
    }

    /**
     * Clear all cache
     *
     * @return bool Success status
     */
    public static function clear(): bool {
        self::init();

        $files = glob(self::$cacheDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }

        return true;
    }

    /**
     * Remember - Get from cache or execute callback and cache result
     *
     * @param string $key Cache key
     * @param callable $callback Function to execute if cache miss
     * @param int $ttl Time to live in seconds
     * @return mixed Cached or computed value
     */
    public static function remember(string $key, callable $callback, int $ttl = null) {
        $value = self::get($key);

        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        self::set($key, $value, $ttl);

        return $value;
    }

    /**
     * Get cache filename for key
     *
     * @param string $key Cache key
     * @return string Full path to cache file
     */
    private static function getFilename(string $key): string {
        return self::$cacheDir . '/' . md5($key) . '.cache';
    }

    /**
     * Clean expired cache entries
     *
     * @return int Number of deleted entries
     */
    public static function cleanExpired(): int {
        self::init();

        $deleted = 0;
        $files = glob(self::$cacheDir . '/*');

        foreach ($files as $file) {
            if (!is_file($file)) {
                continue;
            }

            $data = @file_get_contents($file);
            if ($data === false) {
                continue;
            }

            $cached = @unserialize($data);
            if ($cached === false) {
                @unlink($file);
                $deleted++;
                continue;
            }

            if ($cached['expiry'] > 0 && time() > $cached['expiry']) {
                @unlink($file);
                $deleted++;
            }
        }

        return $deleted;
    }

    /**
     * Get cache statistics
     *
     * @return array Cache stats
     */
    public static function stats(): array {
        self::init();

        $files = glob(self::$cacheDir . '/*');
        $totalSize = 0;
        $entryCount = 0;
        $expiredCount = 0;

        foreach ($files as $file) {
            if (!is_file($file)) {
                continue;
            }

            $entryCount++;
            $totalSize += filesize($file);

            $data = @file_get_contents($file);
            if ($data !== false) {
                $cached = @unserialize($data);
                if ($cached !== false && $cached['expiry'] > 0 && time() > $cached['expiry']) {
                    $expiredCount++;
                }
            }
        }

        return [
            'entries' => $entryCount,
            'expired' => $expiredCount,
            'size_bytes' => $totalSize,
            'size_mb' => round($totalSize / 1024 / 1024, 2)
        ];
    }

    /**
     * Enable caching
     */
    public static function enable(): void {
        self::$enabled = true;
    }

    /**
     * Disable caching
     */
    public static function disable(): void {
        self::$enabled = false;
    }

    /**
     * Tag-based cache invalidation
     * Useful for clearing related cache entries
     */
    public static function tags(array $tags): CacheTagManager {
        return new CacheTagManager($tags);
    }
}

/**
 * Cache Tag Manager for grouped cache invalidation
 */
class CacheTagManager {
    private $tags;

    public function __construct(array $tags) {
        $this->tags = $tags;
    }

    public function get(string $key) {
        $taggedKey = $this->getTaggedKey($key);
        return Cache::get($taggedKey);
    }

    public function set(string $key, $value, int $ttl = null): bool {
        $taggedKey = $this->getTaggedKey($key);
        return Cache::set($taggedKey, $value, $ttl);
    }

    public function flush(): void {
        foreach ($this->tags as $tag) {
            $tagKey = 'cache_tag_' . $tag;
            Cache::delete($tagKey);
        }
    }

    private function getTaggedKey(string $key): string {
        $tagVersions = [];
        foreach ($this->tags as $tag) {
            $tagKey = 'cache_tag_' . $tag;
            $version = Cache::get($tagKey);
            if ($version === null) {
                $version = time();
                Cache::set($tagKey, $version, 0); // Never expires
            }
            $tagVersions[] = $version;
        }
        return implode(':', $tagVersions) . ':' . $key;
    }
}

/**
 * Query Result Cache
 * Specialized caching for database queries
 */
class QueryCache {
    private static $enabled = true;
    private static $defaultTTL = 300; // 5 minutes

    public static function get(string $query, array $params = []) {
        if (!self::$enabled) {
            return null;
        }

        $key = self::generateKey($query, $params);
        return Cache::get($key);
    }

    public static function set(string $query, array $params, $result, int $ttl = null): bool {
        if (!self::$enabled) {
            return false;
        }

        $key = self::generateKey($query, $params);
        return Cache::set($key, $result, $ttl ?? self::$defaultTTL);
    }

    public static function invalidate(string $table): void {
        Cache::tags(['table:' . $table])->flush();
    }

    private static function generateKey(string $query, array $params): string {
        return 'query:' . md5($query . serialize($params));
    }

    public static function enable(): void {
        self::$enabled = true;
    }

    public static function disable(): void {
        self::$enabled = false;
    }
}
