"use strict";

// --- State Management ---
let tasks = [];
let theme = localStorage.getItem('orbit_theme') || 'dark';

// Variables for timer
let timerInterval;
let timerSeconds = 25 * 60;
let isTimerRunning = false;
let currentTimerMode = 25; // in minutes

// Journal data state
let journalData = {};

// Variables for gate timer
let gateTimerInterval;
let gateTimerSeconds = 180 * 60;
let isGateTimerRunning = false;
let currentGateTimerMode = 180;

// --- DOM Elements ---
// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const pageViews = document.querySelectorAll('.page-view');

// Journal
const journalDateInput = document.getElementById('journalDate');
const journalTextarea = document.getElementById('journalTextarea');
const saveJournalBtn = document.getElementById('saveJournalBtn');
const journalCurrentDateDisplay = document.getElementById('journalCurrentDateDisplay');
const journalStatus = document.getElementById('journalStatus');

// Gate Timer
const gateTimerDisplay = document.getElementById('gateTimerDisplay');
const startGateTimerBtn = document.getElementById('startGateTimerBtn');
const resetGateTimerBtn = document.getElementById('resetGateTimerBtn');
const gateModeBtns = document.querySelectorAll('.gate-mode-btn');
const gateProgressCircle = document.querySelector('.gate-progress-ring__circle');

// Header
const themeToggleBtn = document.getElementById('themeToggle');
const greetingTime = document.getElementById('greetingTime');
const currentDateEl = document.getElementById('currentDate');
const completedTodayCount = document.getElementById('completedTodayCount');

// Form & Inputs
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskRegular = document.getElementById('taskRegular');

// Task List
const dailyTaskListEl = document.getElementById('dailyTaskList');
const oneOffTaskListEl = document.getElementById('oneOffTaskList');
const filterBtns = document.querySelectorAll('.filter-btn');
let currentFilter = 'all';

// Activity
const currentStreakEl = document.getElementById('currentStreak');
const maxStreakEl = document.getElementById('maxStreak');
const activityGridEl = document.getElementById('activityGrid');

// Stats
const activeTaskCount = document.getElementById('activeTaskCount');
const totalCompletedCount = document.getElementById('totalCompletedCount');

// Timer
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressCircle = document.querySelector('.progress-ring__circle');

// Initialization
async function init() {
    applyTheme(theme);
    updateDateAndGreeting();
    await loadTasks();
    await loadJournal();
    checkDailyReset();
    renderTasks();
    initTimerDisplay();
    initJournalUI();
    initGateTimerDisplay();
    setupNavigation();
}

async function loadJournal() {
    try {
        const res = await fetch('http://localhost:4000/api/journal');
        if (res.ok) {
            journalData = await res.json();
        }
    } catch (e) {
        console.error('Failed to load journal', e);
    }
}

async function loadTasks() {
    try {
        const res = await fetch('http://localhost:4000/api/tasks');
        if (res.ok) {
            tasks = await res.json();
            updateStats();
        }
    } catch (e) {
        console.error('Failed to load tasks', e);
    }
}

function checkDailyReset() {
    const lastDate = localStorage.getItem('orbit_lastDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        let changed = false;
        tasks.forEach(t => {
            if (t.isRegular && t.completed) {
                t.completed = false;
                t.completedAt = null;
                changed = true;
            }
        });
        localStorage.setItem('orbit_lastDate', today);
        if (changed) saveTasks(); 
    }
}

// --- Theme Management ---
function applyTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    const icon = themeToggleBtn.querySelector('i');
    if (newTheme === 'light') {
        icon.classList.remove('ph-sun');
        icon.classList.add('ph-moon');
    } else {
        icon.classList.remove('ph-moon');
        icon.classList.add('ph-sun');
    }
    localStorage.setItem('orbit_theme', newTheme);
}

themeToggleBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
});

// --- Header Setup ---
function updateDateAndGreeting() {
    const now = new Date();
    const hour = now.getHours();
    
    let greeting = "Evening";
    if (hour < 12) greeting = "Morning";
    else if (hour < 17) greeting = "Afternoon";
    greetingTime.textContent = greeting;

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
}

// --- Task Management ---
function saveTasks() {
    updateStats();
    fetch('http://localhost:4000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
    }).catch(e => console.error('Failed to save tasks', e));
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text,
        category: taskCategory.value,
        priority: taskPriority.value,
        isRegular: taskRegular.checked,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        history: []
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskRegular.checked = false;
});

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        if (!task.history) task.history = [];
        
        if (task.completed) {
            task.history.push(task.completedAt);
        } else {
            const todayStr = new Date().toDateString();
            task.history = task.history.filter(d => new Date(d).toDateString() !== todayStr);
        }
        
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id, element) {
    element.classList.add('fade-out');
    setTimeout(() => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }, 300);
}

