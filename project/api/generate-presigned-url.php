<?php
require_once 'config.php';

// Validate Request Method
validateRequestMethod('GET');

if (!isset($_GET['filename']) || !isset($_GET['prefix'])) {
    sendError('Missing filename or prefix');
}

$filename = $_GET['filename'];
$prefix = $_GET['prefix'];

if (strlen($filename) > MAX_FILE_NAME_LENGTH) {
    sendError('Filename too long');
}

// Sanitize key
// Allow alphanumeric, underscores, dashes, dots, and slashes.
// Ensure we don't have double slashes from concatenation if prefix has trailing slash and filename has leading slash.
$objectKey = $prefix . $filename;
$objectKey = str_replace('//', '/', $objectKey); 
// Basic protection against directory traversal if the prefix isn't strictly controlled
$objectKey = ltrim($objectKey, '/');

/**
 * Generate AWS Signature V4 Pre-signed URL for S3 PUT operation
 *
 * @param string $bucket S3 bucket name
 * @param string $key Object key (path) in S3
 * @param string $region AWS region
 * @param string $accessKeyId AWS access key ID
 * @param string $secretAccessKey AWS secret access key
 * @param int $expiry Expiry time in seconds
 * @return string Pre-signed URL
 */
function generatePresignedUrl($bucket, $key, $region, $accessKeyId, $secretAccessKey, $expiry) {
    // Timestamp
    $timestamp = time();
    $dateStamp = gmdate('Ymd', $timestamp);
    $amzDate = gmdate('Ymd\THis\Z', $timestamp);
    
    // HTTP Method and Service
    $method = 'PUT';
    $service = 's3';

    // Host
    // Using virtual-hosted-style access
    $host = "{$bucket}.s3.{$region}.amazonaws.com";

    // Credential scope
    $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";

    // Canonical URI
    // S3 expects the path to be URL-encoded, but typically preserves forward slashes '/' 
    // for folder structures in the signature calculation.
    // rawurlencode encodes '/' as '%2F', so we revert that specific encoding for the path.
    $canonicalUri = '/' . str_replace('%2F', '/', rawurlencode($key));

    // Query parameters for pre-signed URL
    $algorithm = 'AWS4-HMAC-SHA256';
    $queryParams = [
        'X-Amz-Algorithm' => $algorithm,
        'X-Amz-Credential' => "{$accessKeyId}/{$credentialScope}",
        'X-Amz-Date' => $amzDate,
        'X-Amz-Expires' => $expiry,
        'X-Amz-SignedHeaders' => 'host'
    ];

    // Sort query parameters (Required for SigV4)
    ksort($queryParams);

    // Build canonical query string
    // Use RFC 3986 encoding (spaces as %20) which is preferred by AWS
    $canonicalQueryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);

    // Canonical Headers
    // We are only signing the 'host' header to allow flexibility in other headers (like Content-Type) from the frontend
    $canonicalHeaders = "host:{$host}\n";
    $signedHeaders = 'host';
    
    // Payload Hash
    // For a pre-signed URL, the payload hash is "UNSIGNED-PAYLOAD"
    $payloadHash = 'UNSIGNED-PAYLOAD';

    // Construct Canonical Request
    $canonicalRequest = "{$method}\n{$canonicalUri}\n{$canonicalQueryString}\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";

    // String to sign
    $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

    // Calculate signature
    $signingKey = getSignatureKey($secretAccessKey, $dateStamp, $region, $service);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    // Build final URL
    return "https://{$host}{$canonicalUri}?{$canonicalQueryString}&X-Amz-Signature={$signature}";
}

/**
 * Calculate AWS Signature V4 Signing Key
 *
 * @param string $secretAccessKey AWS secret access key
 * @param string $dateStamp Date stamp (YYYYMMDD)
 * @param string $region AWS region
 * @param string $serviceName AWS Service name
 * @return string Binary signing key
 */
function getSignatureKey($key, $dateStamp, $regionName, $serviceName) {
    $kSecret = 'AWS4' . $key;
    $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
    $kRegion = hash_hmac('sha256', $regionName, $kDate, true);
    $kService = hash_hmac('sha256', $serviceName, $kRegion, true);
    $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
    return $kSigning;
}

try {
    // Generate the URL
    $presignedUrl = generatePresignedUrl(
        AWS_BUCKET,
        $objectKey,
        AWS_DEFAULT_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        PRESIGNED_URL_EXPIRY
    );

    // Return JSON response matching frontend expectations
    echo json_encode([
        'url' => $presignedUrl,
        'key' => $objectKey,
        'method' => 'PUT'
    ]);

} catch (Exception $e) {
    sendError('Failed to generate signature: ' . $e->getMessage(), 500);
}
?>