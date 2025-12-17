<?php
// =======================================================
// 使用者註冊 API (對應 HTTP POST 請求)
// =======================================================

// 1. 引入必要檔案 (通用設定和資料庫連線)
require_once 'api_header.php';
require_once 'db_connect.php';

// 2. 檢查請求方法是否為 POST
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => '此 API 只接受 POST 請求']);
    exit();
}

// 3. 取得前端 POST 過來的 JSON 數據
// php://input 允許我們讀取原始的 POST 數據 (JSON 格式)
$data = json_decode(file_get_contents("php://input"), true);

// 4. 數據驗證 (簡易檢查)
if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => '請提供使用者名稱和密碼']);
    exit();
}

$username = $data['username'];
// 安全性：將密碼進行雜湊處理，不要明文儲存
$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

// 設置預設的目標值 (註冊時給定預設，使用者可在登入後修改)
$target_kcal = 2000; 
$target_protein = 150;

try {
    // 5. 準備 SQL 插入語句 (使用 ? 佔位符防止 SQL 隱碼攻擊)
    $sql = "INSERT INTO user (username, password_hash, target_kcal, target_protein) 
            VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    
    // 6. 執行 SQL 語句
    $stmt->execute([$username, $password_hash, $target_kcal, $target_protein]);

    // 7. 成功回傳
    http_response_code(201); // 201 Created
    echo json_encode([
        'success' => true, 
        'message' => '使用者註冊成功', 
        'user_id' => $pdo->lastInsertId() // 回傳新建立的使用者 ID
    ]);

} catch (PDOException $e) {
    // 8. 處理資料庫錯誤 (例如使用者名稱重複)
    if ($e->getCode() == '23000') { // 23000 是 MySQL 的「唯一鍵重複」錯誤碼
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => '該使用者名稱已被使用']);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => '伺服器錯誤: ' . $e->getMessage()]);
    }
}

?>