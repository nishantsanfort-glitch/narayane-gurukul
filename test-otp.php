<?php
header('Content-Type: application/json');

$GETOTP_API_KEY = '8f423c2ffd3d5df45b3fec688221db80';

// Test 1: Check if API is reachable
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.otp.dev/v1/senders',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'X-OTP-Key: ' . $GETOTP_API_KEY,
        'Accept: application/json'
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

$response = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);
curl_close($curl);

echo json_encode([
    'test' => 'API Connectivity Check',
    'http_code' => $http_code,
    'curl_error' => $curl_error,
    'response' => json_decode($response, true),
    'raw_response' => $response
], JSON_PRETTY_PRINT);
?>
