import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";

// ================================
// Get group ID from URL
// ================================

const bar = document.getElementById("bar");
bar.style.width = "0%";
const loadingBar = document.getElementById("progress-bar-container");
function setProgress(percent) {
  bar.style.width = `${percent}%`;
}
const params = new URLSearchParams(window.location.search);

const groupId = params.get("id");

// ================================
// DOM elements
// ================================

const groupName = document.getElementById("group-name");

const groupDescription = document.getElementById("group-description");

const myBalance = document.getElementById("my-balance");

const membersContainer = document.getElementById("members-container");

const expensesContainer = document.getElementById("expenses-container");

const settlementsContainer = document.getElementById("settlements-container");

const logoutButton = document.getElementById("logout-btn");

// Add member
const addMemberButton = document.getElementById("add-member-btn");
const addMemberModal = document.getElementById("add-member-modal");
const addMemberForm = document.getElementById("add-member-form");
const memberEmail = document.getElementById("member-email");
const memberError = document.getElementById("member-error");
const submitMemberButton = document.getElementById("submit-member-btn");
const cancelMemberButton = document.getElementById("cancel-member-btn");
const closeMemberButton = document.getElementById("close-member-btn");

// Expense
const addExpenseButton = document.getElementById("add-expense-btn");
const expenseModal = document.getElementById("expense-modal");
const expenseForm = document.getElementById("expense-form");
const expenseDescription = document.getElementById("expense-description");
const expenseAmount = document.getElementById("expense-amount");
const expensePaidBy = document.getElementById("expense-paid-by");
const expenseSplitType = document.getElementById("expense-split-type");
const participantsList = document.getElementById("participants-list");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");
const expenseError = document.getElementById("expense-error");
const submitExpenseButton = document.getElementById("submit-expense-btn");
const cancelExpenseButton = document.getElementById("cancel-expense-btn");
const closeExpenseButton = document.getElementById("close-expense-btn");

// ================================
// State
// ================================

let currentUser = null;
let currentGroup = null;
let members = [];

// ================================
// Authentication
// ================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";

    return;
  }

  currentUser = user;

  if (!groupId) {
    showPageError("Invalid group.");

    return;
  }

  await loadGroupPage();
});

// ================================
// Load entire group page
// ================================

async function loadGroupPage() {
  loadingBar.style.display = "flex";
  setProgress(10);

  try {
    await loadGroup();
    setProgress(30);

    await loadMembers();
    setProgress(50);

    if (currentGroup.type === "personal") {
      groupDescription.textContent = "Your personal expenses";

      document
        .querySelector(".group-balance-section")
        ?.classList.add("hidden");

      document
        .querySelector(".settlements-section")
        ?.classList.add("hidden");

      addMemberButton?.classList.add("hidden");

      await loadExpenses();
      setProgress(90);
    } else {
      groupDescription.textContent =
        "Group expenses and settlements";

      await Promise.all([
        loadExpenses(),
        loadBalance(),
        loadSettlements(),
      ]);

      setProgress(90);
    }

    // Everything is loaded
    setProgress(100);

    // Give the browser time to render 100%
    setTimeout(() => {
      loadingBar.style.display = "none";
    }, 300);

  } catch (error) {
    console.error("Failed to load group:", error);

    loadingBar.style.display = "none";
  }
}

// ================================
// Group
// ================================

async function loadGroup() {
  const response = await api.get(`/groups/${groupId}`);

  currentGroup = response.data;

  groupName.textContent = currentGroup.name || "Unnamed Group";

  groupDescription.textContent = "Group expenses and settlements";
}

// ================================
// Members
// ================================

async function loadMembers() {
  try {
    const memberIds = Object.keys(currentGroup.members);

    const memberProfiles = await Promise.all(
      memberIds.map(async (uid) => {
        const response = await api.get(`/users/${uid}`);
        return response.data;
      })
    );

    members = memberProfiles;

    renderMembers();
    populatePaidBy();
    renderParticipants();
  } catch (error) {
    console.error("Failed to load members:", error);
    showToast("Failed to load group members");
  }
}

function renderMembers() {
  if (members.length === 0) {
    membersContainer.innerHTML = `
            <div class="empty-state">
                No members found.
            </div>
        `;

    return;
  }

  membersContainer.innerHTML = "";

  members.forEach((member) => {
    const card = document.createElement("div");

    card.className = "member-card";

    const image = document.createElement("img");

    image.className = "member-photo";

    image.src = member.photoURL || "https://ui-avatars.com/api/?name=User";

    image.alt = member.name;

    const info = document.createElement("div");

    info.className = "member-info";

    const name = document.createElement("h3");

    name.textContent =
      member.uid === currentUser.uid ? `${member.name} (You)` : member.name;

    const email = document.createElement("p");

    email.textContent = member.email || "Member";

    info.appendChild(name);

    info.appendChild(email);

    card.appendChild(image);

    card.appendChild(info);

    membersContainer.appendChild(card);
  });
}

