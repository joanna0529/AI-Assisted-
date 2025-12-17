<?php
// =======================================================
// 使用者登入 API (最終版本：整合體重目標回傳)
// =======================================================

// 1. 引入必要檔案
require_once 'api_header.php';
require_once 'db_connect.php'; // 確保 $pdo 連線物件可用

// 2. 檢查請求方法
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '此 API 只接受 POST 請求']);
    exit();
}

// 3. 取得前端 POST 過來的 JSON 數據
$data = json_decode(file_get_contents("php://input"), true);

// 4. 數據驗證
if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => '請提供使用者名稱和密碼']);
    exit();
}

$username = $data['username'];
$password = $data['password']; // 使用者輸入的明文密碼

try {
    // 5. 查找使用者：根據 username 查詢資料庫
    // *** 關鍵修正點：確保 SELECT 語句中包含 target_weight_kg ***
    $sql = "SELECT user_id, username, password_hash, target_kcal, target_protein, target_weight_kg FROM user WHERE username = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC); // 取得第一筆匹配的資料

    // 6. 檢查使用者是否存在
    if (!$user) {
        // 使用者不存在，回傳錯誤訊息
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => '使用者名稱或密碼錯誤']);
        exit();
    }

    // 7. 驗證密碼：使用 password_verify() 來比對雜湊密碼
    if (password_verify($password, $user['password_hash'])) {
        
        // 密碼比對成功，登入成功
        http_response_code(200); // OK

        // 回傳使用者資訊
        echo json_encode([
            'success' => true,
            'message' => '登入成功',
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'target_kcal' => $user['target_kcal'],
            'target_protein' => $user['target_protein'],
            // *** 關鍵修正點：回傳目標體重 ***
            'target_weight' => $user['target_weight_kg'] 
        ]);

    } else {
        // 密碼比對失敗
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => '使用者名稱或密碼錯誤']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '伺服器錯誤: ' . $e->getMessage()]);
}

?>