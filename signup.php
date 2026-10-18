<?php
// 1. GLOBAL PRIVILEGE CORS HEADERS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function sendJson($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2. CONNECT TO LOCAL HOSTINGER DATABASE
$conn = new mysqli(
    'localhost',
    'u199957619_u199957619_',
    'Nish@0987654321',
    'u199957619_narayan'
);

if ($conn->connect_error) {
    sendJson(500, [
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
}

// Read incoming data stream from frontend
$data = $_POST;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== false) {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}

$fullName = trim((string) ($data['full_name'] ?? $data['fullName'] ?? $data['Name'] ?? $data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? $data['Email'] ?? ''));
$password = (string) ($data['password'] ?? $data['Password'] ?? '');

if ($fullName === '' || $email === '' || $password === '') {
    sendJson(400, [
        'success' => false,
        'message' => 'Please fill in all fields.'
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, [
        'success' => false,
        'message' => 'Invalid email address.'
    ]);
}

if (strlen($password) < 6) {
    sendJson(400, [
        'success' => false,
        'message' => 'Password must be at least 6 characters long.'
    ]);
}

$emailCheck = $conn->prepare('SELECT id FROM user WHERE email = ? LIMIT 1');
if (!$emailCheck) {
    sendJson(500, [
        'success' => false,
        'message' => 'Unable to validate user data.'
    ]);
}

$emailCheck->bind_param('s', $email);
$emailCheck->execute();
$emailCheck->store_result();

if ($emailCheck->num_rows > 0) {
    $emailCheck->close();
    $conn->close();
    sendJson(409, [
        'success' => false,
        'message' => 'This email is already registered.'
    ]);
}

$emailCheck->close();

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare('INSERT INTO user (full_name, email, password) VALUES (?, ?, ?)');
if (!$stmt) {
    sendJson(500, [
        'success' => false,
        'message' => 'Unable to prepare signup query.'
    ]);
}

$stmt->bind_param('sss', $fullName, $email, $hashedPassword);

if ($stmt->execute()) {
    $stmt->close();
    
    // 3. SECURE BACKGROUND RELAY COPY TO SPREADSHEET (INTEGRATED)
    // Passes your exact security token string as required by your Apps Script configuration
    $SECRET_TOKEN = 'Nish@0987654321'; 
    $GOOGLE_MACRO_URL = 'https://google.com' . urlencode($SECRET_TOKEN);
    
    $googlePayload = json_encode([
        'Name' => $fullName,
        'Email' => $email,
        'Password' => $password
    ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $GOOGLE_MACRO_URL,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $googlePayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true, // Crucial: dynamically follows Google's 302 redirects
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 15
    ]);
    
    curl_exec($ch); // Dispatches silently to your spreadsheet row grid
    curl_close($ch);
    
    $conn->close();
    sendJson(201, [
        'success' => true,
        'message' => 'Signup successful.'
    ]);
}

$stmt->close();
$conn->close();

sendJson(500, [
    'success' => false,
    'message' => 'Signup failed. Please try again.'
]);