// ================================
// Balance
// ================================

async function loadBalance() {
  myBalance.textContent = "Loading...";

  try {
    const balance = currentGroup.balances?.[currentUser.uid];

    if (!balance) {
      myBalance.textContent = "No balance information.";
      return;
    }

    const amount = balance.balancePaise || 0;

    if (amount > 0) {
      myBalance.textContent = `You are owed ${formatCurrency(amount)}`;
    } else if (amount < 0) {
      myBalance.textContent = `You owe ${formatCurrency(Math.abs(amount))}`;
    } else {
      myBalance.textContent = "You are all settled up ✓";
    }
  } catch (error) {
    console.error("Failed to load balance:", error);

    myBalance.textContent = "Unable to load balance.";
  }
}

// ================================
// Expenses
// ================================

async function loadExpenses() {
  try {
    const response = await api.get(`/groups/${groupId}/expenses`);
    const expenses = response.data || [];

    renderExpenses(expenses);
  } catch (error) {
    console.error("Failed to load expenses:", error);
    showToast("Failed to load expenses");
  }
}

function renderExpenses(expenses) {
  if (expenses.length === 0) {
    expensesContainer.innerHTML = `
            <div class="empty-state">
                No expenses yet.
            </div>
        `;

    return;
  }

  expensesContainer.innerHTML = "";

  expenses.forEach((expense) => {
    const card = document.createElement("div");

    card.className = "expense-card";

    const info = document.createElement("div");

    info.className = "expense-info";

    const title = document.createElement("h3");

    title.textContent = expense.description;

    const details = document.createElement("p");

    details.textContent = `${expense.category || "Other"} • ${
      expense.expenseDate || ""
    }`;

    info.appendChild(title);

    info.appendChild(details);

    const amount = document.createElement("span");

    amount.className = "expense-amount";

    amount.textContent = formatCurrency(expense.amountPaise);

    card.appendChild(info);

    card.appendChild(amount);

    expensesContainer.appendChild(card);
  });
}

// ================================
// Settlements
// ================================

async function loadSettlements() {
  settlementsContainer.innerHTML = `
        <div class="loading-state">
            Loading settlements...
        </div>
    `;

  try {
    const response = await api.get(`/groups/${groupId}/settlements`);

    const settlements = response.data || [];

    renderSettlements(settlements);
  } catch (error) {
    console.error("Failed to load settlements:", error);

    settlementsContainer.innerHTML = `
            <div class="error-state">
                Unable to load settlements.
            </div>
        `;
  }
}

function renderSettlements(settlements) {
  if (settlements.length === 0) {
    settlementsContainer.innerHTML = `
            <div class="empty-state">
                Everyone is settled up.
            </div>
        `;

    return;
  }

  settlementsContainer.innerHTML = "";

  settlements.forEach((settlement) => {
    const card = document.createElement("div");

    card.className = "settlement-card";

    const info = document.createElement("div");

    info.className = "settlement-info";

    const from = getMemberName(settlement.from);

    const to = getMemberName(settlement.to);

    info.textContent = `${from} → ${to}`;

    const amount = document.createElement("span");

    amount.className = "settlement-amount";

    amount.textContent = formatCurrency(settlement.amountPaise);

    card.appendChild(info);

    card.appendChild(amount);

    if (settlement.from === auth.currentUser.uid) {
      const button = document.createElement("button");

      button.className = "settlement-button";
      button.textContent = "Mark as Paid";

      button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = "Marking as Paid...";

        try {
          const response = await api.post(`/groups/${groupId}/settlements`, {
            from: settlement.from,
            to: settlement.to,
            amountPaise: settlement.amountPaise,
          });

          settlement = response.data;

          await api.patch(
            `/groups/${groupId}/settlements/${settlement.id}/complete`,
            {
              from: settlement.from,
              to: settlement.to,
              amountPaise: settlement.amountPaise,
            }
          );

          await loadGroup();
          await Promise.all([loadBalance(), loadSettlements()]);
        } catch (error) {
          console.error("Settlement failed:", error);
          showToast("Failed to settle.");
        } finally {
          button.disabled = false;
          button.textContent = "Mark as Paid";
        }
      });

      card.appendChild(button);
    }
    settlementsContainer.appendChild(card);
  });
}


// ================================
// Add Member
// ================================

addMemberButton.addEventListener("click", openMemberModal);

cancelMemberButton.addEventListener("click", closeMemberModal);

