<?php
// =======================================================
// 使用者目標設定 API (整合所有目標：熱量、蛋白質、體重)
// =======================================================

require_once 'api_header.php';
require_once 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['user_id'])) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => '缺少使用者 ID']);
    exit();
}

$user_id = $data['user_id'];

// 初始化要更新的欄位和值
$updates = [];
$params = [];

// 檢查並處理目標熱量 (target_kcal)
if (isset($data['target_kcal'])) {
    $updates[] = "target_kcal = ?";
    // 確保是整數
    $params[] = (int)$data['target_kcal'];
}

// 檢查並處理目標蛋白質 (target_protein)
if (isset($data['target_protein'])) {
    $updates[] = "target_protein = ?";
    // 確保是浮點數
    $params[] = (float)$data['target_protein'];
}

// *** 檢查並處理目標體重 (target_weight) ***
if (isset($data['target_weight'])) {
    $updates[] = "target_weight_kg = ?";
    // 確保是浮點數
    $params[] = (float)$data['target_weight'];
}

// 如果沒有任何目標數據傳遞，則回傳錯誤
if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '未提供任何目標數據進行更新']);
    exit();
}

try {
    // 構建 SQL 語句
    // UPDATE user SET target_kcal = ?, target_protein = ?, target_weight_kg = ? WHERE user_id = ?
    $sql = "UPDATE user SET " . implode(', ', $updates) . " WHERE user_id = ?";
    
    // 將 user_id 加入參數列表的末尾
    $params[] = $user_id;

    $stmt = $pdo->prepare($sql);

    $stmt->execute($params);
    
    // 檢查是否有影響行數，但如果值一樣，rowCount() 可能為 0
    // 只要成功執行，我們就回傳成功
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => '目標已成功更新！'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '資料庫更新失敗: ' . $e->getMessage()]);
}

?>