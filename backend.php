<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


/* =========================================================
   CONFIGURATION
   ========================================================= */

// GetOTP
$GETOTP_API_KEY = 'YOUR_GETOTP_API_KEY_HERE';
$GETOTP_API_BASE = 'https://api.otp.dev/v1';

// Local OTP storage
$OTP_STORAGE_DIR = sys_get_temp_dir() . '/narayan_otp/';

// Student Performance Sheet
$STUDENT_PERFORMANCE_API = 'https://sheetdb.io/api/v1/olmuisnusfk7y';

// Login Sheet
$LOGIN_API = 'https://sheetdb.io/api/v1/21vykfg0khlb5';


/* =========================================================
   CREATE OTP STORAGE DIRECTORY
   ========================================================= */

if (!is_dir($OTP_STORAGE_DIR)) {
    @mkdir($OTP_STORAGE_DIR, 0755, true);
}


/* =========================================================
   GET ACTION
   ========================================================= */

$action = $_POST['action'] ?? $_GET['action'] ?? null;

function lookupGoogleSheetUserByEmail($email) {
    $google_script_url = 'https://google.com';

    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $google_script_url,
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'email' => $email
        ])
    ]);

    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($response === false || $http_code >= 400) {
        return null;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        return null;
    }

    $users = $data;
    if (isset($data['data']) && is_array($data['data'])) {
        $users = $data['data'];
    }

    if (!is_array($users)) {
        return null;
    }

    foreach ($users as $user) {
        if (!is_array($user)) {
            continue;
        }

        $stored_email = strtolower(trim((string) ($user['Email'] ?? $user['email'] ?? '')));
        if ($stored_email === strtolower(trim($email))) {
            return [
                'Name' => (string) ($user['Name'] ?? $user['name'] ?? ''),
                'Password' => (string) ($user['Password'] ?? $user['password'] ?? '')
            ];
        }
    }

    return null;
}

if ($_POST['action'] === 'login_password') {
    $email = $_POST['email'] ?? null;
    $password = $_POST['password'] ?? null;

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email address.'
        ]);
        exit;
    }

    if ($password === null || $password === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Password is required.'
        ]);
        exit;
    }

    $google_user = lookupGoogleSheetUserByEmail($email);

    if (!$google_user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Email not found in the sheet.'
        ]);
        exit;
    }

    if (($google_user['Password'] ?? '') !== $password) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid password.'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'name' => $google_user['Name']
    ]);
    exit;
}


/* =========================================================
   SEND OTP
   ========================================================= */

if ($action === 'send_otp') {

    $email = $_POST['email'] ?? null;

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid email address.'
        ]);

        exit;
    }


    // Generate local OTP
    $otp_code = str_pad(
        random_int(0, 999999),
        6,
        '0',
        STR_PAD_LEFT
    );

    $request_id = bin2hex(random_bytes(16));


    // GetOTP request
    $payload = json_encode([
        'data' => [
            'channel' => 'email',
            'email' => $email,
            'code_length' => 6,
            'sender' => 'Narayan e-Gurukul'
        ]
    ]);


    $curl = curl_init();

    curl_setopt_array($curl, [

        CURLOPT_URL => $GETOTP_API_BASE . '/verifications',

        CURLOPT_RETURNTRANSFER => true,

        CURLOPT_ENCODING => '',

        CURLOPT_MAXREDIRS => 10,

        CURLOPT_TIMEOUT => 10,

        CURLOPT_FOLLOWLOCATION => true,

        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,

        CURLOPT_CUSTOMREQUEST => 'POST',

        CURLOPT_POSTFIELDS => $payload,

        CURLOPT_HTTPHEADER => [
            'X-OTP-Key: ' . $GETOTP_API_KEY,
            'Content-Type: application/json',
            'Accept: application/json'
        ],

        CURLOPT_SSL_VERIFYPEER => true,

        CURLOPT_SSL_VERIFYHOST => 2

    ]);


    $response = curl_exec($curl);

    $http_code = curl_getinfo(
        $curl,
        CURLINFO_HTTP_CODE
    );

    $curl_error = curl_error($curl);

    curl_close($curl);


    $getotp_worked = false;


    if (
        !$curl_error &&
        ($http_code === 200 || $http_code === 201)
    ) {

        $data = json_decode(
            $response,
            true
        );


        if (
            $data &&
            isset($data['message_id'])
        ) {

            $getotp_worked = true;

            echo json_encode([
                'success' => true,
                'request_id' => $data['message_id'],
                'message' => 'OTP sent successfully via GetOTP.',
                'method' => 'getotp'
            ]);

            exit;
        }
    }


    /* =====================================================
       FALLBACK PHP MAIL OTP
       ===================================================== */

    $otp_file =
        $OTP_STORAGE_DIR .
        md5($email) .
        '.json';


    $otp_data = json_encode([

        'email' => $email,

        'code' => $otp_code,

        'request_id' => $request_id,

        'created_at' => time(),

        'expires_at' => time() + 600

    ]);


    file_put_contents(
        $otp_file,
        $otp_data
    );


    $subject =
        'Your Narayan e-Gurukul OTP Code';


    $message =
        "Your One-Time Password (OTP) is: "
        . $otp_code
        . "\n\n";

    $message .=
        "This OTP will expire in 10 minutes.\n";

    $message .=
        "If you didn't request this, please ignore this email.\n\n";

    $message .=
        "Regards,\nNarayan e-Gurukul Team";


    $headers =
        "From: noreply@narayenegurukul.com\r\n" .
        "Content-Type: text/plain; charset=UTF-8";


    $mail_sent = @mail(
        $email,
        $subject,
        $message,
        $headers
    );


    if ($mail_sent) {

        echo json_encode([

            'success' => true,

            'request_id' => $request_id,

            'message' => 'OTP sent to your email.',

            'method' => 'php_mail'

        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Failed to send OTP. Please try again later.',
            'method' => 'fallback_failed',
            'getotp_error' => $curl_error ?: (
                ($http_code !== 200 && $http_code !== 201)
                    ? 'HTTP ' . $http_code
                    : 'Unknown'
            ),
            'debug' => json_decode($response, true)
        ]);
    }

    exit;
}


