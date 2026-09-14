import { api } from "./api.js";

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

const viewExpenseModal = document.getElementById("view-expense-modal");
const closeViewExpenseButton = document.getElementById(
  "close-view-expense-btn"
);

const viewExpenseDescription = document.getElementById(
  "view-expense-description"
);
const viewExpenseAmount = document.getElementById("view-expense-amount");
const viewExpensePaidBy = document.getElementById("view-expense-paid-by");
const viewExpenseCategory = document.getElementById("view-expense-category");
const viewExpenseDate = document.getElementById("view-expense-date");
const viewExpenseSplitType = document.getElementById("view-expense-split-type");
const viewExpenseParticipants = document.getElementById(
  "view-expense-participants"
);

const deleteViewExpenseButton = document.getElementById(
  "delete-view-expense-btn"
);

// ================================
// State
// ================================

let currentUser = null;
let currentGroup = null;
let members = [];
let selectedExpenseId = null;

// ================================
// Authentication
// ================================

async function initializePage() {
  try {
    setProgress(10);

    if (!groupId) {
      showPageError("Invalid group.");
      return;
    }

    const response = await api.get("/users/me");

    currentUser = response.data;

    if (!currentUser) {
      throw new Error("User profile not found");
    }

    await loadGroupPage();
  } catch (error) {
    console.error("Failed to initialize group page:", error);

    if (
      error.message === "User is not authenticated" ||
      error.message === "Authentication required"
    ) {
      window.location.href = "./login.html";
      return;
    }

    showPageError(error.message || "Unable to load group.");
  }
}
// ================================
// Load entire group page
// ================================