// --- Rendering & Filtering ---
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

function getFilteredTasks() {
    if (currentFilter === 'active') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    const dailyTasks = filteredTasks.filter(t => t.isRegular);
    const oneOffTasks = filteredTasks.filter(t => !t.isRegular);
    
    renderTaskList(dailyTasks, dailyTaskListEl, "No daily habits added yet.");
    renderTaskList(oneOffTasks, oneOffTaskListEl, "No one-off tasks here.");
    
    renderActivityCalendar();
}

function renderTaskList(taskArray, containerEl, emptyMessage) {
    if (taskArray.length === 0) {
        containerEl.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-list-dashes"></i>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }

    containerEl.innerHTML = '';
    taskArray.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const isRegHtml = task.isRegular ? `<span class="badge cat-general"><i class="ph ph-arrows-clockwise" style="margin-right:2px"></i>Daily</span>` : '';

        item.innerHTML = `
            <div class="task-content">
                <div class="checkbox" onclick="toggleTaskStatus('${task.id}')">
                    <i class="ph ph-check"></i>
                </div>
                <div class="task-text">
                    <span class="task-name">${escapeHTML(task.text)}</span>
                    <div class="task-meta">
                        ${isRegHtml}
                        <span class="badge cat-${task.category.toLowerCase()}">${task.category}</span>
                        <span class="badge priority-${task.priority}">${capitalize(task.priority)}</span>
                    </div>
                </div>
            </div>
            <div class="task-item-actions">
                <button class="task-edit" aria-label="Edit Task">
                    <i class="ph ph-pencil-simple"></i>
                </button>
                <button class="task-delete" aria-label="Delete Task">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        item.querySelector('.task-delete').addEventListener('click', () => {
            deleteTask(task.id, item);
        });

        item.querySelector('.task-edit').addEventListener('click', () => {
            item.innerHTML = `
                <div class="task-edit-form">
                    <input type="text" class="edit-input" value="${escapeHTML(task.text)}">
                    <select class="custom-select edit-category">
                        <option value="General" ${task.category==='General'?'selected':''}>General</option>
                        <option value="Work" ${task.category==='Work'?'selected':''}>Work</option>
                        <option value="Personal" ${task.category==='Personal'?'selected':''}>Personal</option>
                        <option value="Health" ${task.category==='Health'?'selected':''}>Health</option>
                    </select>
                    <select class="custom-select edit-priority">
                        <option value="low" ${task.priority==='low'?'selected':''}>Low</option>
                        <option value="medium" ${task.priority==='medium'?'selected':''}>Medium</option>
                        <option value="high" ${task.priority==='high'?'selected':''}>High</option>
                    </select>
                    <button class="edit-btn save-edit"><i class="ph ph-check"></i></button>
                    <button class="edit-btn cancel-edit" style="background:var(--input-bg);color:var(--text-main)"><i class="ph ph-x"></i></button>
                </div>
            `;
            
            const saveBtn = item.querySelector('.save-edit');
            const cancelBtn = item.querySelector('.cancel-edit');
            const editInput = item.querySelector('.edit-input');
            const editCat = item.querySelector('.edit-category');
            const editPri = item.querySelector('.edit-priority');

            saveBtn.addEventListener('click', () => {
                const newText = editInput.value.trim();
                if(newText) {
                    task.text = newText;
                    task.category = editCat.value;
                    task.priority = editPri.value;
                    saveTasks();
                    renderTasks();
                }
            });

            cancelBtn.addEventListener('click', () => {
                renderTasks();
            });
        });

        containerEl.appendChild(item);
    });
}

function renderActivityCalendar() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const activityMap = {};

    tasks.forEach(t => {
        if (t.history && Array.isArray(t.history)) {
            t.history.forEach(dStr => {
                const mapKey = new Date(dStr).toDateString();
                activityMap[mapKey] = (activityMap[mapKey] || 0) + 1;
            });
        } else if (t.completedAt) {
            const mapKey = new Date(t.completedAt).toDateString();
            activityMap[mapKey] = (activityMap[mapKey] || 0) + 1;
        }
    });

    const WEEKS = 14;
    const DAYS = WEEKS * 7;
    
    activityGridEl.innerHTML = '';
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (today.getDay()) - ((WEEKS - 1) * 7));

    for (let i = 0; i < DAYS; i++) {
        const iterDate = new Date(startDate);
        iterDate.setDate(startDate.getDate() + i);
        const mapKey = iterDate.toDateString();
        const count = activityMap[mapKey] || 0;

        const square = document.createElement('div');
        square.className = 'day-square';
        
        let level = 0;
        if (count > 0) level = 1;
        if (count >= 2) level = 2;
        if (count >= 4) level = 3;
        if (count >= 6) level = 4;
        
        square.setAttribute('data-level', level);
        
        const formattedDate = iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        square.setAttribute('data-tooltip', `${count} completions on ${formattedDate}`);
        
        if (iterDate > today) {
            square.style.visibility = 'hidden';
            square.setAttribute('data-tooltip', ``);
        }
        
        activityGridEl.appendChild(square);
    }
    
    let curStreak = 0;
    for(let i = 0; i <= DAYS; i++) {
       const checkDate = new Date(today);
       checkDate.setDate(today.getDate() - i);
       const c = activityMap[checkDate.toDateString()] || 0;
       if (i === 0 && c === 0) continue; 
       if (c > 0) {
           curStreak++;
       } else {
           break;
       }
    }
    
    let maxFound = 0;
    const sortedDates = Object.keys(activityMap).map(d => new Date(d)).sort((a,b)=>a-b);
    if (sortedDates.length > 0) {
        let firstD = new Date(sortedDates[0]);
        firstD.setHours(0,0,0,0);
        const lastD = new Date(today);
        let run = 0;
        for (let d = firstD; d <= lastD; d.setDate(d.getDate() + 1)) {
             const c = activityMap[d.toDateString()] || 0;
             if (c > 0) {
                 run++;
                 if (run > maxFound) maxFound = run;
             } else {
                 run = 0;
             }
        }
    }
    
    currentStreakEl.innerHTML = `${curStreak} <i class="ph-fill ph-fire" style="color: var(--warning); font-size: 1.2rem;"></i>`;
    maxStreakEl.innerHTML = `${maxFound} <i class="ph-fill ph-trophy" style="color: var(--warning); font-size: 1.2rem;"></i>`;
}

function updateStats() {
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    
    // Calculate completed today
    const today = new Date().toDateString();
    const completedToday = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt).toDateString() === today;
    }).length;

    activeTaskCount.textContent = active;
    totalCompletedCount.textContent = completed;
    completedTodayCount.textContent = completedToday;
}

// --- Pomodoro Timer ---
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = 0;

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

function initTimerDisplay() {
    timerSeconds = currentTimerMode * 60;
    updateTimerUI();
    setProgress(100);
}

function updateTimerUI() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Update progress ring
    const totalSeconds = currentTimerMode * 60;
    const progress = (timerSeconds / totalSeconds) * 100;
    setProgress(progress);
}

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.log("Audio not supported or allowed.");
    }
}

startTimerBtn.addEventListener('click', () => {
    const icon = startTimerBtn.querySelector('i');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        icon.classList.replace('ph-pause', 'ph-play');
        isTimerRunning = false;
    } else {
        if (timerSeconds <= 0) initTimerDisplay(); // Reset if finished
        icon.classList.replace('ph-play', 'ph-pause');
        isTimerRunning = true;
        
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerUI();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                icon.classList.replace('ph-pause', 'ph-play');
                playBeep();
            }
        }, 1000);
    }
});

resetTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.querySelector('i').classList.replace('ph-pause', 'ph-play');
    initTimerDisplay();
});

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimerMode = parseInt(btn.dataset.time);
        clearInterval(timerInterval);
        isTimerRunning = false;
        startTimerBtn.querySelector('i').classList.replace('ph-pause', 'ph-play');
        initTimerDisplay();
    });
});

// --- Navigation ---
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetId = btn.dataset.target;
            pageViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) view.classList.add('active');
            });
        });
    });
}

// --- Journal Logic ---
function initJournalUI() {
    const today = new Date().toISOString().split('T')[0];
    journalDateInput.value = today;
    journalCurrentDateDisplay.textContent = "Today";
    loadJournalEntry(today);

    journalDateInput.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate === todayStr) {
            journalCurrentDateDisplay.textContent = "Today";
        } else {
            journalCurrentDateDisplay.textContent = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
        loadJournalEntry(selectedDate);
    });

    saveJournalBtn.addEventListener('click', async () => {
        const date = journalDateInput.value;
        journalData[date] = journalTextarea.value;
        
        try {
            await fetch('http://localhost:4000/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(journalData)
            });
            journalStatus.textContent = "Saved";
            journalStatus.classList.add('show');
            setTimeout(() => journalStatus.classList.remove('show'), 3000);
        } catch(e) {
            console.error(e);
            journalStatus.textContent = "Error saving";
            journalStatus.classList.add('show');
            setTimeout(() => journalStatus.classList.remove('show'), 3000);
        }
    });

    journalTextarea.addEventListener('input', () => {
        journalStatus.textContent = "Unsaved changes...";
        journalStatus.classList.remove('show');
    });
}

function loadJournalEntry(date) {
    journalTextarea.value = journalData[date] || "";
    journalStatus.classList.remove('show');
}

// --- Gate Focus Timer ---
let gateRadius = 0;
let gateCircumference = 0;
if (gateProgressCircle) {
    gateRadius = gateProgressCircle.r.baseVal.value;
    gateCircumference = gateRadius * 2 * Math.PI;
    gateProgressCircle.style.strokeDasharray = `${gateCircumference} ${gateCircumference}`;
    gateProgressCircle.style.strokeDashoffset = 0;
}

function setGateProgress(percent) {
    if (!gateProgressCircle) return;
    const offset = gateCircumference - percent / 100 * gateCircumference;
    gateProgressCircle.style.strokeDashoffset = offset;
}

function initGateTimerDisplay() {
    gateTimerSeconds = currentGateTimerMode * 60;
    updateGateTimerUI();
    setGateProgress(100);
}

function updateGateTimerUI() {
    const hrs = Math.floor(gateTimerSeconds / 3600);
    const mins = Math.floor((gateTimerSeconds % 3600) / 60);
    const secs = gateTimerSeconds % 60;
    gateTimerDisplay.textContent = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const totalSeconds = currentGateTimerMode * 60;
    const progress = (gateTimerSeconds / totalSeconds) * 100;
    setGateProgress(progress);
}

startGateTimerBtn.addEventListener('click', () => {
    const icon = startGateTimerBtn.querySelector('i');
    if (isGateTimerRunning) {
        clearInterval(gateTimerInterval);
        icon.classList.replace('ph-pause', 'ph-play');
        isGateTimerRunning = false;
    } else {
        if (gateTimerSeconds <= 0) initGateTimerDisplay();
        icon.classList.replace('ph-play', 'ph-pause');
        isGateTimerRunning = true;
        
        gateTimerInterval = setInterval(() => {
            gateTimerSeconds--;
            updateGateTimerUI();
            
            if (gateTimerSeconds <= 0) {
                clearInterval(gateTimerInterval);
                isGateTimerRunning = false;
                icon.classList.replace('ph-pause', 'ph-play');
                playBeep();
            }
        }, 1000);
    }
});

resetGateTimerBtn.addEventListener('click', () => {
    clearInterval(gateTimerInterval);
    isGateTimerRunning = false;
    startGateTimerBtn.querySelector('i').classList.replace('ph-pause', 'ph-play');
    initGateTimerDisplay();
});

gateModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        gateModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGateTimerMode = parseInt(btn.dataset.time);
        clearInterval(gateTimerInterval);
        isGateTimerRunning = false;
        startGateTimerBtn.querySelector('i').classList.replace('ph-pause', 'ph-play');
        initGateTimerDisplay();
    });
});

// --- Utilities ---
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Quick Links Logic ---
let quickLinks = JSON.parse(localStorage.getItem('orbit_quickLinks')) || [];

const quickLinkForm = document.getElementById('quickLinkForm');
const linkNameInput = document.getElementById('linkNameInput');
const linkUrlInput = document.getElementById('linkUrlInput');
const quickLinksContainer = document.getElementById('quickLinksContainer');

function renderQuickLinks() {
    if (!quickLinksContainer) return;
    quickLinksContainer.innerHTML = '';
    if (quickLinks.length === 0) {
        quickLinksContainer.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem 1rem;">
                <i class="ph ph-link-break"></i>
                <p>No quick links added.</p>
            </div>
        `;
        return;
    }
    quickLinks.forEach(link => {
        const item = document.createElement('div');
        item.className = 'task-item'; 
        item.innerHTML = `
            <div class="task-content" style="cursor: pointer;" onclick="window.open('${escapeHTML(link.url)}', '_blank')">
                <div class="task-text">
                    <span class="task-name">${escapeHTML(link.name)}</span>
                    <div class="task-meta">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(link.url)}</span>
                    </div>
                </div>
            </div>
            <div class="task-item-actions">
                <button class="task-delete" aria-label="Delete Link">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;
        
        item.querySelector('.task-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteQuickLink(link.id, item);
        });

        quickLinksContainer.appendChild(item);
    });
}

function deleteQuickLink(id, element) {
    element.classList.add('fade-out');
    setTimeout(() => {
        quickLinks = quickLinks.filter(l => l.id !== id);
        localStorage.setItem('orbit_quickLinks', JSON.stringify(quickLinks));
        renderQuickLinks();
    }, 300);
}

if (quickLinkForm) {
    quickLinkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = linkNameInput.value.trim();
        const url = linkUrlInput.value.trim();
        if (!name || !url) return;

        const newLink = {
            id: Date.now().toString(),
            name,
            url
        };
        quickLinks.push(newLink);
        localStorage.setItem('orbit_quickLinks', JSON.stringify(quickLinks));
        renderQuickLinks();

        linkNameInput.value = '';
        linkUrlInput.value = '';
    });
}

// --- Daily Schedule Logic ---
let dailySchedule = JSON.parse(localStorage.getItem('orbit_schedule')) || [];

const scheduleForm = document.getElementById('scheduleForm');
const scheduleStart = document.getElementById('scheduleStart');
const scheduleEnd = document.getElementById('scheduleEnd');
const scheduleActivity = document.getElementById('scheduleActivity');
const scheduleCategory = document.getElementById('scheduleCategory');
const scheduleTimeline = document.getElementById('scheduleTimeline');
const clearScheduleBtn = document.getElementById('clearScheduleBtn');

function formatTime(time24) {
    const [h, m] = time24.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCategoryIcon(category) {
    switch (category) {
        case 'Work': return 'ph-briefcase';
        case 'Study': return 'ph-books';
        case 'Break': return 'ph-coffee';
        default: return 'ph-check-circle';
    }
}

function getCategoryColor(category) {
    switch (category) {
        case 'Work': return 'var(--cat-work)';
        case 'Study': return 'var(--primary)';
        case 'Break': return 'var(--cat-health)';
        default: return 'var(--cat-general)';
    }
}

function renderSchedule() {
    if (!scheduleTimeline) return;
    scheduleTimeline.innerHTML = '';
    
    if (dailySchedule.length === 0) {
        scheduleTimeline.innerHTML = `
            <div class="empty-state" style="padding: 3rem 1rem;">
                <i class="ph ph-calendar-blank" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-muted); opacity: 0.5;"></i>
                <p>No activities scheduled yet.</p>
            </div>
        `;
        return;
    }

    dailySchedule.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-time-col">
                <div class="timeline-dot" style="border-color: ${getCategoryColor(item.category)}; color: ${getCategoryColor(item.category)};">
                    <i class="ph ${getCategoryIcon(item.category)}"></i>
                </div>
                <div class="timeline-time-label">
                    ${formatTime(item.start)}<br><span style="font-size:0.5rem; color:var(--text-muted)">|</span><br>${formatTime(item.end)}
                </div>
            </div>
            <div class="timeline-content">
                <div class="timeline-details">
                    <h3>${escapeHTML(item.activity)}</h3>
                    <span class="badge" style="background: ${getCategoryColor(item.category)}20; color: ${getCategoryColor(item.category)}; font-size: 0.75rem;">
                        ${item.category}
                    </span>
                </div>
                <div class="timeline-actions">
                    <button class="task-delete" aria-label="Remove Block" style="opacity:1;">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        `;

        div.querySelector('.task-delete').addEventListener('click', () => {
            deleteScheduleItem(item.id, div);
        });

        scheduleTimeline.appendChild(div);
    });
}

function deleteScheduleItem(id, element) {
    element.classList.add('fade-out');
    setTimeout(() => {
        dailySchedule = dailySchedule.filter(i => i.id !== id);
        localStorage.setItem('orbit_schedule', JSON.stringify(dailySchedule));
        renderSchedule();
    }, 300);
}

if (scheduleForm) {
    scheduleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = scheduleStart.value;
        const end = scheduleEnd.value;
        const activity = scheduleActivity.value.trim();
        const category = scheduleCategory.value;

        if (!start || !end || !activity) return;

        const newItem = {
            id: Date.now().toString(),
            start,
            end,
            activity,
            category
        };

        dailySchedule.push(newItem);
        // Sort chronologically
        dailySchedule.sort((a, b) => a.start.localeCompare(b.start));
        
        localStorage.setItem('orbit_schedule', JSON.stringify(dailySchedule));
        renderSchedule();

        scheduleActivity.value = '';
    });

    clearScheduleBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire schedule?')) {
            dailySchedule = [];
            localStorage.setItem('orbit_schedule', JSON.stringify(dailySchedule));
            renderSchedule();
        }
    });
}

// Start app
renderSchedule();
renderQuickLinks();
init();
