const STORAGE_KEY = "push-tracker-state";
const DEFAULT_GOAL = 10000;
const tg = window.Telegram?.WebApp;

const state = loadState();

const goalForm = document.getElementById("goal-form");
const goalInput = document.getElementById("goal-input");
const completedValue = document.getElementById("completed-value");
const goalValue = document.getElementById("goal-value");
const counterPercent = document.getElementById("counter-percent");
const progressFill = document.getElementById("progress-fill");
const actionButtons = document.querySelectorAll("[data-delta]");

goalInput.value = state.goal;
setupTelegram();
render();

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nextGoal = Number.parseInt(goalInput.value, 10);
  if (!Number.isFinite(nextGoal) || nextGoal < 1) {
    goalInput.value = state.goal;
    return;
  }

  state.goal = nextGoal;
  state.completed = Math.min(state.completed, state.goal);
  saveState();
  render();
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const delta = Number.parseInt(button.dataset.delta || "0", 10);
    const nextValue = state.completed + delta;

    state.completed = clamp(nextValue, 0, state.goal);
    saveState();
    render();
  });
});

function render() {
  const percent = state.goal > 0 ? Math.round((state.completed / state.goal) * 100) : 0;

  completedValue.textContent = formatNumber(state.completed);
  goalValue.textContent = formatNumber(state.goal);
  counterPercent.textContent = `${percent}%`;
  progressFill.style.width = `${Math.min(percent, 100)}%`;
}

function setupTelegram() {
  if (!tg) {
    return;
  }

  tg.ready();
  tg.expand();

  if (typeof tg.disableVerticalSwipes === "function") {
    tg.disableVerticalSwipes();
  }

  if (typeof tg.setHeaderColor === "function") {
    tg.setHeaderColor("#090b10");
  }

  if (typeof tg.setBackgroundColor === "function") {
    tg.setBackgroundColor("#090b10");
  }

  if (typeof tg.setBottomBarColor === "function") {
    tg.setBottomBarColor("#090b10");
  }

  if (typeof tg.requestFullscreen === "function" && !tg.isFullscreen) {
    tg.requestFullscreen();
  }
}

function loadState() {
  const fallback = {
    completed: 0,
    goal: DEFAULT_GOAL,
  };

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return fallback;
    }

    const parsed = JSON.parse(rawState);
    const goal = sanitizePositiveInteger(parsed.goal, DEFAULT_GOAL);
    const completed = clamp(sanitizePositiveInteger(parsed.completed, 0), 0, goal);

    return { completed, goal };
  } catch {
    return fallback;
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sanitizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}
