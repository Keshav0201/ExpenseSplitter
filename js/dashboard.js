import { api } from "./api.js";

// =========================
// DOM Elements
// =========================
let currentUser = null;

const welcomeName = document.getElementById("welcome-name");
const userName = document.getElementById("user-name");
const upiIdText = document.getElementById("add-upi-request");
const userPhoto = document.getElementById("user-photo");

const totalOwe = document.getElementById("total-owe");
const totalOwed = document.getElementById("total-owed");

const groupsContainer = document.getElementById("groups-container");

const logoutButton = document.getElementById("logout-btn");

const createGroupButton = document.getElementById("create-group-btn");
const createGroupModal = document.getElementById("create-group-modal");
const createGroupForm = document.getElementById("create-group-form");
const cancelGroupButton = document.getElementById("cancel-group-btn");
const closeGroupButton = document.getElementById("close-group-btn");
const groupNameInput = document.getElementById("group-name");
const groupError = document.getElementById("group-error");
const submitGroupButton = document.getElementById("submit-group-btn");

// =========================
// Spending Chart
// =========================

let spendingChart = null;
let userExpenses = [];

async function loadCurrentUser() {
  if (currentUser) {
    return currentUser;
  }

  // Try localStorage first
  const cachedUser = localStorage.getItem("currentUser");

  if (cachedUser) {
    try {
      currentUser = JSON.parse(cachedUser);
      return currentUser;
    } catch (error) {
      console.error("[USER CACHE] INVALID");
      localStorage.removeItem("currentUser");
    }
  }

  const response = await api.get("/users/me");
  const user = response.data;

  if (!user) {
    throw new Error("User information not returned by API");
  }

  currentUser = user;

  // Store only what we need
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      name: user.name,
      email: user.email,
      username: user.username,
      upiId: user.upiId || user.upi_id || null,
    })
  );

  return currentUser;
}

async function loadUserExpenses(fromDate) {
  const cacheKey = `userExpenses_${fromDate}`;
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check localStorage
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const cached = JSON.parse(cachedData);
      const cacheAge = Date.now() - cached.cachedAt;

      if (cacheAge < CACHE_DURATION) {

        userExpenses = cached.data;

        renderSpendingChart();

        return;
      }

      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error("Invalid expense cache:", error);
      localStorage.removeItem(cacheKey);
    }
  }

  try {
    const response = await api.get(`/users/me/expenses?fromDate=${fromDate}`);

    userExpenses = response.data || [];
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: userExpenses,
        cachedAt: Date.now(),
      })
    );

    renderSpendingChart();
  } catch (error) {
    console.error("Failed to load user expenses:", error);

    userExpenses = [];

    renderSpendingChart();
  }
}

function clearExpenseCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("userExpenses_")) {
      localStorage.removeItem(key);
    }
  });

}

// =========================
// Date Helpers
// =========================