/* =========================================================
   VERIFY OTP
   ========================================================= */

if ($action === 'verify_otp') {

    $request_id =
        $_POST['request_id'] ?? null;

    $otp =
        $_POST['otp'] ?? null;

    $email =
        $_POST['email'] ?? null;


    if (
        !$request_id ||
        !$otp ||
        !$email
    ) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Missing parameters.'
        ]);

        exit;
    }


    /* =====================================================
       CHECK LOCAL OTP FIRST
       ===================================================== */

    $otp_file =
        $OTP_STORAGE_DIR .
        md5($email) .
        '.json';


    if (file_exists($otp_file)) {

        $otp_data =
            json_decode(
                file_get_contents($otp_file),
                true
            );


        if (
            $otp_data &&
            $otp_data['code'] === $otp &&
            time() <= $otp_data['expires_at']
        ) {

            @unlink($otp_file);

            $google_user = lookupGoogleSheetUserByEmail($email);
            $found_name = $google_user['Name'] ?? '';

            echo json_encode([

                'success' => true,
                'name' => $found_name,

                'message' =>
                    'OTP verified successfully.',

                'method' => 'local'

            ]);

            exit;

        } elseif (
            $otp_data &&
            time() > $otp_data['expires_at']
        ) {

            @unlink($otp_file);

            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'OTP has expired.'
            ]);

            exit;
        }
    }


    /* =====================================================
       GETOTP VERIFICATION
       ===================================================== */

    $curl = curl_init();


    curl_setopt_array($curl, [

        CURLOPT_URL =>
            $GETOTP_API_BASE .
            '/verifications?code=' .
            urlencode($otp) .
            '&email=' .
            urlencode($email),

        CURLOPT_RETURNTRANSFER => true,

        CURLOPT_ENCODING => '',

        CURLOPT_MAXREDIRS => 10,

        CURLOPT_TIMEOUT => 10,

        CURLOPT_FOLLOWLOCATION => true,

        CURLOPT_HTTP_VERSION =>
            CURL_HTTP_VERSION_1_1,

        CURLOPT_CUSTOMREQUEST => 'GET',

        CURLOPT_HTTPHEADER => [
            'X-OTP-Key: ' . $GETOTP_API_KEY,
            'Accept: application/json'
        ],

        CURLOPT_SSL_VERIFYPEER => true,

        CURLOPT_SSL_VERIFYHOST => 2

    ]);


    $response = curl_exec($curl);

    $http_code =
        curl_getinfo(
            $curl,
            CURLINFO_HTTP_CODE
        );

    $curl_error =
        curl_error($curl);

    curl_close($curl);


    if (
        !$curl_error &&
        $http_code === 200
    ) {

        $data =
            json_decode(
                $response,
                true
            );


        if (
            $data &&
            isset($data['data']) &&
            is_array($data['data']) &&
            count($data['data']) > 0
        ) {

            $google_user = lookupGoogleSheetUserByEmail($email);
            $found_name = $google_user['Name'] ?? '';

            echo json_encode([

                'success' => true,
                'name' => $found_name,

                'message' =>
                    'OTP verified successfully.',

                'method' => 'getotp'

            ]);

            exit;
        }
    }


    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid OTP.'
    ]);

    exit;
}


/* =========================================================
   UPDATE PERFORMANCE
   ========================================================= */

