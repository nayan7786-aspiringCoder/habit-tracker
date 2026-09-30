// 1. Select HTML elements we need to work with
const habitInput = document.getElementById("habit-input");
const habitCategory = document.getElementById("habit-category");
const addBtn = document.getElementById("add-btn");
const habitList = document.getElementById("habit-list");
const progressText = document.getElementById("progress-text");
const progressBarFill = document.getElementById("progress-bar-fill");
const todayDateElement = document.getElementById("today-date");

// Days of the week for our checkpoints
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 2. Load saved habits from LocalStorage (or start with an empty list if none exist)
let habits = JSON.parse(localStorage.getItem("myHabits")) || [];

// 3. Display today's date at the top
function displayCurrentDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const today = new Date();
  todayDateElement.textContent = today.toLocaleDateString('en-US', options);
}

// 4. Save habits list to browser's LocalStorage
function saveHabits() {
  localStorage.setItem("myHabits", JSON.stringify(habits));
}

// 5. Add a new habit
function addHabit() {
  const habitText = habitInput.value.trim();

  // Don't add if the input is empty
  if (habitText === "") {
    alert("Please enter a habit name!");
    return;
  }

  // Create a new habit object with category and 7 checkpoints (all initially false)
  const newHabit = {
    id: Date.now(), // unique ID based on timestamp
    name: habitText,
    category: habitCategory.value, // Selected category tag
    checkpoints: [false, false, false, false, false, false, false]
  };

  // Add to our list, clear input box, save and re-draw the UI
  habits.push(newHabit);
  habitInput.value = "";
  saveHabits();
  renderHabits();
}

// 6. Delete a habit
function deleteHabit(habitId) {
  habits = habits.filter(habit => habit.id !== habitId);
  saveHabits();
  renderHabits();
}

// 7. Toggle a checkpoint checkbox
function toggleCheckpoint(habitId, dayIndex) {
  const habit = habits.find(h => h.id === habitId);
  if (habit) {
    habit.checkpoints[dayIndex] = !habit.checkpoints[dayIndex];
    saveHabits();
    renderHabits();
  }
}

// 8. Update the Progress Bar and completion count
function updateProgress() {
  if (habits.length === 0) {
    progressText.textContent = "0 / 0 completed";
    progressBarFill.style.width = "0%";
    return;
  }

  // Find what day today is (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // We align it to our Mon-Sun array (Mon=0, Tue=1, ..., Sun=6)
  const todayIndex = (new Date().getDay() + 6) % 7;

  // Count how many habits have today's checkpoint checked
  const completedToday = habits.filter(habit => habit.checkpoints[todayIndex]).length;
  const total = habits.length;

  progressText.textContent = `${completedToday} / ${total} completed today`;

  // Calculate percentage
  const percentage = Math.round((completedToday / total) * 100);
  progressBarFill.style.width = `${percentage}%`;
}

// 9. Render habits to the screen
function renderHabits() {
  habitList.innerHTML = "";

  // If no habits exist, show a friendly empty message
  if (habits.length === 0) {
    habitList.innerHTML = `<p style="text-align:center; color:#a0aec0; padding: 20px 0;">No habits yet. Add your first habit above to get started!</p>`;
    updateProgress();
    return;
  }

  // Draw each habit card
  habits.forEach(habit => {
    // Count how many checkpoints are completed for this habit
    const completedDaysCount = habit.checkpoints.filter(Boolean).length;

    const card = document.createElement("div");
    card.className = "habit-card";

    // Build the 7 day checkpoints HTML
    let checkpointsHTML = "";
    DAYS.forEach((day, index) => {
      const isChecked = habit.checkpoints[index] ? "checked" : "";
      checkpointsHTML += `
        <div class="day-checkpoint">
          <span>${day}</span>
          <input type="checkbox" ${isChecked} onchange="toggleCheckpoint(${habit.id}, ${index})" />
        </div>
      `;
    });

    // Card structure
    card.innerHTML = `
      <div class="habit-header">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="habit-title">${habit.name}</span>
          <span class="category-tag">${habit.category || '💧 Health'}</span>
          <span class="streak-badge">🔥 ${completedDaysCount}/7 days</span>
        </div>
        <button class="delete-btn" onclick="deleteHabit(${habit.id})" title="Delete habit">✖</button>
      </div>
      <div class="checkpoints">
        ${checkpointsHTML}
      </div>
    `;

    habitList.appendChild(card);
  });

  updateProgress();
}

// 10. Event Listeners
addBtn.addEventListener("click", addHabit);

// Allow pressing 'Enter' key inside the input box to add habit
habitInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    addHabit();
  }
});

// Initialize on page load
displayCurrentDate();
renderHabits();