async function loadGroupPage() {
  loadingBar.style.display = "flex";
  setProgress(10);

  try {
    await loadGroup();

    setProgress(30);

    if (currentGroup.type === "personal") {
      groupDescription.textContent = "Your personal expenses";

      document.querySelector(".group-balance-section")?.classList.add("hidden");

      document.querySelector(".members-section")?.classList.add("hidden");

      document.querySelector(".settlements-section")?.classList.add("hidden");

      addMemberButton?.classList.add("hidden");

      setProgress(50);

      await loadExpenses();
      await loadMembers();

      setProgress(90);
    } else {
      groupDescription.textContent = "Group expenses and settlements";

      await loadMembers();

      setProgress(50);

      await Promise.all([loadExpenses(), loadBalance(), loadSettlements()]);

      setProgress(90);
    }

    setProgress(100);

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

async function refreshSettlementUI() {
  try {
    await Promise.all([loadBalance(), loadSettlements()]);
  } catch (error) {
    console.error("Failed to refresh settlement UI:", error);
  }
}

function showToast(message, duration = 3000) {
  const toast = document.createElement("div");

  toast.className = "toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// ================================
// Members
// ================================

async function loadMembers() {
  try {
    /*
     * D1 returns:
     *
     * members: [
     *   {
     *     userId,
     *     role,
     *     name,
     *     email,
     *     photoURL,
     *     upiId
     *   }
     * ]
     */

    members = currentGroup.members || [];
    console.log(currentGroup);

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

    image.alt = member.name || "Member";

    const info = document.createElement("div");

    info.className = "member-info";

    const name = document.createElement("h3");

    name.textContent =
      Number(member.userId) === Number(currentUser.id)
        ? `${member.name} (You)`
        : member.name;

    const upi = document.createElement("p");

    upi.textContent = member.upiId || member.upi_id || "No Upi Added";

    info.appendChild(name);
    info.appendChild(upi);

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
    const response = await api.get(`/groups/${groupId}/balances`);

    const balances = response.data || [];

    const myBalanceData = balances.find(
      (balance) => Number(balance.userId) === Number(currentUser.id)
    );

    if (!myBalanceData) {
      myBalance.textContent = "No balance information.";

      return;
    }

    const amount = myBalanceData.balancePaise || 0;

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

    card.addEventListener("click", (event) => {
      if (event.target.closest(".delete-expense-btn")) {
        return;
      }

      openExpenseDetails(expense.id);
    });

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

closeViewExpenseButton.addEventListener("click", closeExpenseDetails);

viewExpenseModal.addEventListener("click", (event) => {
  if (event.target === viewExpenseModal) {
    closeExpenseDetails();
  }
});

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
    const [suggestionsResponse, historyResponse] = await Promise.all([
      api.get(`/groups/${groupId}/settlements`),
      api.get(`/groups/${groupId}/settlements/history`),
    ]);

    const suggestions = suggestionsResponse.data || [];
    const history = historyResponse.data || [];

    // ----------------------------------------------------------
    // Settlement records that still matter to the UI
    // ----------------------------------------------------------

    const activeHistory = history.filter(
      (settlement) =>
        settlement.status === "pending" || settlement.status === "paid"
    );

    // ----------------------------------------------------------
    // Remove suggestions that already have a settlement record
    // ----------------------------------------------------------

    const filteredSuggestions = suggestions.filter((suggestion) => {
      return !activeHistory.some(
        (settlement) =>
          Number(settlement.from) === Number(suggestion.from) &&
          Number(settlement.to) === Number(suggestion.to) &&
          Number(settlement.amountPaise) === Number(suggestion.amountPaise)
      );
    });

    // ----------------------------------------------------------
    // History is the source of truth for existing settlements
    // ----------------------------------------------------------

    const settlements = [...activeHistory, ...filteredSuggestions];

    console.log("Settlement suggestions:", suggestions);
    console.log("Settlement history:", history);
    console.log("Settlements rendered:", settlements);

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

    // ==========================================================
    // PAYER
    // ==========================================================

    if (Number(settlement.from) === Number(currentUser.id)) {
      // --------------------------------------------------------
      // NEW SUGGESTION
      // --------------------------------------------------------

      if (!settlement.status) {
        const payButton = document.createElement("button");

        payButton.className = "settlement-button";
        payButton.textContent = "Pay";

        payButton.addEventListener("click", async () => {
          payButton.disabled = true;
          payButton.textContent = "Processing...";

          try {
            // 1. Create settlement
            const response = await api.post(`/groups/${groupId}/settlements`, {
              from: settlement.from,
              to: settlement.to,
              amountPaise: settlement.amountPaise,
            });

            const created = response.data;

            console.log("Created settlement:", created);

            // 2. Immediately mark it as paid
            await api.patch(
              `/groups/${groupId}/settlements/${created.id}/paid`
            );

            showToast("Payment marked as paid.");

            // Refresh settlement and balance data
            await Promise.all([loadBalance(), loadSettlements()]);
          } catch (error) {
            console.error("Payment failed:", error);

            showToast("Failed to process payment.");

            payButton.disabled = false;
            payButton.textContent = "Pay";
          }
        });

        card.appendChild(payButton);
      }

      // --------------------------------------------------------
      // PENDING EXISTING SETTLEMENT
      // --------------------------------------------------------
      else if (settlement.status === "pending") {
        const status = document.createElement("div");

        status.className = "settlement-status";
        status.textContent = "Payment not marked as paid yet";

        card.appendChild(status);

        const paidButton = document.createElement("button");

        paidButton.className = "settlement-button";
        paidButton.textContent = "Mark as Paid";

        paidButton.addEventListener("click", async () => {
          paidButton.disabled = true;
          paidButton.textContent = "Marking as paid...";

          try {
            await api.patch(
              `/groups/${groupId}/settlements/${settlement.id}/paid`
            );

            showToast("Payment marked as paid.");

            await Promise.all([loadBalance(), loadSettlements()]);
          } catch (error) {
            console.error("Mark as paid failed:", error);

            showToast("Failed to mark payment as paid.");

            paidButton.disabled = false;
            paidButton.textContent = "Mark as Paid";
          }
        });

        card.appendChild(paidButton);
      }

      // --------------------------------------------------------
      // PAID
      // --------------------------------------------------------
      else if (settlement.status === "paid") {
        const status = document.createElement("div");

        status.className = "settlement-status";
        status.textContent = "Payment sent — waiting for confirmation";

        card.appendChild(status);
      }
    }

    // ==========================================================
    // RECEIVER
    // ==========================================================

    if (
      Number(settlement.to) === Number(currentUser.id) &&
      settlement.status === "paid"
    ) {
      const status = document.createElement("div");

      status.className = "settlement-status";
      status.textContent = "Payment received?";

      card.appendChild(status);

      // --------------------------------------------------------
      // CONFIRM
      // --------------------------------------------------------

      const confirmButton = document.createElement("button");

      confirmButton.className = "settlement-button";
      confirmButton.textContent = "Confirm";

      confirmButton.addEventListener("click", async () => {
        confirmButton.disabled = true;
        confirmButton.textContent = "Confirming...";

        try {
          await api.patch(
            `/groups/${groupId}/settlements/${settlement.id}/confirm`
          );

          showToast("Payment confirmed.");

          await Promise.all([loadBalance(), loadSettlements()]);
        } catch (error) {
          console.error("Confirm failed:", error);

          showToast("Failed to confirm payment.");

          confirmButton.disabled = false;
          confirmButton.textContent = "Confirm";
        }
      });

      card.appendChild(confirmButton);

      // --------------------------------------------------------
      // REJECT
      // --------------------------------------------------------

      const rejectButton = document.createElement("button");

      rejectButton.className = "settlement-button";
      rejectButton.textContent = "Not Received";

      rejectButton.addEventListener("click", async () => {
        rejectButton.disabled = true;
        rejectButton.textContent = "Rejecting...";

        try {
          await api.patch(
            `/groups/${groupId}/settlements/${settlement.id}/reject`
          );

          showToast("Payment marked as not received.");

          await Promise.all([loadBalance(), loadSettlements()]);
        } catch (error) {
          console.error("Reject failed:", error);

          showToast("Failed to reject payment.");

          rejectButton.disabled = false;
          rejectButton.textContent = "Not Received";
        }
      });

      card.appendChild(rejectButton);
    }

    // ==========================================================
    // COMPLETED
    // ==========================================================

    if (settlement.status === "completed") {
      const status = document.createElement("div");

      status.className = "settlement-status";
      status.textContent = "Completed ✓";

      card.appendChild(status);
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

  const input = memberEmail.value.trim();

  if (!input) {
    memberError.textContent = "Enter an email address or username.";
    return;
  }
  let query = "";
  if (input.includes("@")) {
    query = `/users/search?email=${encodeURIComponent(input)}`;
  } else {
    query = `/users/search?username=${encodeURIComponent(input)}`;
  }
  try {
    submitMemberButton.disabled = true;

    submitMemberButton.textContent = "Searching...";

    const searchResponse = await api.get(query);

    const user = searchResponse.data;

    if (!user || !user.id) {
      throw new Error("User not found.");
    }

    if (Number(user.id) === Number(currentUser.id)) {
      throw new Error("You are already in this group.");
    }

    submitMemberButton.textContent = "Adding...";

    await api.post(`/groups/${groupId}/members`, {
      userId: user.id,
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

    option.value = member.userId;

    option.textContent =
      Number(member.userId) === Number(currentUser.id)
        ? `${member.name} (You)`
        : member.name;

    expensePaidBy.appendChild(option);
  });

  expensePaidBy.value = currentUser.id;
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

    checkbox.value = member.userId;

    checkbox.checked = true;

    const name = document.createElement("span");

    name.textContent =
      Number(member.userId) === Number(currentUser.id)
        ? `${member.name} (You)`
        : member.name;

    row.appendChild(checkbox);
    row.appendChild(name);

    participantsList.appendChild(row);
  });
}

// ================================
// Split type changes
// ================================

expenseSplitType.addEventListener("change", updateParticipantInputs);

function updateParticipantInputs() {
  const type = expenseSplitType.value;

  const rows = document.querySelectorAll(".participant-row");

  rows.forEach((row) => {
    const existingInput = row.querySelector(".participant-value");

    if (existingInput) {
      existingInput.remove();
    }

    if (type === "exact" || type === "percentage") {
      const input = document.createElement("input");

      input.type = "number";

      input.min = "0";

      input.step = "0.01";

      input.placeholder = type === "exact" ? "₹ amount" : "%";

      if (type === "percentage") {
        input.max = "100";
      }

      input.className = "participant-value";

      row.appendChild(input);
    }
  });
}

// ================================
// Expense loading
// ================================

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
  const expenseLoadingBar = document.getElementById("expense-loading-bar");

  const textElement = document.getElementById("expense-loading-text");

  if (expenseLoadingBar) {
    expenseLoadingBar.style.width = `${percent}%`;
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
// Delete expense
// ================================

deleteViewExpenseButton.addEventListener("click", async () => {
  if (!selectedExpenseId) {
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this expense?");

  if (!confirmed) {
    return;
  }

  try {
    deleteViewExpenseButton.disabled = true;

    deleteViewExpenseButton.textContent = "Deleting...";

    await api.delete(`/groups/${groupId}/expenses/${selectedExpenseId}`);

    clearExpenseCache();

    window.location.reload();
  } catch (error) {
    console.error("Failed to delete expense:", error);

    deleteViewExpenseButton.disabled = false;

    deleteViewExpenseButton.textContent = "Delete Expense";

    alert("Failed to delete expense. Please try again.");
  }
});

// ================================
// Expense details
// ================================

async function openExpenseDetails(expenseId) {
  selectedExpenseId = expenseId;

  try {
    viewExpenseModal.classList.remove("hidden");

    viewExpenseDescription.textContent = "Loading...";

    viewExpenseAmount.textContent = "-";

    viewExpensePaidBy.textContent = "-";

    viewExpenseCategory.textContent = "-";

    viewExpenseDate.textContent = "-";

    viewExpenseSplitType.textContent = "-";

    viewExpenseParticipants.innerHTML = "Loading...";

    const response = await api.get(`/groups/${groupId}/expenses/${expenseId}`);

    const expense = response.data;

    viewExpenseDescription.textContent = expense.description;

    viewExpenseAmount.textContent = `₹${(expense.amountPaise / 100).toFixed(
      2
    )}`;

    viewExpenseCategory.textContent = expense.category;

    viewExpenseDate.textContent = expense.expenseDate;

    viewExpenseSplitType.textContent = expense.splitType;

    const payer = members.find(
      (member) => Number(member.userId) === Number(expense.paidBy)
    );

    viewExpensePaidBy.textContent = payer?.name || "Unknown";

    viewExpenseParticipants.innerHTML = "";

    expense.participants.forEach((participant) => {
      const member = members.find(
        (member) => Number(member.userId) === Number(participant.userId)
      );

      const row = document.createElement("div");

      row.className = "view-participant";

      const name = document.createElement("span");

      name.textContent = member?.name || "Unknown";

      const amount = document.createElement("strong");

      if (expense.splitType === "percentage") {
        amount.textContent = `${participant.percentage}%`;
      } else {
        amount.textContent = `₹${(participant.amountPaise / 100).toFixed(2)}`;
      }

      row.appendChild(name);
      row.appendChild(amount);

      viewExpenseParticipants.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load expense:", error);

    viewExpenseParticipants.textContent = "Unable to load expense details.";
  }
}

function closeExpenseDetails() {
  viewExpenseModal.classList.add("hidden");
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

    const paidBy = Number(expensePaidBy.value);

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
      participants = selectedParticipants.map((checkbox) =>
        Number(checkbox.value)
      );
    } else {
      participants = selectedParticipants.map((checkbox) => {
        const row = checkbox.closest(".participant-row");

        const input = row.querySelector(".participant-value");

        const value = Number(input.value);

        if (!Number.isFinite(value) || value < 0) {
          throw new Error("Enter valid split values.");
        }

        if (splitType === "exact") {
          return {
            userId: Number(checkbox.value),

            amountPaise: rupeesToPaise(value),
          };
        }

        return {
          userId: Number(checkbox.value),

          percentage: value,
        };
      });
    }

    // Client-side validation
    if (splitType === "exact") {
      const total = participants.reduce(
        (sum, participant) => sum + participant.amountPaise,
        0
      );

      if (total !== amountPaise) {
        throw new Error("Exact split amounts must equal the total.");
      }
    }

    if (splitType === "percentage") {
      const total = participants.reduce(
        (sum, participant) => sum + participant.percentage,
        0
      );

      if (Math.abs(total - 100) > 0.000001) {
        throw new Error("Percentages must add up to 100%.");
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
    // Refresh
    // --------------------------------

    setExpenseProgress(55, "Updating group...");

    await Promise.all([
      loadGroup(),
      loadMembers(),
      loadExpenses(),
      loadSettlements(),
      loadBalance(),
    ]);

    setExpenseProgress(100, "Expense added!");

    setTimeout(() => {
      hideExpenseLoading();
      closeExpenseModal();
    }, 400);
  } catch (error) {
    console.error("Create expense failed:", error);

    hideExpenseLoading();

    expenseError.textContent = error.message || "Unable to create expense.";
  } finally {
    submitExpenseButton.disabled = false;

    submitExpenseButton.textContent = "Add Expense";
  }
});

// ================================
// Cache
// ================================

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

    if (window.Clerk && Clerk.signOut) {
      await Clerk.signOut();
    }

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

function getMemberName(userId) {
  if (Number(userId) === Number(currentUser.id)) {
    return "You";
  }

  const member = members.find((item) => Number(item.userId) === Number(userId));

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

// ================================
// Start
// ================================

initializePage();

window.addEventListener("pageshow", async () => {
  console.log("Returned to group page");

  await refreshSettlementUI();
});

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    console.log("App became visible again");

    await refreshSettlementUI();
  }
});