if ($action === 'update_performance') {

    $email =
        $_POST['email'] ?? null;

    $tests_done =
        $_POST['tests_done'] ?? 0;

    $avg_score =
        $_POST['avg_score'] ?? 0;

    $current_rank =
        $_POST['current_rank'] ?? 0;

    $study_time =
        $_POST['study_time'] ?? 0;


    if (
        !$email ||
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid email.'
        ]);

        exit;
    }


    if (empty($STUDENT_PERFORMANCE_API)) {

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' =>
                'Student performance API not configured.'
        ]);

        exit;
    }


    $normalized_email =
        strtolower(trim($email));


    /* =====================================================
       FETCH ALL PERFORMANCE ROWS
       ===================================================== */

    $ch = curl_init();

    curl_setopt(
        $ch,
        CURLOPT_URL,
        $STUDENT_PERFORMANCE_API
    );

    curl_setopt(
        $ch,
        CURLOPT_RETURNTRANSFER,
        true
    );

    curl_setopt(
        $ch,
        CURLOPT_TIMEOUT,
        10
    );

    curl_setopt(
        $ch,
        CURLOPT_HTTPHEADER,
        [
            'Content-Type: application/json'
        ]
    );


    $response =
        curl_exec($ch);

    $http_code =
        curl_getinfo(
            $ch,
            CURLINFO_HTTP_CODE
        );

    $curl_error =
        curl_error($ch);

    curl_close($ch);


    if (
        $curl_error ||
        $http_code !== 200
    ) {

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' =>
                'Failed to query performance rows.'
        ]);

        exit;
    }


    $rows =
        json_decode(
            $response,
            true
        ) ?? [];


    $matched_row = null;


    /* =====================================================
       FIND EXACT EMAIL MATCH
       ===================================================== */

    foreach ($rows as $row) {

        $row_email =
            strtolower(
                trim(
                    (string)(
                        $row['Email'] ?? ''
                    )
                )
            );


        if (
            $row_email ===
            $normalized_email
        ) {

            $matched_row = $row;

            break;
        }
    }


    /* =====================================================
       DATA TO WRITE
       ===================================================== */

    $data_to_write = [

        'Email' => $email,

        'Tests_Done' =>
            intval($tests_done),

        'Avg_Score' =>
            floatval($avg_score),

        'Current_Rank' =>
            intval($current_rank),

        'Study_Time' =>
            floatval($study_time)

    ];


    /* =====================================================
       UPDATE EXISTING STUDENT
       ===================================================== */

    if ($matched_row) {

        $row_id =
            $matched_row['id']
            ?? $matched_row['ID']
            ?? $matched_row['_id']
            ?? null;


        if ($row_id) {

            $update_url =
                $STUDENT_PERFORMANCE_API .
                '/id/' .
                urlencode(
                    (string)$row_id
                );


            $payload = [
                'data' => [
                    $data_to_write
                ]
            ];

        } else {

            $update_url =
                $STUDENT_PERFORMANCE_API .
                '/search?Email=' .
                urlencode($email);


            $payload = [
                'data' => [

                    'Tests_Done' =>
                        $data_to_write['Tests_Done'],

                    'Avg_Score' =>
                        $data_to_write['Avg_Score'],

                    'Current_Rank' =>
                        $data_to_write['Current_Rank'],

                    'Study_Time' =>
                        $data_to_write['Study_Time']

                ]
            ];
        }


        $ch = curl_init();


        curl_setopt(
            $ch,
            CURLOPT_URL,
            $update_url
        );

        curl_setopt(
            $ch,
            CURLOPT_CUSTOMREQUEST,
            'PUT'
        );

        curl_setopt(
            $ch,
            CURLOPT_FOLLOWLOCATION,
            true
        );

        curl_setopt(
            $ch,
            CURLOPT_POSTFIELDS,
            json_encode($payload)
        );

        curl_setopt(
            $ch,
            CURLOPT_HTTPHEADER,
            [
                'Content-Type: application/json'
            ]
        );

        curl_setopt(
            $ch,
            CURLOPT_RETURNTRANSFER,
            true
        );

        curl_setopt(
            $ch,
            CURLOPT_TIMEOUT,
            10
        );


        curl_exec($ch);

        curl_close($ch);


        echo json_encode([

            'success' => true,

            'message' =>
                'Performance data updated for matched email row only.',

            'data' => [

                'email' => $email,

                'tests_done' =>
                    intval($tests_done),

                'avg_score' =>
                    floatval($avg_score),

                'current_rank' =>
                    intval($current_rank),

                'study_time' =>
                    floatval($study_time)

            ]

        ]);

        exit;
    }


    /* =====================================================
       CREATE NEW STUDENT PERFORMANCE ROW
       ===================================================== */

    $create_data = [
        'data' => [
            $data_to_write
        ]
    ];


    $ch = curl_init();


    curl_setopt(
        $ch,
        CURLOPT_URL,
        $STUDENT_PERFORMANCE_API
    );

    curl_setopt(
        $ch,
        CURLOPT_POST,
        true
    );

    curl_setopt(
        $ch,
        CURLOPT_FOLLOWLOCATION,
        true
    );

    curl_setopt(
        $ch,
        CURLOPT_POSTFIELDS,
        json_encode($create_data)
    );

    curl_setopt(
        $ch,
        CURLOPT_HTTPHEADER,
        [
            'Content-Type: application/json'
        ]
    );

    curl_setopt(
        $ch,
        CURLOPT_RETURNTRANSFER,
        true
    );

    curl_setopt(
        $ch,
        CURLOPT_TIMEOUT,
        10
    );


    curl_exec($ch);

    curl_close($ch);


    echo json_encode([

        'success' => true,

        'message' =>
            'Performance row created for the new email.',

        'data' => [

            'email' => $email,

            'tests_done' =>
                intval($tests_done),

            'avg_score' =>
                floatval($avg_score),

            'current_rank' =>
                intval($current_rank),

            'study_time' =>
                floatval($study_time)

        ]

    ]);

    exit;
}


