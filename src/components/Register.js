import React, { useState } from 'react';
import axios from 'axios'; // 引入我們安裝的 API 連線工具
import { useNavigate } from 'react-router-dom'; // 用於登入成功後跳轉頁面

// 定義您的後端 API 基礎網址
const API_BASE_URL = 'http://localhost/fitness_api'; 

function Register() {
  // --- 1. 狀態管理 (State Management) ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // 用於顯示成功或錯誤訊息
  
  const navigate = useNavigate();

  // --- 2. 表單提交處理函式 ---
  const handleRegister = async (e) => {
    e.preventDefault(); // 阻止表單預設的頁面重新載入行為
    setMessage('註冊中...'); // 顯示等待訊息
    
    // 檢查基本輸入
    if (!username || !password) {
      setMessage('請填寫所有欄位');
      return;
    }

    try {
      // --- 3. 呼叫後端 PHP API ---
      const response = await axios.post(
        `${API_BASE_URL}/user_register.php`, // 完整的 API 網址
        { 
          username, 
          password 
        },
        {
          headers: {
            'Content-Type': 'application/json', // 告知伺服器我們傳送的是 JSON 數據
          },
        }
      );

      // --- 4. 處理回覆 ---
      if (response.data.success) {
        setMessage('✅ 註冊成功！將在 3 秒後自動跳轉到登入頁面...');
        // 註冊成功後，自動跳轉到登入頁
        setTimeout(() => {
          navigate('/login');
        }, 3000); 

      } else {
        // 處理 PHP API 傳回的錯誤訊息 (例如使用者名稱重複)
        setMessage(`註冊失敗: ${response.data.message}`);
      }
      
    } catch (error) {
      // --- 5. 處理網路或伺服器錯誤 ---
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(`錯誤: ${error.response.data.message}`);
      } else {
        setMessage('網路或伺服器連線失敗，請檢查 XAMPP 是否啟動');
      }
    }
  };

  // --- 6. 元件的渲染 (UI 介面) ---
  return (
    <div style={styles.container}>
      {/* 新增歡迎標題 */}
      <h1 style={styles.appTitle}>💪 歡迎來到增肌減脂追蹤器</h1>
      <h2>使用者註冊</h2>
      <form onSubmit={handleRegister} style={styles.form}>
        
        <input
          type="text"
          placeholder="使用者名稱"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // 輸入變動時更新 state
          style={styles.input}
          required
        />
        
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // 輸入變動時更新 state
          style={styles.input}
          required
        />
        
        <button type="submit" style={styles.button}>立即註冊</button>
      </form>
      
      {/* 7. 顯示訊息 */}
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

// 簡單的內聯 CSS 樣式
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    // 新增應用程式標題樣式
    appTitle: {
        fontSize: '20px',
        color: '#28a745', 
        marginBottom: '15px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        marginBottom: '10px',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    button: {
        padding: '10px',
        backgroundColor: '#007bff', 
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    message: {
        marginTop: '15px',
        color: '#333'
    }
};

export default Register;