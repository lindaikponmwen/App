<?php
require_once 'config.php';

// Validate Request Method
validateRequestMethod('GET');

if (!isset($_GET['filename']) || !isset($_GET['prefix'])) {
    sendError('Missing filename or prefix');
}

$filename = $_GET['filename'];
$prefix = $_GET['prefix'];
$method = isset($_GET['method']) ? strtoupper($_GET['method']) : 'PUT';

if (!in_array($method, ['PUT', 'DELETE'])) {
    sendError('Invalid method. Only PUT and DELETE are supported.');
}

if (strlen($filename) > MAX_FILE_NAME_LENGTH) {
    sendError('Filename too long');
}

// Sanitize key
$objectKey = $prefix . $filename;
$objectKey = str_replace('//', '/', $objectKey); 
$objectKey = ltrim($objectKey, '/');

/**
 * Generate AWS Signature V4 Pre-signed URL
 */
function generatePresignedUrl($bucket, $key, $region, $accessKeyId, $secretAccessKey, $expiry, $method) {
    // Timestamp
    $timestamp = time();
    $dateStamp = gmdate('Ymd', $timestamp);
    $amzDate = gmdate('Ymd\THis\Z', $timestamp);
    
    $service = 's3';

    // Host
    $host = "{$bucket}.s3.{$region}.amazonaws.com";

    // Credential scope
    $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";

    // Canonical URI
    $canonicalUri = '/' . str_replace('%2F', '/', rawurlencode($key));

    // Query parameters
    $algorithm = 'AWS4-HMAC-SHA256';
    $queryParams = [
        'X-Amz-Algorithm' => $algorithm,
        'X-Amz-Credential' => "{$accessKeyId}/{$credentialScope}",
        'X-Amz-Date' => $amzDate,
        'X-Amz-Expires' => $expiry,
        'X-Amz-SignedHeaders' => 'host'
    ];

    ksort($queryParams);
    $canonicalQueryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);

    // Canonical Headers
    $canonicalHeaders = "host:{$host}\n";
    $signedHeaders = 'host';
    
    $payloadHash = 'UNSIGNED-PAYLOAD';

    // Construct Canonical Request
    $canonicalRequest = "{$method}\n{$canonicalUri}\n{$canonicalQueryString}\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";

    // String to sign
    $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

    // Calculate signature
    $signingKey = getSignatureKey($secretAccessKey, $dateStamp, $region, $service);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    return "https://{$host}{$canonicalUri}?{$canonicalQueryString}&X-Amz-Signature={$signature}";
}

function getSignatureKey($key, $dateStamp, $regionName, $serviceName) {
    $kSecret = 'AWS4' . $key;
    $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
    $kRegion = hash_hmac('sha256', $regionName, $kDate, true);
    $kService = hash_hmac('sha256', $serviceName, $kRegion, true);
    $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
    return $kSigning;
}

try {
    $presignedUrl = generatePresignedUrl(
        AWS_BUCKET,
        $objectKey,
        AWS_DEFAULT_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        PRESIGNED_URL_EXPIRY,
        $method
    );

    echo json_encode([
        'url' => $presignedUrl,
        'key' => $objectKey,
        'method' => $method
    ]);

} catch (Exception $e) {
    sendError('Failed to generate signature: ' . $e->getMessage(), 500);
}
?>