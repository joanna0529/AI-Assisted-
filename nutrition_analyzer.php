<?php
// =======================================================
// 膳食紀錄 API (純手動輸入/含熱量與蛋白質欄位)
// =======================================================

require_once 'api_header.php';
require_once 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
    exit();
}

// ----------------------------------------------------
// 1. 接收前端數據 (新增 calories_kcal 和 protein_g)
// ----------------------------------------------------
$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['user_id']) || empty($data['meal_type']) || empty($data['input_text']) || empty($data['record_date'])) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => '缺少必要的輸入數據 (user_id, meal_type, input_text, record_date)']);
    exit();
}

$user_id = $data['user_id'];
$meal_type = $data['meal_type'];
$food_description = $data['input_text'];
$date = $data['record_date']; 

// *** 新增：從前端取得手動輸入的熱量和蛋白質 (若未提供則預設為 0) ***
$calories_kcal = isset($data['calories_kcal']) ? (float)$data['calories_kcal'] : 0;
$protein_g = isset($data['protein_g']) ? (float)$data['protein_g'] : 0;

// 其他欄位仍保持 0
$serving_size_g = 0;
$fat_g = 0;
$carbs_g = 0;

// ----------------------------------------------------
// 2. 將手動輸入寫入資料庫
// ----------------------------------------------------
try {
    // 寫入 meal_entries 表格
    $sql = "INSERT INTO meal_entries (user_id, meal_type, food_description, serving_size_g, calories_kcal, protein_g, fat_g, carbs_g, date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $user_id,
        $meal_type,
        $food_description, 
        $serving_size_g,
        $calories_kcal, // 使用者輸入的熱量
        $protein_g,     // 使用者輸入的蛋白質
        $fat_g,
        $carbs_g,
        $date 
    ]);
    
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => "膳食紀錄已儲存：{$food_description} ({$calories_kcal} kcal)"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '資料庫寫入失敗: ' . $e->getMessage()]);
}

?>