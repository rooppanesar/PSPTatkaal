<?php
header('Content-Type: application/json; charset=utf-8');
function respond(int $status, array $data): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_SLASHES); exit; }
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['success'=>false,'message'=>'POST request required.']);
    require_once __DIR__ . '/../config/database.php';
    $pdo = db();
    $applicantType = ($_POST['applicant_type'] ?? '') === 'minor' ? 'minor' : 'adult';
    $name = trim($_POST['full_name'] ?? '');
    $dob = trim($_POST['date_of_birth'] ?? '');
    $passport = strtoupper(trim($_POST['passport_number'] ?? ''));
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $reason = trim($_POST['tatkaal_reason'] ?? '');
    $bool = static fn($value): int => $value === 'yes' ? 1 : 0;
    $eligibility = [
        'indian_passport'=>$bool($_POST['indian_passport'] ?? ''),
        'cgi_jurisdiction'=>$bool($_POST['cgi_jurisdiction'] ?? ''),
        'passport_valid'=>$bool($_POST['passport_valid'] ?? ''),
        'passport_under_12_months'=>$bool($_POST['passport_under_12_months'] ?? ''),
        'valid_canadian_status'=>$bool($_POST['valid_canadian_status'] ?? ''),
        'changing_personal_details'=>$bool($_POST['changing_personal_details'] ?? '')
    ];
    if ($name === '' || $passport === '' || $phone === '' || $email === '' || $reason === '') respond(422, ['success'=>false,'message'=>'Please complete all required fields.']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['success'=>false,'message'=>'Please enter a valid email address.']);
    if (mb_strlen($reason) > 300) respond(422, ['success'=>false,'message'=>'The Tatkaal reason cannot exceed 300 characters.']);
    if ($applicantType === 'minor' && $dob === '') respond(422, ['success'=>false,'message'=>'Date of birth is required for a minor applicant.']);

    $requiredFiles = ['passport'=>'passport','status_proof'=>'status_proof'];
    if ($applicantType === 'minor') $requiredFiles['parent_status_proof'] = 'parent_status_proof';
    $maxBytes = 5 * 1024 * 1024;
    $validatedFiles = [];
    foreach ($requiredFiles as $field=>$documentType) {
        if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) respond(422, ['success'=>false,'message'=>'Please upload all required JPEG documents.']);
        $file = $_FILES[$field];
        if ($file['size'] <= 0 || $file['size'] > $maxBytes) respond(422, ['success'=>false,'message'=>'Each document must be no larger than 5 MB.']);
        $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = $finfo->file($file['tmp_name']);
        if ($mime !== 'image/jpeg') respond(422, ['success'=>false,'message'=>'JPEG images only are accepted for documents.']);
        $validatedFiles[$field] = ['type'=>$documentType,'original_name'=>basename($file['name']),'mime'=>$mime,'size'=>(int)$file['size'],'tmp_name'=>$file['tmp_name']];
    }

    $duplicateStmt = $pdo->prepare("SELECT application_number,status,rejection_reason FROM applications WHERE passport_number=:passport AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY submitted_at DESC LIMIT 1");
    $duplicateStmt->execute([':passport'=>$passport]); $prior = $duplicateStmt->fetch();
    if ($prior) {
        $resubmitAllowed = $prior['status'] === 'rejected' && $prior['rejection_reason'] === 'Unclear document — please reapply with better photos of documents';
        if (!$resubmitAllowed) respond(409, ['success'=>false,'code'=>'DUPLICATE_APPLICATION','message'=>'An application for this passport number was submitted within the last 30 days.','application_number'=>$prior['application_number']]);
    }

    $pdo->beginTransaction();
    $tempNumber = 'TEMP-' . bin2hex(random_bytes(12));
    $stmt = $pdo->prepare("INSERT INTO applications (application_number,applicant_type,full_name,date_of_birth,passport_number,phone,email,tatkaal_reason,indian_passport,cgi_jurisdiction,passport_valid,passport_under_12_months,valid_canadian_status,changing_personal_details,status) VALUES (:application_number,:applicant_type,:full_name,:date_of_birth,:passport_number,:phone,:email,:tatkaal_reason,:indian_passport,:cgi_jurisdiction,:passport_valid,:passport_under_12_months,:valid_canadian_status,:changing_personal_details,'pending')");
    $stmt->execute([
        ':application_number'=>$tempNumber, ':applicant_type'=>$applicantType, ':full_name'=>$name, ':date_of_birth'=>$dob !== '' ? $dob : null,
        ':passport_number'=>$passport, ':phone'=>$phone, ':email'=>$email, ':tatkaal_reason'=>$reason,
        ':indian_passport'=>$eligibility['indian_passport'], ':cgi_jurisdiction'=>$eligibility['cgi_jurisdiction'], ':passport_valid'=>$eligibility['passport_valid'],
        ':passport_under_12_months'=>$eligibility['passport_under_12_months'], ':valid_canadian_status'=>$eligibility['valid_canadian_status'], ':changing_personal_details'=>$eligibility['changing_personal_details']
    ]);
    $applicationId = (int)$pdo->lastInsertId();
    $applicationNumber = 'TAT' . date('Y') . str_pad((string)$applicationId, 6, '0', STR_PAD_LEFT);
    $pdo->prepare('UPDATE applications SET application_number=:application_number WHERE id=:id')->execute([':application_number'=>$applicationNumber,':id'=>$applicationId]);

    $storageRoot = __DIR__ . '/../storage/uploads/' . $applicationNumber;
    if (!is_dir($storageRoot) && !mkdir($storageRoot,0750,true)) throw new RuntimeException('Unable to create document storage directory.');
    $documentStmt = $pdo->prepare("INSERT INTO application_documents (application_id,document_type,file_name,file_path,mime_type,file_size) VALUES (:application_id,:document_type,:file_name,:file_path,:mime_type,:file_size)");
    foreach ($validatedFiles as $file) {
        $safeName = $file['type'].'-'.bin2hex(random_bytes(10)).'.jpg';
        $relativePath = 'api/storage/uploads/'.$applicationNumber.'/'.$safeName;
        if (!move_uploaded_file($file['tmp_name'], $storageRoot.'/'.$safeName)) throw new RuntimeException('Unable to save an uploaded document.');
        $documentStmt->execute([':application_id'=>$applicationId,':document_type'=>$file['type'],':file_name'=>$file['original_name'],':file_path'=>$relativePath,':mime_type'=>$file['mime'],':file_size'=>$file['size']]);
    }
    $pdo->prepare("INSERT INTO application_history (application_id,action,old_status,new_status,remarks) VALUES (:application_id,'Application submitted',NULL,'pending',NULL)")->execute([':application_id'=>$applicationId]);
    $pdo->commit();
    respond(201, ['success'=>true,'message'=>'Application submitted successfully.','application'=>['id'=>$applicationId,'application_number'=>$applicationNumber,'status'=>'pending','submitted_at'=>date(DATE_ATOM)]]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Tatkaal create application error: '.$e->getMessage());
    respond(500, ['success'=>false,'message'=>'The application could not be submitted. Please try again later.']);
}
