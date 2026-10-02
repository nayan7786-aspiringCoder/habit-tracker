// 1. Select HTML elements
const habitInput = document.getElementById("habit-input");
const habitCategory = document.getElementById("habit-category");
const customCategoryInput = document.getElementById("custom-category-input");
const habitDays = document.getElementById("habit-days");
const startDateOption = document.getElementById("start-date-option");
const customDateInput = document.getElementById("custom-date-input");
const addBtn = document.getElementById("add-btn");
const habitList = document.getElementById("habit-list");
const progressText = document.getElementById("progress-text");
const progressBarFill = document.getElementById("progress-bar-fill");
const todayDateElement = document.getElementById("today-date");

// 2. Load saved habits from LocalStorage
let habits = JSON.parse(localStorage.getItem("myHabits")) || [];

// 3. Set default date on the date picker to today
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
customDateInput.value = `${yyyy}-${mm}-${dd}`;

// 4. Toggle date picker visibility based on user selection
startDateOption.addEventListener("change", () => {
  if (startDateOption.value === "custom") {
    customDateInput.style.display = "block";
  } else {
    customDateInput.style.display = "none";
  }
});

// 5. Handle Custom Category: Show input when "➕ Add Category" is selected
habitCategory.addEventListener("change", () => {
  if (habitCategory.value === "__NEW__") {
    customCategoryInput.style.display = "block";
    customCategoryInput.focus();
  } else {
    customCategoryInput.style.display = "none";
  }
});

// 6. Display today's date at the top
function displayCurrentDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  todayDateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// 7. Save habits list to browser's LocalStorage
function saveHabits() {
  localStorage.setItem("myHabits", JSON.stringify(habits));
}

// Helper: Check if two dates represent the exact same calendar day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 8. Add a new habit
function addHabit() {
  const habitText = habitInput.value.trim();
  const selectedDays = parseInt(habitDays.value, 10);

  if (habitText === "") {
    alert("Please enter a habit name!");
    habitInput.focus();
    return;
  }

  if (isNaN(selectedDays) || selectedDays < 1) {
    alert("Please enter a valid number of days (at least 1)!");
    habitDays.focus();
    return;
  }

  // Handle Category (Check if user entered a custom category)
  let chosenCategory = habitCategory.value;
  if (chosenCategory === "__NEW__") {
    const customText = customCategoryInput.value.trim();
    if (customText === "") {
      alert("Please enter your custom category name!");
      customCategoryInput.focus();
      return;
    }
    chosenCategory = customText;

    // Add new custom category into dropdown so it can be re-used!
    const newOption = document.createElement("option");
    newOption.value = customText;
    newOption.textContent = customText;
    habitCategory.insertBefore(newOption, habitCategory.lastElementChild);
    habitCategory.value = customText;
    customCategoryInput.value = "";
    customCategoryInput.style.display = "none";
  }

  // Determine starting date: Today or Custom Date
  let startDate = new Date();
  if (startDateOption.value === "custom" && customDateInput.value) {
    const parts = customDateInput.value.split("-");
    startDate = new Date(parts[0], parts[1] - 1, parts[2]);
  }

  // Generate checkpoints starting from the selected start date
  const checkpoints = [];
  for (let i = 0; i < selectedDays; i++) {
    const checkpointDate = new Date(startDate);
    checkpointDate.setDate(startDate.getDate() + i);

    checkpoints.push({
      dayNumber: i + 1,
      dayName: checkpointDate.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: checkpointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: checkpointDate.toISOString(),
      completed: false
    });
  }

  const newHabit = {
    id: Date.now(),
    name: habitText,
    category: chosenCategory,
    totalDays: selectedDays,
    checkpoints: checkpoints
  };

  habits.push(newHabit);
  habitInput.value = "";
  saveHabits();
  renderHabits();
}

// 9. Delete a habit
function deleteHabit(habitId) {
  habits = habits.filter(habit => habit.id !== habitId);
  saveHabits();
  renderHabits();
}

