// -----------------------------
// Calendar Logic
// -----------------------------
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYearSpan = document.getElementById('currentMonthYear');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentDate = new Date();
let selectedDate = null; // Store clicked date

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayIndex = firstDayOfMonth.getDay();
    currentMonthYearSpan.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateElement = document.createElement('div');
        dateElement.classList.add('calendar-date');
        dateElement.textContent = i;

        const today = new Date();
        const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());

        if (isToday) {
            dateElement.classList.add('current-date'); // highlight current day
        }

        // highlight selected date in red
        if (selectedDate &&
            selectedDate.day === i &&
            selectedDate.month === month + 1 &&
            selectedDate.year === year) {
            dateElement.style.backgroundColor = 'red';
            dateElement.style.color = 'white';
            dateElement.style.fontWeight = 'bold';
        }

        calendarGrid.appendChild(dateElement);
    }
}

// Prev/Next month buttons
prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();

// -----------------------------
// Sidebar Logic
// -----------------------------
const sidebar = document.querySelector('.sidebar');
const sidebarContent = document.querySelector('.sidebar-content');
const calendarContainer = document.querySelector('.calendar-container');

function activateSticky() {
    sidebar.classList.add('sticky');
}

function deactivateSticky() {
    sidebar.classList.remove('sticky');
}

sidebar.addEventListener('click', (event) => {
    event.stopPropagation();
    activateSticky();
});

calendarContainer.addEventListener('click', (event) => {
     event.stopPropagation();
     activateSticky();
});

document.addEventListener('click', (event) => {
    if (sidebar.classList.contains('sticky')) {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickInsideCalendar = calendarContainer.contains(event.target);

        if (!isClickInsideSidebar && !isClickInsideCalendar) {
            deactivateSticky();
        }
    }
});

// -----------------------------
// Calendar Date Click -> Sidebar Note
// -----------------------------
calendarGrid.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('calendar-date')) return;

    const selectedDay = parseInt(e.target.textContent);
    const selectedMonth = currentDate.getMonth() + 1;
    const selectedYear = currentDate.getFullYear();

    selectedDate = { day: selectedDay, month: selectedMonth, year: selectedYear }; // store selected date
    renderCalendar(); // refresh calendar to highlight selected date

    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;

    // Fetch existing note
    const response = await fetch(`/get_calendar_note/${dateStr}/`);
    const data = await response.json();
    const existingNote = data.details || '';

    // Show editable textarea in sidebar
    sidebarContent.innerHTML = `
        <h3>Note for ${dateStr}</h3>
        <textarea id="calendarNoteTextarea" rows="6" style="width: 100%; margin-bottom: 10px;">${existingNote}</textarea>
        <div style="text-align: right;">
            <button id="saveNoteBtn">Save</button>
        </div>
    `;

    activateSticky();

    // Save note
    document.getElementById('saveNoteBtn').onclick = async () => {
        const noteText = document.getElementById('calendarNoteTextarea').value;

        const saveResp = await fetch('/save_calendar_note/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ date: dateStr, details: noteText })
        });

        const saveData = await saveResp.json();
        if (saveData.success) {
            alert('Note saved!');
        } else {
            alert('Error saving note.');
        }
    };
});

// -----------------------------
// CSRF Helper
// -----------------------------
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        try {
            const response = await fetch('/today_note/');
            const data = await response.json();
            alert(data.note); // simple popup
        } catch (error) {
            console.error('Error fetching today note:', error);
        }
    }, 10000); // 10 seconds
});