closeMemberButton.addEventListener("click", closeMemberModal);

function openMemberModal() {
  memberError.textContent = "";

  memberEmail.value = "";

  addMemberModal.classList.remove("hidden");

  memberEmail.focus();
}

function closeMemberModal() {
  addMemberModal.classList.add("hidden");

  addMemberForm.reset();

  memberError.textContent = "";
}

addMemberForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = memberEmail.value.trim();

  if (!email) {
    memberError.textContent = "Enter an email address.";

    return;
  }

  try {
    submitMemberButton.disabled = true;

    submitMemberButton.textContent = "Searching...";

    const searchResponse = await api.get(
      `/users/search?email=${encodeURIComponent(email)}`
    );

    const user = searchResponse.data;

    if (!user || !user.uid) {
      throw new Error("User not found.");
    }

    if (user.uid === currentUser.uid) {
      throw new Error("You are already in this group.");
    }

    submitMemberButton.textContent = "Adding...";

    await api.post(`/groups/${groupId}/members`, {
      userId: user.uid,
    });

    closeMemberModal();

    await loadGroup();

    await loadMembers();
  } catch (error) {
    console.error("Add member failed:", error);

    memberError.textContent = error.message || "Unable to add member.";
  } finally {
    submitMemberButton.disabled = false;

    submitMemberButton.textContent = "Add Member";
  }
});

// ================================
// Expense Modal
// ================================

addExpenseButton.addEventListener("click", openExpenseModal);

cancelExpenseButton.addEventListener("click", closeExpenseModal);

closeExpenseButton.addEventListener("click", closeExpenseModal);

function openExpenseModal() {
  expenseError.textContent = "";

  expenseForm.reset();

  /*
   * Default expense date to today.
   */

  expenseDate.value = new Date().toISOString().split("T")[0];

  populatePaidBy();

  renderParticipants();

  expenseModal.classList.remove("hidden");
}

function closeExpenseModal() {
  expenseModal.classList.add("hidden");

  expenseForm.reset();

  expenseError.textContent = "";
}

// ================================
// Paid By
// ================================

function populatePaidBy() {
  expensePaidBy.innerHTML = `
        <option value="">
            Select member
        </option>
    `;

  members.forEach((member) => {
    const option = document.createElement("option");

    option.value = member.uid;

    option.textContent =
      member.uid === currentUser.uid ? `${member.name} (You)` : member.name;

    expensePaidBy.appendChild(option);
  });

  expensePaidBy.value = currentUser.uid;
}

// ================================
// Participants
// ================================

function renderParticipants() {
  participantsList.innerHTML = "";

  members.forEach((member) => {
    const row = document.createElement("div");

    row.className = "participant-row";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.className = "participant-checkbox";

    checkbox.value = member.uid;

    checkbox.checked = true;

    const name = document.createElement("span");

    name.textContent =
      member.uid === currentUser.uid ? `${member.name} (You)` : member.name;

    row.appendChild(checkbox);

    row.appendChild(name);

    participantsList.appendChild(row);
  });
}

// ================================
// Split type changes
// ================================

expenseSplitType.addEventListener("change", () => {
  updateParticipantInputs();
});

function updateParticipantInputs() {
  const type = expenseSplitType.value;

  const rows = document.querySelectorAll(".participant-row");

  rows.forEach((row) => {
    const existingInput = row.querySelector(".participant-value");

    if (existingInput) {
      existingInput.remove();
    }

    if (type === "exact") {
      const input = document.createElement("input");

      input.type = "number";

      input.min = "0";

      input.step = "0.01";

      input.placeholder = "₹ amount";

      input.className = "participant-value";

      row.appendChild(input);
    }

    if (type === "percentage") {
      const input = document.createElement("input");

      input.type = "number";

      input.min = "0";

      input.max = "100";

      input.step = "0.01";

      input.placeholder = "%";

      input.className = "participant-value";

      row.appendChild(input);
    }
  });
}

function showExpenseLoading() {
  let loader = document.getElementById("expense-loading");

  if (!loader) {
    loader = document.createElement("div");

    loader.id = "expense-loading";

    loader.innerHTML = `
      <div class="expense-loading-content">
        <div class="expense-loading-bar-container">
          <div id="expense-loading-bar"></div>
        </div>

        <div id="expense-loading-text">
          Adding expense... 0%
        </div>
      </div>
    `;

    expenseModal.appendChild(loader);
  }

  loader.style.display = "flex";

  setExpenseProgress(0, "Adding expense...");
}

function setExpenseProgress(percent, text) {
  const bar = document.getElementById("expense-loading-bar");
  const textElement = document.getElementById("expense-loading-text");

  if (bar) {
    bar.style.width = `${percent}%`;
  }

  if (textElement) {
    textElement.textContent = `${text} ${percent}%`;
  }
}

