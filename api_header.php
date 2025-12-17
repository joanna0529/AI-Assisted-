<?php
// =======================================================
// 處理 CORS (跨域資源共享) 問題：允許前端 React 專案呼叫後端 API
// =======================================================

// 允許任何網域 (*) 來存取這個 API
header("Access-Control-Allow-Origin: *"); 

// 允許前端使用 GET, POST, PUT, DELETE 等 HTTP 方法
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// 允許前端在請求中帶上 Content-Type 等 HTTP 標頭
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// 設定伺服器回傳的內容格式是 JSON，並使用 UTF-8 編碼
header("Content-Type: application/json; charset=UTF-8");

// 處理瀏覽器發出的預檢請求 (Preflight Request，方法為 OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(); // 預檢請求通過，直接結束
}

?>