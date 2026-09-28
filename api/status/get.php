<?php
header('Content-Type: application/json; charset=utf-8');
function respond(int $status,array $data): never { http_response_code($status); echo json_encode($data,JSON_UNESCAPED_SLASHES); exit; }
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(405,['success'=>false,'message'=>'GET request required.']);
    require_once __DIR__.'/../config/database.php'; $pdo=db();
    $applicationNumber=strtoupper(trim($_GET['application_number']??'')); $passport=strtoupper(trim($_GET['passport_number']??''));
    if ($applicationNumber==='' || $passport==='') respond(422,['success'=>false,'message'=>'Application number and passport number are required.']);
    $stmt=$pdo->prepare("SELECT application_number,status,rejection_reason,officer_remarks,submitted_at,decided_at FROM applications WHERE application_number=:application_number AND passport_number=:passport_number LIMIT 1");
    $stmt->execute([':application_number'=>$applicationNumber,':passport_number'=>$passport]); $a=$stmt->fetch();
    if (!$a) respond(404,['success'=>false,'message'=>'No application was found with those details.']);
    respond(200,['success'=>true,'application'=>['applicationNumber'=>$a['application_number'],'status'=>$a['status'],'submittedAt'=>$a['submitted_at'],'decidedAt'=>$a['decided_at'],'rejectionReason'=>$a['rejection_reason'],'remarks'=>$a['officer_remarks']]]);
} catch(Throwable $e) { error_log('Tatkaal status error: '.$e->getMessage()); respond(500,['success'=>false,'message'=>'Unable to check application status right now.']); }
