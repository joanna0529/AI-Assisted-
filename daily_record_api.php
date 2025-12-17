<?php
// =======================================================
// 每日紀錄 API (新增/查詢) - 最終修正版：確保前後端相容
// 資料庫欄位使用: date, weight_kg
// 前端介面變數使用: record_date, weight
// =======================================================

require_once 'api_header.php';
require_once 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

// 確保使用者 ID 已傳遞 
if (empty($_GET['user_id']) && $method === 'GET') {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => '缺少使用者 ID']);
    exit();
}

// =======================================================
// 1. POST 請求：新增/更新每日紀錄 (體重)
// =======================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // *** 修正點 1：這裡的 Keys 必須與前端 Dashboard.js 發送的變數名一致 ***
    if (empty($data['user_id']) || empty($data['weight']) || empty($data['record_date'])) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => '缺少必要的紀錄數據 (user_id, weight, record_date)']);
        exit();
    }

    $user_id = $data['user_id'];
    $weight = $data['weight'];
    $record_date = $data['record_date']; 
    
    try {
        // *** 修正點 2：SQL 語句中的欄位名稱使用 date 和 weight_kg ***
        $sql = "INSERT INTO daily_records (user_id, date, weight_kg) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                weight_kg = VALUES(weight_kg)"; 
        
        $stmt = $pdo->prepare($sql);
        // 參數順序：user_id (對應 user_id), record_date (對應 date), weight (對應 weight_kg)
        $stmt->execute([$user_id, $record_date, $weight]);

        http_response_code(201); // Created
        echo json_encode(['success' => true, 'message' => '每日紀錄新增/更新成功']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '伺服器錯誤: ' . $e->getMessage()]);
    }
} 

// =======================================================
// 2. GET 請求：查詢某使用者所有紀錄
// =======================================================
else if ($method === 'GET') {
    $user_id = $_GET['user_id'];

    try {
        // *** 修正點 3：使用 AS 重新命名！確保回傳給前端的 key 是 record_date 和 weight ***
        $sql = "SELECT date AS record_date, weight_kg AS weight FROM daily_records WHERE user_id = ? ORDER BY date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        
        http_response_code(200); // OK
        echo json_encode(['success' => true, 'data' => $records]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '伺服器錯誤: ' . $e->getMessage()]);
    }
}
else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
}
?>