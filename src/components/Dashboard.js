import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// *** 引入 Chart.js 相關元件 ***
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// 註冊 Chart.js 所需的組件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = 'http://localhost/fitness_api'; 

// 餐次選項
const MEAL_TYPES = ['早餐', '午餐', '晚餐', '點心', '運動前', '運動後'];

function Dashboard() {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null); 
  const [isAuth, setIsAuth] = useState(false); 
  
  // 體重追蹤狀態
  const [weight, setWeight] = useState(''); 
  const [weightRecords, setWeightRecords] = useState([]); 
  const [weightRecordDate, setWeightRecordDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 膳食追蹤狀態
  const [mealInput, setMealInput] = useState(''); 
  const [manualCalories, setManualCalories] = useState(''); 
  const [manualProtein, setManualProtein] = useState(''); 
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]); 
  const [mealRecords, setMealRecords] = useState([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [mealRecordDate, setMealRecordDate] = useState(new Date().toISOString().split('T')[0]); 
  const [expandedDates, setExpandedDates] = useState({}); 

  // 目標設定狀態 (熱量/蛋白質/體重)
  const [targetKcal, setTargetKcal] = useState(0); 
  const [targetProtein, setTargetProtein] = useState(0);
  const [targetWeight, setTargetWeight] = useState(''); // *** 新增：目標體重狀態 ***
  
  const [targetKcalInput, setTargetKcalInput] = useState('');
  const [targetProteinInput, setTargetProteinInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(''); // *** 新增：目標體重輸入狀態 ***

  // 體重歷史紀錄顯示狀態 (新增)
  const [showWeightHistory, setShowWeightHistory] = useState(false); 

  // 通用訊息
  const [message, setMessage] = useState(''); 
  
  const navigate = useNavigate();

  // --- 身份驗證與初始資料載入 ---
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username');
    const storedTargetKcal = localStorage.getItem('target_kcal');
    const storedTargetProtein = localStorage.getItem('target_protein');
    // *** 讀取目標體重 ***
    const storedTargetWeight = localStorage.getItem('target_weight'); 


    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsAuth(true);
      
      // 設定目標值
      const initKcal = parseInt(storedTargetKcal) || 2000;
      const initProtein = parseFloat(storedTargetProtein) || 150;
      const initWeight = parseFloat(storedTargetWeight) || '';
      
      setTargetKcal(initKcal); 
      setTargetProtein(initProtein); 
      setTargetWeight(initWeight); // *** 設定目標體重狀態 ***
      
      setTargetKcalInput(initKcal);
      setTargetProteinInput(initProtein);
      setTargetWeightInput(initWeight); // *** 設定目標體重輸入狀態 ***
      
      // 載入體重和膳食紀錄
      fetchWeightRecords(storedUserId);
      fetchMealRecords(storedUserId);
      
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  // --- 登出函式 ---
  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('target_kcal');
    localStorage.removeItem('target_protein');
    localStorage.removeItem('target_weight'); // *** 移除目標體重 ***
    navigate('/login');
  };
  
  // ===========================================
  // 數據刪除邏輯 
  // ===========================================
  const handleDelete = async (type, id) => {
    if (!window.confirm(`確定要刪除這筆 ${type === 'meal' ? '膳食' : '體重'} 紀錄嗎? (ID: ${id})`)) {
        return;
    }
    
    setMessage(`正在刪除 ${type} 紀錄...`);
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/data_management_api.php`,
            {
                data: { // DELETE 請求的 body 數據必須放在 'data' 屬性中
                    user_id: userId,
                    type: type,
                    id: id
                },
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (response.data.success) {
            setMessage(`🗑️ 刪除成功: ${response.data.message}`);
            
            // 根據類型刷新列表
            if (type === 'meal') {
                fetchMealRecords(userId);
            } else if (type === 'weight') {
                fetchWeightRecords(userId);
            }
        } else {
            setMessage(`刪除失敗: ${response.data.message}`);
        }
    } catch (error) {
        console.error('刪除錯誤:', error);
        setMessage('連線錯誤：無法刪除紀錄。');
    }
  };

  // ===========================================
  // 熱量/蛋白質目標設定邏輯
  // ===========================================
  const handleSetGoals = async (e) => {
    e.preventDefault();
    setMessage('目標更新中...');
    
    const kcal = parseInt(targetKcalInput);
    const protein = parseFloat(targetProteinInput);

    if (isNaN(kcal) || kcal <= 0 || isNaN(protein) || protein <= 0) {
        setMessage('請輸入有效的熱量和蛋白質目標！');
        return;
    }

    try {
        // 呼叫整合後的 user_goals_api.php
        const response = await axios.post(
            `${API_BASE_URL}/user_goals_api.php`,
            {
                user_id: userId,
                target_kcal: kcal,
                target_protein: protein,
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (response.data.success) {
            setMessage(`✅ ${response.data.message}`);
            
            setTargetKcal(kcal);
            setTargetProtein(protein);
            localStorage.setItem('target_kcal', kcal);
            localStorage.setItem('target_protein', protein);
        } else {
            setMessage(`目標設定失敗: ${response.data.message}`);
        }

    } catch (error) {
        console.error('更新目標失敗:', error);
        setMessage('連線錯誤：無法更新目標，請檢查後端 API。');
    }
  };

  // ===========================================
  // *** 新增：目標體重設定邏輯 ***
  // ===========================================
  const handleSetTargetWeight = async (e) => {
      e.preventDefault();
      
      const target = parseFloat(targetWeightInput);

      if (isNaN(target) || target <= 0) {
          setMessage('請輸入有效的目標體重');
          return;
      }

      setMessage('設定目標體重中...');

      try {
          // 呼叫整合後的 user_goals_api.php
          const response = await axios.post(`${API_BASE_URL}/user_goals_api.php`, {
              user_id: userId,
              target_weight: target // 僅傳遞體重目標
          }, {
              headers: { 'Content-Type': 'application/json' }
          });

          if (response.data.success) {
              // 更新前端狀態和 Local Storage
              const newTarget = target.toFixed(1);
              setTargetWeight(newTarget);
              setTargetWeightInput(newTarget);
              localStorage.setItem('target_weight', newTarget);
              setMessage(`✅ 目標體重設定為 ${newTarget} kg`);
          } else {
              setMessage(`❌ 設定失敗: ${response.data.message}`);
          }
      } catch (error) {
          setMessage('❌ 設定目標體重發生錯誤');
          console.error('Error setting target weight:', error);
      }
  };


  // ===========================================
  // 體重紀錄邏輯
  // ===========================================
  const fetchWeightRecords = async (currentUserId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/daily_record_api.php?user_id=${currentUserId}`);
        if (response.data.success) {
            setWeightRecords(response.data.data);
            if (response.data.data.length > 0) {
                // 顯示最新一筆體重
                setWeight(response.data.data[0].weight.toString()); 
            } else {
                setWeight('N/A');
            }
        }
    } catch (error) {
        console.error('載入體重紀錄失敗:', error);
    }
  };

  const handleRecordWeight = async (e) => {
    e.preventDefault();
    
    if (!weight || isNaN(parseFloat(weight))) {
        setMessage('請輸入有效的體重數值！');
        return;
    }
    
    if (!weightRecordDate) {
        setMessage('請選擇體重紀錄日期！');
        return;
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/daily_record_api.php`,
            {
                user_id: userId,
                weight: parseFloat(weight),
                record_date: weightRecordDate, 
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (response.data.success) {
            setMessage(`✅ ${response.data.message}`);
            fetchWeightRecords(userId); 
        } else {
            setMessage(`紀錄體重失敗: ${response.data.message}`);
        }
    } catch (error) {
        console.error('提交體重紀錄失敗:', error);
        setMessage('連線錯誤：無法紀錄體重，請檢查後端 API。');
    }
  };
  
  // ===========================================
  // 膳食紀錄邏輯
  // ===========================================

  const fetchMealRecords = async (currentUserId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/meal_entries_api.php?user_id=${currentUserId}`);
      if (response.data.success) {
        setMealRecords(response.data.data);
      }
    } catch (error) {
      console.error('載入膳食紀錄失敗:', error);
      setMessage('載入膳食紀錄失敗，請檢查後端連線。');
    }
  };
  
  // --- 處理膳食輸入與紀錄 (手動輸入熱量/蛋白質) ---
  const handleAnalyzeMeal = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const kcal = parseFloat(manualCalories || 0);
    const protein = parseFloat(manualProtein || 0);

    if (!mealInput || !mealRecordDate || isNaN(kcal) || isNaN(protein)) {
      setMessage('請填寫食物描述、日期，並輸入有效的熱量和蛋白質！');
      return;
    }
    
    setIsAnalyzing(true); 

    try {
      // 由於您是手動輸入，我們直接使用 nutrition_analyzer.php 進行儲存
      const response = await axios.post(
        `${API_BASE_URL}/nutrition_analyzer.php`, 
        {
          user_id: userId,
          meal_type: selectedMealType,
          input_text: mealInput,
          record_date: mealRecordDate,
          calories_kcal: kcal,
          protein_g: protein,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setMessage(`🎉 ${response.data.message}`); 
        setMealInput(''); 
        setManualCalories('');
        setManualProtein('');
        fetchMealRecords(userId); 
      } else {
        setMessage(`膳食紀錄失敗: ${response.data.message}`);
      }
    } catch (error) {
        console.error("手動紀錄失敗:", error);
        setMessage('連線錯誤：無法儲存膳食紀錄，請檢查後端 API。');
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- 膳食紀錄分組和計算總和 ---
  const groupedMeals = useMemo(() => {
    const groups = mealRecords.reduce((acc, meal) => {
      const date = meal.date;
      
      if (!acc[date]) {
        acc[date] = {
          entries: [],
          totalKcal: 0,
          totalProtein: 0,
        };
      }
      
      acc[date].totalKcal += parseFloat(meal.calories_kcal || 0);
      acc[date].totalProtein += parseFloat(meal.protein_g || 0);
      acc[date].entries.push(meal);
      
      return acc;
    }, {});
    
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date: date,
        ...groups[date],
      }));
  }, [mealRecords]);

  // --- 處理日期展開/收合 ---
  const toggleMealDetails = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };
  
  // ===========================================
  // 圖表數據準備
  // ===========================================
  
  // --- 體重圖表數據 (含目標線) ---
  const chartData = useMemo(() => {
    const sortedRecords = [...weightRecords].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));

    const labels = sortedRecords.map(record => record.record_date);
    const data = sortedRecords.map(record => parseFloat(record.weight));
    
    // *** 使用目標體重狀態 ***
    const targetLineData = targetWeight ? Array(labels.length).fill(parseFloat(targetWeight)) : [];


    return {
        labels,
        datasets: [
            {
                label: '當前體重 (kg)',
                data,
                borderColor: '#007bff', 
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                tension: 0.3, 
                pointRadius: 5,
                pointHoverRadius: 8,
            },
            // 新增：目標體重線
            targetLineData.length > 0 && {
                label: `目標體重 (${targetWeight} kg)`, // 顯示目標值
                data: targetLineData,
                borderColor: '#28a745', 
                borderDash: [5, 5], // 虛線
                pointRadius: 0,
                fill: false,
                tension: 0
            }
        ].filter(Boolean), 
    };
  }, [weightRecords, targetWeight]); // *** 依賴列表加入 targetWeight ***

  // --- 熱量淨盈餘圖表數據 ---
  const calorieSurplusChartData = useMemo(() => {
    // 限制顯示最近 14 天的數據，並按時間正序
    const recentGroups = groupedMeals.slice(0, 14).reverse(); 

    const labels = recentGroups.map(group => group.date);
    const surplusData = recentGroups.map(group => 
        group.totalKcal - targetKcal // 攝取熱量 - 目標熱量
    );

    return {
        labels,
        datasets: [
            {
                label: '熱量淨盈餘 (kcal)',
                data: surplusData,
                backgroundColor: surplusData.map(val => val > 0 ? '#dc3545' : '#28a745'), // 紅色(盈餘)/綠色(赤字)
                borderColor: '#343a40',
                borderWidth: 1,
            },
        ],
    };
  }, [groupedMeals, targetKcal]);


  // --- 介面渲染 ---
  if (!isAuth) {
    return <div>正在驗證身份...</div>;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const todaySummary = groupedMeals.find(g => g.date === today) || { totalKcal: 0, totalProtein: 0 };


  return (
    <div style={styles.container}>
      <h1 style={styles.header}>
          💪 {username} 的增肌減脂儀表板
      </h1>
      <button onClick={handleLogout} style={styles.logoutButton}>
          登出
      </button>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.grid}>
          
          {/* ======================================= */}
          {/* 熱量/蛋白質 目標設定區塊 */}
          {/* ======================================= */}
          <div style={styles.card}>
              <h3>🎯 每日宏量目標 (Kcal/Protein)</h3>
              <p>當前目標：熱量 <strong style={{color: '#dc3545'}}>{targetKcal} kcal</strong> / 蛋白質 <strong style={{color: '#007bff'}}>{targetProtein} g</strong></p>
              <form onSubmit={handleSetGoals} style={styles.formGoal}>
                  <input
                      type="number"
                      placeholder="熱量目標 (kcal)"
                      value={targetKcalInput}
                      onChange={(e) => setTargetKcalInput(e.target.value)}
                      style={styles.inputWeight}
                      required
                  />
                   <input
                      type="number"
                      step="0.1"
                      placeholder="蛋白質目標 (g)"
                      value={targetProteinInput}
                      onChange={(e) => setTargetProteinInput(e.target.value)}
                      style={styles.inputWeight}
                      required
                  />
                  <button type="submit" style={styles.buttonSubmitWeight}>
                      更新宏量目標
                  </button>
              </form>
          </div>

          {/* ======================================= */}
          {/* 體重追蹤區塊 (含目標體重設定) */}
          {/* ======================================= */}
          <div style={styles.card}>
              <h3>體重追蹤</h3>
              <p>最新體重：<strong style={{fontSize: '1.5em'}}>{weight} kg</strong></p>
              
              {/* *** 目標體重設定 UI (新增) *** */}
              <div style={{marginTop: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee'}}>
                  <h4>🎯 設定體重目標</h4>
                  <p>當前目標: <strong style={{color: targetWeight ? '#28a745' : '#dc3545'}}>{targetWeight ? `${targetWeight} kg` : '未設定'}</strong></p>
                  <form onSubmit={handleSetTargetWeight} style={styles.formWeight}>
                      <input
                          type="number"
                          step="0.1"
                          placeholder="設定目標 (kg)"
                          value={targetWeightInput}
                          onChange={(e) => setTargetWeightInput(e.target.value)}
                          style={styles.inputWeight}
                          required
                      />
                      <button type="submit" style={{...styles.buttonSubmitWeight, backgroundColor: '#28a745'}}>
                          設定體重目標
                      </button>
                  </form>
              </div>
              
              {/* 紀錄體重表單 */}
              <form onSubmit={handleRecordWeight} style={styles.formWeight}>
                  <input
                      type="date"
                      value={weightRecordDate}
                      onChange={(e) => setWeightRecordDate(e.target.value)}
                      style={{...styles.inputWeight, minWidth: '120px'}}
                      required
                  />
                  <input
                      type="number"
                      step="0.1"
                      placeholder="輸入體重 (kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      style={styles.inputWeight}
                      required
                  />
                  <button type="submit" style={styles.buttonSubmitWeight}>
                      紀錄體重
                  </button>
              </form>
              
              {/* 體重歷史紀錄按鈕與顯示區塊 (新增) */}
              <div style={{marginTop: '15px'}}>
                <button 
                    onClick={() => setShowWeightHistory(!showWeightHistory)} 
                    style={{ ...styles.dayButton, width: '100%', backgroundColor: '#17a2b8' }} 
                >
                    {showWeightHistory ? '隱藏' : '查看所有'}體重紀錄 ({weightRecords.length} 筆)
                    <span style={{marginLeft: '10px'}}>
                        {showWeightHistory ? '▲' : '▼'}
                    </span>
                </button>
                
                {showWeightHistory && weightRecords.length > 0 && (
                    <div style={styles.historyContainer}>
                        <table style={styles.tableHistory}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>日期</th>
                                    <th style={styles.th}>體重 (kg)</th>
                                    <th style={styles.th}>刪除</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weightRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td style={styles.td}>{record.record_date}</td>
                                        <td style={styles.td}>{record.weight}</td>
                                        <td style={styles.td}>
                                            <button 
                                                onClick={() => handleDelete('weight', record.id)} 
                                                style={styles.deleteButton}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

              {/* 體重折線圖 */}
              {weightRecords.length > 1 && (
                  <div style={{marginTop: '25px'}}>
                      <h4>體重變化趨勢圖 (含目標線)</h4>
                      <div style={{width: '100%', height: '300px'}}>
                          <Line 
                              data={chartData} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false, 
                                scales: {
                                  y: {
                                    beginAtZero: false,
                                    title: {
                                      display: true,
                                      text: '體重 (kg)'
                                    }
                                  }
                                }
                              }}
                          />
                          
                      </div>
                  </div>
              )}
          </div>
          
      </div> {/* end grid */}
      
      {/* ======================================= */}
      {/* 熱量淨盈餘追蹤圖表 */}
      {/* ======================================= */}
      {groupedMeals.length > 0 && (
          <div style={styles.cardFull}>
              <h3>🔥 熱量淨盈餘追蹤 (最近 {Math.min(groupedMeals.length, 14)} 天)</h3>
              <p>目標熱量: {targetKcal} kcal. 紅色 (正值) 為攝取過多 (盈餘)，綠色 (負值) 為攝取不足 (赤字)。</p>
              
              <div style={{width: '100%', height: '350px', marginTop: '15px'}}>
                  <Line 
                      data={calorieSurplusChartData} 
                      options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                              y: {
                                  beginAtZero: false,
                                  title: { display: true, text: '淨盈餘 (kcal)' },
                                  // 加入一條零線來區分盈餘/赤字
                                  suggestedMax: targetKcal / 4, 
                                  suggestedMin: -targetKcal / 4
                              },
                              x: {
                                  stacked: true,
                              }
                          }
                      }}
                  />
                  
              </div>
          </div>
      )}

      {/* ======================================= */}
      {/* 膳食輸入區塊 (手動輸入熱量/蛋白質) */}
      {/* ======================================= */}
      <div style={styles.cardFull}>
          <h3>膳食紀錄 (手動輸入)</h3>
          <form onSubmit={handleAnalyzeMeal}>
              <div style={{...styles.inputGroupFull, marginBottom: '10px'}}>
                <input 
                    type="date" 
                    value={mealRecordDate} 
                    onChange={(e) => setMealRecordDate(e.target.value)}
                    style={{...styles.inputMeal, minWidth: '150px', flexGrow: 0}}
                    required
                />
                
                <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    style={styles.select}
                >
                    {MEAL_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="食物描述 (如：雞胸肉 150g)"
                    value={mealInput}
                    onChange={(e) => setMealInput(e.target.value)}
                    style={styles.inputMeal}
                    required
                />
              </div>
              <div style={styles.inputGroupFull}>
                  {/* 熱量輸入 */}
                  <input
                      type="number"
                      step="1"
                      placeholder="熱量 (kcal)"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      style={{...styles.inputMeal, minWidth: '120px'}}
                      required
                  />
                  {/* 蛋白質輸入 */}
                  <input
                      type="number"
                      step="0.1"
                      placeholder="蛋白質 (g)"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value)}
                      style={{...styles.inputMeal, minWidth: '120px'}}
                      required
                  />
                  <button 
                      type="submit" 
                      style={styles.buttonAnalyze}
                      disabled={isAnalyzing}
                  >
                      {isAnalyzing ? '紀錄中...' : '紀錄食物'} 
                  </button>
              </div>
          </form>
      </div>

      {/* ======================================= */}
      {/* 膳食紀錄分組顯示 (含刪除按鈕) */}
      {/* ======================================= */}
      <div style={styles.cardFull}>
          <h3>膳食紀錄歷史 ({groupedMeals.length} 天)</h3>
          <p>今日 ({today}) 總熱量：<strong style={{color: todaySummary.totalKcal > targetKcal ? '#dc3545' : '#28a745'}}>{todaySummary.totalKcal.toFixed(0)} kcal</strong> / 總蛋白質：<strong style={{color: todaySummary.totalProtein < targetProtein ? '#dc3545' : '#28a745'}}>{todaySummary.totalProtein.toFixed(1)} g</strong></p>
          
          <div style={{marginTop: '20px'}}>
              {groupedMeals.map((dayGroup) => (
                  <div key={dayGroup.date} style={styles.dailyGroup}>
                      {/* 日期按鈕 (可展開) */}
                      <button 
                          onClick={() => toggleMealDetails(dayGroup.date)}
                          style={{...styles.dayButton, backgroundColor: dayGroup.date === today ? '#007bff' : '#6c757d'}}
                      >
                          {dayGroup.date} {dayGroup.date === today ? '(今日)' : ''} | 總熱量: {dayGroup.totalKcal.toFixed(0)} kcal | 總蛋白質: {dayGroup.totalProtein.toFixed(1)} g
                          <span style={{marginLeft: '10px'}}>
                              {expandedDates[dayGroup.date] ? '▲' : '▼'}
                          </span>
                      </button>

                      {/* 展開內容 */}
                      {expandedDates[dayGroup.date] && (
                          <div style={styles.mealDetailBox}>
                              <table style={styles.table}>
                                  <thead>
                                      <tr>
                                          <th>餐別</th>
                                          <th>食物描述</th>
                                          <th>熱量 (kcal)</th>
                                          <th>蛋白質 (g)</th>
                                          <th>操作</th> {/* 新增操作欄位 */}
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {dayGroup.entries.map((meal) => (
                                          <tr key={meal.entry_id}>
                                              <td>{meal.meal_type}</td>
                                              <td>{meal.food_description}</td>
                                              <td>{meal.calories_kcal}</td>
                                              <td>{meal.protein_g}</td>
                                              {/* 膳食刪除按鈕 */}
                                              <td>
                                                  <button 
                                                      onClick={() => handleDelete('meal', meal.entry_id)}
                                                      style={styles.deleteButton}
                                                  >
                                                      🗑️
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
}

// 簡單的內聯 CSS 樣式
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    header: {
        color: '#343a40',
        marginBottom: '20px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
    },
    logoutButton: {
        float: 'right',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '-50px'
    },
    message: {
        padding: '10px',
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeeba',
        borderRadius: '4px',
        marginBottom: '20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    card: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderLeft: '5px solid #007bff'
    },
    cardFull: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderLeft: '5px solid #28a745',
        marginBottom: '20px'
    },
    inputGroupFull: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    },
    select: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        minWidth: '100px',
        flexGrow: 0
    },
    inputMeal: {
        flexGrow: 1,
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        minWidth: '150px'
    },
    buttonAnalyze: {
        padding: '10px 15px',
        backgroundColor: '#28a745', 
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        whiteSpace: 'nowrap'
    },
    formWeight: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    formGoal: { 
        display: 'flex',
        gap: '10px',
        marginTop: '10px',
        flexWrap: 'wrap'
    },
    inputWeight: {
        flexGrow: 1,
        padding: '8px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ced4da'
    },
    buttonSubmitWeight: {
        padding: '8px 15px',
        backgroundColor: '#007bff', 
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        whiteSpace: 'nowrap'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
        fontSize: '0.9em'
    },
    tableHistory: { // 新增歷史紀錄表格樣式
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.9em'
    },
    th: {
        borderBottom: '2px solid #333',
        padding: '8px',
        textAlign: 'left',
        backgroundColor: '#e9ecef',
    },
    td: {
        borderBottom: '1px solid #dee2e6',
        padding: '8px',
        textAlign: 'left'
    },
    historyContainer: { // 歷史紀錄捲軸容器
        maxHeight: '300px', 
        overflowY: 'auto', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginTop: '10px'
    },
    dailyGroup: { 
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        marginBottom: '10px',
        overflow: 'hidden'
    },
    dayButton: { 
        width: '100%',
        textAlign: 'left',
        padding: '12px 15px',
        border: 'none',
        color: 'white',
        fontSize: '1em',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    mealDetailBox: {
        padding: '15px',
        backgroundColor: '#fff'
    },
    deleteButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#dc3545',
        cursor: 'pointer',
        fontSize: '1em',
        padding: '0 5px'
    }
};

export default Dashboard;