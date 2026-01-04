//Configuration (クラス選択 / Class Selection)
const USERS = {
    'student1@college.com': { password: 'password123', name: 'Tanaka Yuki' },
    'student2@college.com': { password: 'password123', name: 'Suzuki Hiroshi' },
    'student3@college.com': { password: 'password123', name: 'Admin User' }
};
const CLASSES = ['CS-101', 'CS-102', 'CS-201', 'CS-202', 'IT-101', 'IT-102', 'IT-201', 'IT-202'];

let currentUser = null, currentClass = null, attendanceRecords = [];

// ユーティリティFunctions
function getTime() { 
    const d = new Date(); 
    return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); 
}

function clearErrors() { 
    ['emailError','passwordError','classError'].forEach(id => { 
        const el = document.getElementById(id); 
        if(el) el.textContent = ''; 
    }); 
}

function showMessage(msg, type = 'success') { 
    const el = document.getElementById('successMessage'); 
    if(!el) return; 
    el.innerHTML = `<div style="background:${type==='success'?'#4caf50':'#f44336'};color:white;padding:12px;border-radius:8px;text-align:center;">${msg}</div>`; 
    setTimeout(()=>el.innerHTML='',3000); 
}

// データ Storage
function saveData() { 
    if(currentUser) localStorage.setItem('attendance_'+currentUser, JSON.stringify(attendanceRecords)); 
}

function loadData() { 
    if(currentUser) { 
        const data = localStorage.getItem('attendance_'+currentUser); 
        attendanceRecords = data ? JSON.parse(data) : []; 
    } 
}
//  Page Detection
function detectPage() { 
    return window.location.pathname.includes('dashboard') ? 'dashboard' : 'login'; 
}

// ログイン処理 
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const classSelect = document.getElementById('class').value;
    
    clearErrors();
    
    // バリデーション / Validation
    if(!classSelect) { 
        document.getElementById('classError').textContent = 'クラス選択が必要です'; 
        return; 
    }
    
    if(!USERS[email]) { 
        document.getElementById('emailError').textContent = 'ユーザーが存在しません'; 
        return; 
    }
    
    if(USERS[email].password !== password) { 
        document.getElementById('passwordError').textContent = 'パスワードが間違っています'; 
        return; 
    }
    
    // ユーザー情報を保存 
    currentUser = email;
    currentClass = classSelect;
    sessionStorage.setItem('currentUser', email);
    sessionStorage.setItem('currentClass', classSelect);
    
    loadData();
    window.location.href = 'pages/dashboard.html';
}

// ダッシュボード読み込み 
function loadUserInfo() {
    currentUser = sessionStorage.getItem('currentUser');
    currentClass = sessionStorage.getItem('currentClass');
    
    if(!currentUser) { 
        window.location.href = '../index.html'; 
        return; 
    }
    
    loadData();
    const user = USERS[currentUser];
    
    // ユーザー情報を表示 
    if(document.getElementById('sidebarName')) document.getElementById('sidebarName').textContent = user.name;
    if(document.getElementById('sidebarClass')) document.getElementById('sidebarClass').textContent = currentClass;
    if(document.getElementById('profileName')) document.getElementById('profileName').textContent = user.name;
    if(document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = currentUser;
    if(document.getElementById('profileClass')) document.getElementById('profileClass').textContent = currentClass;
}

// 出席をマーク 
function markAttendance(e) {
    e.preventDefault();
    
    const subject = document.getElementById('subject').value;
    const semester = document.getElementById('semester').value;
    const time = document.getElementById('time').value || getTime();
    
    // バリデーション 
    if(!subject || !semester) { 
        showMessage('科目とセメスターを選択してください', 'error'); 
        return; 
    }
    
    // 記録を追加 
    attendanceRecords.unshift({subject, semester, time});
    saveData();
    document.getElementById('attendanceForm').reset();
    showMessage('出席を登録しました');
    displayRecords();
    
    if(document.getElementById('totalAttendance')) 
        document.getElementById('totalAttendance').textContent = attendanceRecords.length;
}

// 記録を表示 / Display Records
function displayRecords() {
    const list = document.getElementById('recordsList');
    if(!list) return;
    
    if(!attendanceRecords.length) { 
        list.innerHTML = '<div class="empty-message">No records yet</div>'; 
        return; 
    }
    
    let html = '';
    attendanceRecords.forEach((r,i)=>{ 
        html += `<div class="record-item"><div class="record-info"><div class="record-date">Record #${i+1}</div><div class="record-detail">${r.subject} - ${r.semester}</div><div class="record-date">${r.time}</div></div><span class="status-badge">Present</span></div>`; 
    });
    
    list.innerHTML = html;
}

// セクションを表示 
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    if(document.getElementById(sectionId)) document.getElementById(sectionId).classList.add('active');
}

// ログアウト 
function handleLogout() {
    saveData();
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentClass');
    currentUser = null;
    currentClass = null;
    attendanceRecords = [];
    window.location.href = '../index.html';
}

// イベントリスナーをセットアップ / Setup Listeners
function setupLoginListeners() {
    const form = document.getElementById('loginForm');
    if(form) form.addEventListener('submit', handleLogin);
}

function setupDashboardListeners() {
    // ナビゲーションボタン / Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e)=>{
            const sectionId = e.currentTarget.dataset.section;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            showSection(sectionId);
        });
    });
    
    // ログアウトボタン / Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // 出席フォーム / Attendance form
    const attendanceForm = document.getElementById('attendanceForm');
    if(attendanceForm) attendanceForm.addEventListener('submit', markAttendance);
    
    // Excelエクスポートボタン / Excel export button
    const exportBtn = document.getElementById('exportBtn');
    if(exportBtn) exportBtn.addEventListener('click', downloadExcel);
}

// 初期化 
document.addEventListener('DOMContentLoaded', function() {
    const page = detectPage();
    
    if(page === 'login') { 
        setupLoginListeners(); 
    }
    else if(page === 'dashboard') { 
        loadUserInfo(); 
        displayRecords(); 
        setupDashboardListeners(); 
    }
});