function hideExpenseLoading() {
  const loader = document.getElementById("expense-loading");

  if (loader) {
    loader.style.display = "none";
  }
}

// ================================
// Create Expense
// ================================

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  expenseError.textContent = "";

  try {
    submitExpenseButton.disabled = true;
    submitExpenseButton.textContent = "Adding...";

    const description = expenseDescription.value.trim();
    const amount = Number(expenseAmount.value);
    const paidBy = expensePaidBy.value;
    const splitType = expenseSplitType.value;
    const category = expenseCategory.value;
    const date = expenseDate.value;

    if (!description) {
      throw new Error("Enter an expense description.");
    }

    if (!amount || amount <= 0) {
      throw new Error("Enter a valid amount.");
    }

    if (!paidBy) {
      throw new Error("Select who paid.");
    }

    const selectedParticipants = Array.from(
      document.querySelectorAll(".participant-checkbox:checked")
    );

    if (selectedParticipants.length === 0) {
      throw new Error("Select at least one participant.");
    }

    const amountPaise = rupeesToPaise(amount);

    let participants;

    if (splitType === "equal") {
      participants = selectedParticipants.map(
        (checkbox) => checkbox.value
      );
    } else {
      participants = selectedParticipants.map((checkbox) => {
        const row = checkbox.closest(".participant-row");
        const input = row.querySelector(".participant-value");
        const value = Number(input.value);

        if (!value || value < 0) {
          throw new Error("Enter valid split values.");
        }

        if (splitType === "exact") {
          return {
            userId: checkbox.value,
            amountPaise: rupeesToPaise(value),
          };
        }

        return {
          userId: checkbox.value,
          percentage: value,
        };
      });
    }

    if (splitType === "exact") {
      const total = participants.reduce(
        (sum, participant) =>
          sum + participant.amountPaise,
        0
      );

      if (total !== amountPaise) {
        throw new Error(
          "Exact split amounts must equal the total."
        );
      }
    }

    if (splitType === "percentage") {
      const total = participants.reduce(
        (sum, participant) =>
          sum + participant.percentage,
        0
      );

      if (total !== 100) {
        throw new Error(
          "Percentages must add up to 100%."
        );
      }
    }

    // --------------------------------
    // Show loading
    // --------------------------------

    showExpenseLoading();

    setExpenseProgress(20, "Saving expense...");

    // --------------------------------
    // Create expense
    // --------------------------------

    await api.post(`/groups/${groupId}/expenses`, {
      description,
      amountPaise,
      paidBy,
      splitType,
      participants,
      category,
      expenseDate: date,
    });

    setExpenseProgress(40, "Updating group...");

    clearExpenseCache();

    // --------------------------------
    // Refresh group
    // --------------------------------

    await loadGroup();

    setExpenseProgress(55, "Updating members...");

    await loadMembers();

    setExpenseProgress(70, "Updating expenses...");

    await loadExpenses();

    setExpenseProgress(82, "Updating settlements...");

    await loadSettlements();

    setExpenseProgress(95, "Updating balance...");

    await loadBalance();

    // --------------------------------
    // Everything finished
    // --------------------------------

    setExpenseProgress(100, "Expense added!");

    setTimeout(() => {
      hideExpenseLoading();
      closeExpenseModal();
    }, 400);

  } catch (error) {
    console.error("Create expense failed:", error);

    hideExpenseLoading();

    expenseError.textContent =
      error.message || "Unable to create expense.";

  } finally {
    submitExpenseButton.disabled = false;
    submitExpenseButton.textContent = "Add Expense";
  }
});

function clearExpenseCache() {

    Object.keys(localStorage).forEach((key) => {

        if (key.startsWith("userExpenses_")) {
            localStorage.removeItem(key);
        }

    });

    console.log("Expense cache cleared");
}

// ================================
// Logout
// ================================

logoutButton.addEventListener("click", async () => {
  try {
    logoutButton.disabled = true;

    logoutButton.textContent = "Logging out...";

    await signOut(auth);

    window.location.href = "./login.html";
  } catch (error) {
    console.error("Logout failed:", error);

    logoutButton.disabled = false;

    logoutButton.textContent = "Logout";
  }
});

// ================================
// Helpers
// ================================

function getMemberName(uid) {
  if (uid === currentUser.uid) {
    return "You";
  }

  const member = members.find((item) => item.uid === uid);

  return member ? member.name : "Member";
}

function rupeesToPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((paise || 0) / 100);
}

function showPageError(message) {
  groupName.textContent = "Unable to load group";

  groupDescription.textContent = message;
}