/* =========================================================
   GET PERFORMANCE — FIXED
   ========================================================= */

if ($action === 'get_performance') {

    $email =
        $_POST['email']
        ?? $_GET['email']
        ?? null;


    if (
        !$email ||
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid email.'
        ]);

        exit;
    }


    if (empty($STUDENT_PERFORMANCE_API)) {

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' =>
                'Student performance API not configured.'
        ]);

        exit;
    }


    /*
     * Normalize the logged-in email.
     *
     * Example:
     * "Student@Gmail.com "
     *
     * becomes:
     * "student@gmail.com"
     */

    $search_email =
        strtolower(
            trim($email)
        );


    /* =====================================================
       FETCH ALL STUDENT PERFORMANCE ROWS
       ===================================================== */

    $ch = curl_init();


    curl_setopt_array($ch, [

        CURLOPT_URL =>
            $STUDENT_PERFORMANCE_API,

        CURLOPT_RETURNTRANSFER =>
            true,

        CURLOPT_TIMEOUT =>
            10,

        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ]

    ]);


    $response =
        curl_exec($ch);


    $http_code =
        curl_getinfo(
            $ch,
            CURLINFO_HTTP_CODE
        );


    $curl_error =
        curl_error($ch);


    curl_close($ch);


    if ($curl_error) {

        http_response_code(500);

        echo json_encode([

            'success' => false,

            'message' =>
                'Connection error: ' .
                $curl_error

        ]);

        exit;
    }


    if ($http_code !== 200) {

        http_response_code(500);

        echo json_encode([

            'success' => false,

            'message' =>
                'Failed to fetch student performance data.',

            'http_code' =>
                $http_code

        ]);

        exit;
    }


    $rows =
        json_decode(
            $response,
            true
        );


    if (!is_array($rows)) {

        http_response_code(500);

        echo json_encode([

            'success' => false,

            'message' =>
                'Invalid data received from SheetDB.'

        ]);

        exit;
    }


    /* =====================================================
       FIND STUDENT BY EXACT EMAIL
       ===================================================== */

    $student = null;


    foreach ($rows as $row) {

        $row_email =
            strtolower(
                trim(
                    (string)(
                        $row['Email'] ?? ''
                    )
                )
            );


        if (
            $row_email ===
            $search_email
        ) {

            $student = $row;

            break;
        }
    }


    /* =====================================================
       STUDENT NOT FOUND
       ===================================================== */

    if ($student === null) {

        echo json_encode([

            'success' => true,

            'data' => [

                'email' => $email,

                'tests_done' => 0,

                'avg_score' => 0,

                'current_rank' => 0,

                'study_time' => 0

            ]

        ]);

        exit;
    }


    /* =====================================================
       READ MATCHED STUDENT DATA
       ===================================================== */

    $tests_done =
        intval(
            $student['Tests_Done'] ?? 0
        );


    $avg_score =
        floatval(
            $student['Avg_Score'] ?? 0
        );


    $current_rank =
        intval(
            $student['Current_Rank'] ?? 0
        );


    $study_time =
        floatval(
            $student['Study_Time'] ?? 0
        );


    /* =====================================================
       RETURN MATCHED STUDENT
       ===================================================== */

    echo json_encode([

        'success' => true,

        'data' => [

            'email' =>
                $student['Email']
                ?? $email,

            'tests_done' =>
                $tests_done,

            'avg_score' =>
                $avg_score,

            'current_rank' =>
                $current_rank,

            'study_time' =>
                $study_time

        ]

    ]);

    exit;
}


/* =========================================================
   INVALID ACTION
   ========================================================= */

http_response_code(400);

echo json_encode([

    'success' => false,

    'message' =>
        'Invalid action.'

]);

?>