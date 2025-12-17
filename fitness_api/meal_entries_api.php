<?php
// =======================================================
// 膳食紀錄查詢 API (穩健版)
// =======================================================

require_once 'api_header.php';
require_once 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (empty($_GET['user_id'])) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => '缺少使用者 ID']);
        exit();
    }

    $user_id = $_GET['user_id'];

    try {
        // 查詢所有欄位，確保熱量等數據被取出
        $sql = "SELECT entry_id, meal_type, food_description, serving_size_g, calories_kcal, protein_g, fat_g, carbs_g, date
                FROM meal_entries 
                WHERE user_id = ? 
                ORDER BY date DESC, entry_id DESC"; 
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC); 

        http_response_code(200); 
        echo json_encode(['success' => true, 'data' => $records]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '伺服器錯誤: ' . $e->getMessage()]);
    }
} 
else {
    http_response_code(405); 
    echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
}
?>