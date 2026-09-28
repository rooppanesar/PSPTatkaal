<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'POST requests only.']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    respond(400, ['success' => false, 'message' => 'Request body must be valid JSON.']);
}

$required = [
    'applicant_type', 'full_name', 'passport_number', 'phone',
    'email', 'tatkaal_reason'
];

foreach ($required as $field) {
    if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
        respond(422, ['success' => false, 'message' => "Missing field: {$field}."]);
    }
}

$applicantType = strtolower(trim((string)$data['applicant_type']));
if (!in_array($applicantType, ['adult', 'minor'], true)) {
    respond(422, ['success' => false, 'message' => 'applicant_type must be adult or minor.']);
}

$passport = strtoupper(trim((string)$data['passport_number']));
$fullName = trim((string)$data['full_name']);
$phone = trim((string)$data['phone']);
$email = trim((string)$data['email']);
$reason = trim((string)$data['tatkaal_reason']);
$dob = isset($data['date_of_birth']) && trim((string)$data['date_of_birth']) !== ''
    ? trim((string)$data['date_of_birth'])
    : null;

if (mb_strlen($fullName) > 150 || mb_strlen($passport) > 30 || mb_strlen($phone) > 30 || mb_strlen($email) > 150 || mb_strlen($reason) > 200) {
    respond(422, ['success' => false, 'message' => 'One or more fields are too long.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['success' => false, 'message' => 'Please provide a valid email address.']);
}

if ($applicantType === 'minor' && !$dob) {
    respond(422, ['success' => false, 'message' => 'Date of birth is required for a minor application.']);
}

$yesNoFields = [
    'indian_passport', 'cgi_jurisdiction', 'passport_valid',
    'passport_under_12_months', 'valid_canadian_status', 'changing_personal_details'
];

$answers = [];
foreach ($yesNoFields as $field) {
    $value = $data[$field] ?? null;
    if ($value === true || $value === 1 || $value === '1' || $value === 'yes') {
        $answers[$field] = 1;
    } elseif ($value === false || $value === 0 || $value === '0' || $value === 'no') {
        $answers[$field] = 0;
    } else {
        respond(422, ['success' => false, 'message' => "Missing or invalid field: {$field}."]);
    }
}

try {
    $pdo = db();
    $pdo->beginTransaction();

    // Duplicate check for applications submitted in the last 30 days.
    $duplicateStmt = $pdo->prepare(
        'SELECT id, application_number, status, rejection_reason, submitted_at
         FROM applications
         WHERE passport_number = ?
           AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY submitted_at DESC
         LIMIT 1'
    );
    $duplicateStmt->execute([$passport]);
    $prior = $duplicateStmt->fetch();

    if ($prior) {
        $allowed = $prior['status'] === 'rejected'
            && $prior['rejection_reason'] === 'Unclear document — please reapply with better photos of documents';

        if (!$allowed) {
            $pdo->rollBack();
            respond(409, [
                'success' => false,
                'code' => 'DUPLICATE_APPLICATION',
                'message' => 'An application for this passport was submitted within the last 30 days.',
                'application_number' => $prior['application_number'],
                'status' => $prior['status']
            ]);
        }
    }

    // Temporary unique value. The final reference number is based on the DB id.
    $temporaryNumber = 'TMP-' . bin2hex(random_bytes(12));

    $stmt = $pdo->prepare(
        'INSERT INTO applications (
            application_number, applicant_type, full_name, date_of_birth,
            passport_number, phone, email, tatkaal_reason,
            indian_passport, cgi_jurisdiction, passport_valid,
            passport_under_12_months, valid_canadian_status, changing_personal_details,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")'
    );

    $stmt->execute([
        $temporaryNumber,
        $applicantType,
        $fullName,
        $dob,
        $passport,
        $phone,
        $email,
        $reason,
        $answers['indian_passport'],
        $answers['cgi_jurisdiction'],
        $answers['passport_valid'],
        $answers['passport_under_12_months'],
        $answers['valid_canadian_status'],
        $answers['changing_personal_details']
    ]);

    $id = (int)$pdo->lastInsertId();
    $applicationNumber = 'TAT' . date('Y') . str_pad((string)$id, 6, '0', STR_PAD_LEFT);

    $update = $pdo->prepare('UPDATE applications SET application_number = ? WHERE id = ?');
    $update->execute([$applicationNumber, $id]);

    $history = $pdo->prepare(
        'INSERT INTO application_history (application_id, action, old_status, new_status, remarks)
         VALUES (?, ?, ?, ?, ?)'
    );
    $history->execute([$id, 'Application submitted', null, 'pending', null]);

    $pdo->commit();

    respond(201, [
        'success' => true,
        'message' => 'Application created successfully.',
        'application' => [
            'id' => $id,
            'application_number' => $applicationNumber,
            'status' => 'pending'
        ]
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    respond(500, [
        'success' => false,
        'message' => 'The application could not be saved.'
    ]);
}