function getFromDate(range) {
  const today = new Date();

  // Last 7 days
  if (range === "7") {
    const date = new Date(today);

    date.setDate(today.getDate() - 6);

    return formatDate(date);
  }

  // This month
  if (range === "month") {
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  // Last 6 months
  if (range === "6months") {
    const date = new Date(today);

    date.setMonth(today.getMonth() - 5);
    date.setDate(1);

    return formatDate(date);
  }

  // This year
  if (range === "year") {
    return formatDate(new Date(today.getFullYear(), 0, 1));
  }

  // Default
  return formatDate(today);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================
// Render Spending Chart
// =========================

function renderSpendingChart() {
  const rangeElement = document.getElementById("spending-range");

  if (!rangeElement) {
    return;
  }

  const range = rangeElement.value;

  const groupedExpenses = {};

  userExpenses.forEach((expense) => {
    const date = expense.date;

    if (!groupedExpenses[date]) {
      groupedExpenses[date] = 0;
    }

    groupedExpenses[date] += expense.amountPaise;
  });

  const dates = Object.keys(groupedExpenses).sort();

  const labels = dates.map((date) => {
    const d = new Date(`${date}T00:00:00`);

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  });

  const amounts = dates.map((date) => groupedExpenses[date] / 100);

  // Total spending
  const totalPaise = userExpenses.reduce(
    (sum, expense) => sum + expense.amountPaise,
    0
  );

  document.getElementById("spending-total").textContent = `₹${(
    totalPaise / 100
  ).toLocaleString("en-IN")}`;

  // Chart
  const canvas = document.getElementById("spending-chart");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (spendingChart) {
    spendingChart.destroy();
  }

  spendingChart = new Chart(ctx, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Spending",
          data: amounts,
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              return ` ₹${context.parsed.y.toLocaleString("en-IN")}`;
            },
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: function (value) {
              return `₹${value}`;
            },
          },
        },

        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// =========================
// Spending Range
// =========================

document
  .getElementById("spending-range")
  .addEventListener("change", async (event) => {
    const range = event.target.value;

    const fromDate = getFromDate(range);

    await loadUserExpenses(fromDate);
  });

// =========================
// Authentication - CLERK
// =========================

async function initializeDashboard() {
  try {
    const range = document.getElementById("spending-range").value;
    const fromDate = getFromDate(range);

    await Promise.all([
      loadCurrentUser(),
      loadUserExpenses(fromDate),
      loadDashboard(),
    ]);

    await renderUser();
  } catch (error) {
    console.error("Failed to load dashboard:", error);

    if (
      error.message === "User is not authenticated" ||
      error.message === "Authentication required"
    ) {
      window.location.href = "../index.html";
      return;
    }

    groupsContainer.innerHTML = `
      <div class="error-state">
        Unable to load your dashboard.
        Please try again.
      </div>
    `;
  }
}

// =========================
// User Information
// =========================

async function renderUser() {
  const user = await loadCurrentUser();

  const name = user.name || "User";

  welcomeName.textContent = name;
  userName.textContent = name;

  const upiId = user.upiId || user.upi_id;
  const username = user.username;

  if (!upiId && !username) {
    upiIdText.textContent = "Add your UPI ID and Username";
    upiIdText.style.display = "";
  } else if (!upiId) {
    upiIdText.textContent = "Add your UPI ID";
    upiIdText.style.display = "";
  } else if (!username) {
    upiIdText.textContent = "Add your username";
    upiIdText.style.display = "";
  } else {
    upiIdText.style.display = "none";
  }

  if (window.Clerk?.user?.imageUrl) {
    userPhoto.src = Clerk.user.imageUrl;
  } else if (user.photoURL || user.photo_url) {
    userPhoto.src = user.photoURL || user.photo_url;
  } else {
    userPhoto.style.display = "none";
  }
}
// =========================
// Dashboard Data
// =========================

async function loadDashboard() {
  await Promise.all([loadGroups(), loadBalances()]);
}

// =========================
// Groups Cache
// =========================

const GROUPS_CACHE_KEY = "dashboard_groups";
const GROUPS_CACHE_TTL = 5 * 60 * 1000; // 1 minute

function getCachedGroups() {
  try {
    const cached = localStorage.getItem(GROUPS_CACHE_KEY);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    if (!parsed.data || !parsed.timestamp) {
      localStorage.removeItem(GROUPS_CACHE_KEY);
      return null;
    }

    if (Date.now() - parsed.timestamp > GROUPS_CACHE_TTL) {
      localStorage.removeItem(GROUPS_CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("[GROUPS CACHE] READ ERROR:", error);
    return null;
  }
}

function setGroupsCache(groups) {
  try {
    localStorage.setItem(
      GROUPS_CACHE_KEY,
      JSON.stringify({
        data: groups,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("[GROUPS CACHE] SAVE ERROR:", error);
  }
}

function clearGroupsCache() {
  localStorage.removeItem(GROUPS_CACHE_KEY);
}

// =========================
// Groups
// =========================

async function loadGroups({ useCache = true } = {}) {
  if (useCache) {
    const cachedGroups = getCachedGroups();

    if (cachedGroups) {
      renderGroups(cachedGroups);

      api
        .get("/groups")
        .then((response) => {
          const freshGroups = response.data || [];

          setGroupsCache(freshGroups);
          renderGroups(freshGroups);
        })
        .catch((error) => {
          console.error("[GROUPS] Background refresh failed:", error);
        });

      return;
    }
  }

  groupsContainer.innerHTML = `
    <div class="loading-state">
      Loading groups...
    </div>
  `;

  try {

    const response = await api.get("/groups");

    const groups = response.data || [];

    setGroupsCache(groups);
    renderGroups(groups);

  } catch (error) {
    console.error("Failed to load groups:", error);

    groupsContainer.innerHTML = `
      <div class="error-state">
        Unable to load your groups.
        Please try again.
      </div>
    `;
  }
}
// =========================
// Render Groups
// =========================

function renderGroups(groups) {
  if (groups.length === 0) {
    groupsContainer.innerHTML = `
      <div class="empty-state">

        <p>
          You haven't joined any groups yet.
        </p>

        <button
          class="primary-btn"
          id="empty-create-group-btn"
        >
          Create your first group
        </button>

      </div>
    `;

    document
      .getElementById("empty-create-group-btn")
      .addEventListener("click", openCreateGroupModal);

    return;
  }

  groupsContainer.innerHTML = "";

  groups.forEach((group) => {
    const card = document.createElement("div");

    card.className = "group-card";

    const title = document.createElement("h3");

    title.textContent = group.name || "Unnamed Group";

    const description = document.createElement("p");

    description.textContent = "View group details";

    card.appendChild(title);
    card.appendChild(description);

    card.addEventListener("click", () => {
      window.location.href = `./group.html?id=${group.id}`;
    });

    groupsContainer.appendChild(card);
  });
}

// =========================
// Balances
// =========================

async function loadBalances() {
  let owePaise = 0;
  let owedPaise = 0;

  try {
    const balances = await api.get("/groups/my-balances");

    balances.forEach((balance) => {
      const amount = Number(balance.balancePaise) || 0;

      if (amount < 0) {
        owePaise += Math.abs(amount);
      } else if (amount > 0) {
        owedPaise += amount;
      }
    });

    totalOwe.textContent = formatCurrency(owePaise);
    totalOwed.textContent = formatCurrency(owedPaise);
  } catch (error) {
    console.error("Failed to load balances:", error);

    totalOwe.textContent = "—";
    totalOwed.textContent = "—";
  }
}
// =========================
// Create Group Modal
// =========================

function openCreateGroupModal() {
  createGroupModal.classList.remove("hidden");

  groupError.textContent = "";

  groupNameInput.value = "";

  groupNameInput.focus();
}

function closeCreateGroupModal() {
  createGroupModal.classList.add("hidden");

  createGroupForm.reset();

  groupError.textContent = "";
}

createGroupButton.addEventListener("click", openCreateGroupModal);

cancelGroupButton.addEventListener("click", closeCreateGroupModal);

closeGroupButton.addEventListener("click", closeCreateGroupModal);

// =========================
// Create Group
// =========================

createGroupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = groupNameInput.value.trim();

  if (!name) {
    groupError.textContent = "Please enter a group name.";
    return;
  }

  try {
    submitGroupButton.disabled = true;
    submitGroupButton.textContent = "Creating...";

    await api.post("/groups", {
      name: name,
    });

    clearGroupsCache();

    closeCreateGroupModal();

    await loadGroups({ useCache: false });
  } catch (error) {
    console.error("Create group failed:", error);

    groupError.textContent = error.message || "Unable to create group.";
  } finally {
    submitGroupButton.disabled = false;
    submitGroupButton.textContent = "Create Group";
  }
});

// =========================
// Logout - CLERK
// =========================

logoutButton.addEventListener("click", async () => {
  try {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    if (window.Clerk) {
      clearExpenseCache();
      await Clerk.signOut();
    }
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
  } catch (error) {
    console.error("Logout failed:", error);

    logoutButton.disabled = false;
    logoutButton.textContent = "Logout";
  }
});

// =========================
// Currency
// =========================

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

// =========================
// Start Dashboard
// =========================

initializeDashboard();
