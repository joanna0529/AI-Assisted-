import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 用於登入成功後跳轉

// 定義您的後端 API 基礎網址
const API_BASE_URL = 'http://localhost/fitness_api'; 

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  // --- 登入處理函式 ---
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setMessage('登入中...');
    
    if (!username || !password) {
      setMessage('請填寫使用者名稱和密碼');
      return;
    }

    try {
      // 呼叫後端 user_login.php API
      const response = await axios.post(
        `${API_BASE_URL}/user_login.php`, 
        { 
          username, 
          password 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // 1. 處理成功回覆 (HTTP 狀態碼 200)
      if (response.data.success) {
        setMessage('✅ 登入成功！正在進入儀表板...');
        
        // 儲存使用者資訊到瀏覽器
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('username', response.data.username);
        
        // 登入成功後，跳轉到儀表板頁面
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500); 

      } else {
        // 處理 PHP API 傳回的錯誤訊息
        setMessage(`登入失敗: ${response.data.message}`);
      }
      
    } catch (error) {
      // 處理網路或伺服器錯誤
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(`錯誤: ${error.response.data.message}`);
      } else {
        setMessage('網路或伺服器連線失敗，請檢查 XAMPP 是否啟動');
      }
    }
  };

  // --- 介面渲染 ---
  return (
    <div style={styles.container}>
      {/* 新增歡迎標題 */}
      <h1 style={styles.appTitle}>💪 歡迎來到增肌減脂追蹤器</h1>
      <h2>使用者登入</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        
        <input
          type="text"
          placeholder="使用者名稱"
          value={username}
          onChange={(e) => setUsername(e.target.value)} 
          style={styles.input}
          required
        />
        
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          style={styles.input}
          required
        />
        
        <button type="submit" style={styles.button}>登 入</button>
      </form>
      
      {message && <p style={styles.message}>{message}</p>}
      
      {/* 註冊連結 */}
      <p style={{marginTop: '20px'}}>還沒有帳號嗎？ <a href="/register">立即註冊</a></p>
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

export default Login;