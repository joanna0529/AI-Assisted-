<?php
// =======================================================
// 數據管理 API (處理體重與膳食的刪除請求)
// =======================================================

require_once 'api_header.php';
require_once 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

// 確保只接受 DELETE 請求
if ($method !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '此 API 只接受 DELETE 請求']);
    exit();
}

// 取得前端 DELETE 請求的原始 JSON 數據
$data = json_decode(file_get_contents("php://input"), true);

// ----------------------------------------------------
// 參數驗證
// ----------------------------------------------------
if (empty($data['user_id']) || empty($data['type']) || empty($data['id'])) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => '缺少必要的參數 (user_id, type, id)']);
    exit();
}

$user_id = $data['user_id'];
$type = $data['type']; // 應為 'weight' 或 'meal'
$id = $data['id'];     // 對應 entry_id 或 id (daily_records 的 Primary Key)

try {
    $table = '';
    $id_column = '';
    
    // 根據類型選擇表格和 ID 欄位
    if ($type === 'weight') {
        $table = 'daily_records';
        $id_column = 'id'; 
        // 假設 daily_records 的 primary key 是 id
    } elseif ($type === 'meal') {
        $table = 'meal_entries';
        $id_column = 'entry_id';
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '無效的刪除類型']);
        exit();
    }

    // ----------------------------------------------------
    // 執行 SQL 刪除操作
    // 確保刪除是針對該使用者 ID 的紀錄，防止跨使用者刪除
    // ----------------------------------------------------
    $sql = "DELETE FROM {$table} WHERE {$id_column} = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => "成功刪除 {$table} 中的 ID: {$id} 紀錄"]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '找不到該紀錄或無權限刪除']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '資料庫刪除失敗: ' . $e->getMessage()]);
}

?>