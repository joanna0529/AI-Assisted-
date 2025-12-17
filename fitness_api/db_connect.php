<?php

// =======================================================
// A. 數據庫連線設定
// =======================================================

// 伺服器位置：本地端
$host = 'localhost'; 

// 資料庫名稱：請確認與您在 phpMyAdmin 建立的名稱一致！
$dbname = 'fitness_tracker_db'; 

// 使用者名稱：XAMPP 預設為 root
$user = 'root'; 

// 密碼：XAMPP 預設為空字串 (如果您有設定密碼，請填入)
$password = ''; 


// =======================================================
// B. 建立連線並處理錯誤
// =======================================================

try {
    // 1. 準備資料來源名稱 (DSN)：指定連線類型(mysql)、主機、資料庫名稱、編碼
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    
    // 2. 建立 PDO (PHP Data Objects) 連線實例
    $pdo = new PDO($dsn, $user, $password);

    // 3. 設定 PDO 屬性：當發生錯誤時，拋出 PHP 例外 (Exception)，方便我們捕捉和除錯。
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // * 連線成功時的測試訊息 (您可以在測試完畢後將這行刪除或註解掉)
    // echo "資料庫連線成功！"; 

} catch (PDOException $e) {
    // 4. 如果連線失敗 (例如 XAMPP 的 MySQL 沒啟動，或資料庫名稱打錯)
    
    // 設定 HTTP 狀態碼為 500 (內部伺服器錯誤)
    http_response_code(500); 
    
    // 回傳 JSON 格式的錯誤訊息給前端
    echo json_encode([
        'success' => false,
        'message' => '資料庫連線錯誤: ' . $e->getMessage()
    ]);
    
    // 停止後續腳本運行
    exit(); 
}

?>