// 10. Toggle a checkpoint checkbox
function toggleCheckpoint(habitId, dayIndex) {
  const habit = habits.find(h => h.id === habitId);
  if (habit && habit.checkpoints && habit.checkpoints[dayIndex]) {
    habit.checkpoints[dayIndex].completed = !habit.checkpoints[dayIndex].completed;
    saveHabits();
    renderHabits();
  }
}

// 11. Update the Progress Bar
function updateProgress() {
  if (habits.length === 0) {
    progressText.textContent = "0 / 0 completed";
    progressBarFill.style.width = "0%";
    return;
  }

  const currentToday = new Date();
  let totalHabitsToday = 0;
  let completedHabitsToday = 0;

  habits.forEach(habit => {
    const todayCheckpoint = habit.checkpoints.find(cp => {
      const cpDate = new Date(cp.fullDate);
      return isSameDay(cpDate, currentToday);
    });

    if (todayCheckpoint) {
      totalHabitsToday++;
      if (todayCheckpoint.completed) {
        completedHabitsToday++;
      }
    }
  });

  if (totalHabitsToday === 0) {
    progressText.textContent = "No habits scheduled for today";
    progressBarFill.style.width = "0%";
    return;
  }

  progressText.textContent = `${completedHabitsToday} / ${totalHabitsToday} completed today`;
  const percentage = Math.round((completedHabitsToday / totalHabitsToday) * 100);
  progressBarFill.style.width = `${percentage}%`;
}

// 12. Render habits to the screen
function renderHabits() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    habitList.innerHTML = `<p style="text-align:center; color:#a0aec0; padding: 20px 0;">No habits yet. Add your first goal above!</p>`;
    updateProgress();
    return;
  }

  const currentToday = new Date();

  habits.forEach(habit => {
    const completedDaysCount = habit.checkpoints.filter(cp => cp.completed).length;
    const totalDays = habit.totalDays || habit.checkpoints.length;

    const card = document.createElement("div");
    card.className = "habit-card";

    let checkpointsHTML = "";
    habit.checkpoints.forEach((cp, index) => {
      const isChecked = cp.completed ? "checked" : "";
      const cpDate = new Date(cp.fullDate);
      const isToday = isSameDay(cpDate, currentToday) ? "is-today" : "";

      checkpointsHTML += `
        <div class="day-checkpoint ${isToday}">
          <span class="checkpoint-day-num">Day ${cp.dayNumber}</span>
          <span class="checkpoint-weekday">${cp.dayName}</span>
          <span class="checkpoint-date">${cp.dateStr}</span>
          <input type="checkbox" ${isChecked} onchange="toggleCheckpoint(${habit.id}, ${index})" />
        </div>
      `;
    });

    // MODE 1: 1–7 days   → horizontal scroll row
    // MODE 2: 8–28 days  → 7-per-row table, NO scroll (everything visible)
    // MODE 3: 29+ days   → 7-per-row table WITH vertical scroll
    let checkpointsClass = "checkpoints checkpoints-scroll";
    if (habit.checkpoints.length > 28) {
      checkpointsClass = "checkpoints checkpoints-grid-scroll";
    } else if (habit.checkpoints.length > 7) {
      checkpointsClass = "checkpoints checkpoints-grid";
    }

    card.innerHTML = `
      <div class="habit-header">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="habit-title">${habit.name}</span>
          <span class="category-tag">${habit.category || '💧 Health'}</span>
          <span class="streak-badge">🎯 ${completedDaysCount}/${totalDays} days</span>
        </div>
        <button class="delete-btn" onclick="deleteHabit(${habit.id})" title="Delete habit">✖</button>
      </div>
      <div class="${checkpointsClass}">
        ${checkpointsHTML}
      </div>
    `;

    habitList.appendChild(card);
  });

  updateProgress();
}

// 13. Event Listeners
addBtn.addEventListener("click", addHabit);
habitInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    addHabit();
  }
});

// Initialize on page load
displayCurrentDate();
renderHabits();