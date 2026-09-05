import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";


// ================================
// Get group ID from URL
// ================================

const params = new URLSearchParams(window.location.search);

const groupId = params.get("id");


// ================================
// DOM elements
// ================================

const groupName =
    document.getElementById("group-name");

const groupDescription =
    document.getElementById("group-description");

const myBalance =
    document.getElementById("my-balance");

const membersContainer =
    document.getElementById("members-container");

const expensesContainer =
    document.getElementById("expenses-container");

const settlementsContainer =
    document.getElementById("settlements-container");

const logoutButton =
    document.getElementById("logout-btn");


// Add member
const addMemberButton =
    document.getElementById("add-member-btn");

const addMemberModal =
    document.getElementById("add-member-modal");

const addMemberForm =
    document.getElementById("add-member-form");

const memberEmail =
    document.getElementById("member-email");

const memberError =
    document.getElementById("member-error");

const submitMemberButton =
    document.getElementById("submit-member-btn");

const cancelMemberButton =
    document.getElementById("cancel-member-btn");

const closeMemberButton =
    document.getElementById("close-member-btn");


// Expense
const addExpenseButton =
    document.getElementById("add-expense-btn");

const expenseModal =
    document.getElementById("expense-modal");

const expenseForm =
    document.getElementById("expense-form");

const expenseDescription =
    document.getElementById("expense-description");

const expenseAmount =
    document.getElementById("expense-amount");

const expensePaidBy =
    document.getElementById("expense-paid-by");

const expenseSplitType =
    document.getElementById("expense-split-type");

const participantsList =
    document.getElementById("participants-list");

const expenseCategory =
    document.getElementById("expense-category");

const expenseDate =
    document.getElementById("expense-date");

const expenseError =
    document.getElementById("expense-error");

const submitExpenseButton =
    document.getElementById("submit-expense-btn");

const cancelExpenseButton =
    document.getElementById("cancel-expense-btn");

const closeExpenseButton =
    document.getElementById("close-expense-btn");


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

    try {

        await loadGroup();

        await loadMembers();

        await Promise.all([
            loadExpenses(),
            loadBalance(),
            loadSettlements()
        ]);

    } catch (error) {

        console.error(
            "Failed to load group:",
            error
        );

    }

}


// ================================
// Group
// ================================

async function loadGroup() {

    const response =
        await api.get(`/groups/${groupId}`);

    currentGroup =
        response.data;

    groupName.textContent =
        currentGroup.name || "Unnamed Group";

    groupDescription.textContent =
        "Group expenses and settlements";

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


    members.forEach(member => {

        const card =
            document.createElement("div");

        card.className = "member-card";


        const image =
            document.createElement("img");

        image.className = "member-photo";

        image.src =
            member.photoURL ||
            "https://ui-avatars.com/api/?name=User";

        image.alt =
            member.name;


        const info =
            document.createElement("div");

        info.className = "member-info";


        const name =
            document.createElement("h3");

        name.textContent =
            member.uid === currentUser.uid
                ? `${member.name} (You)`
                : member.name;


        const email =
            document.createElement("p");

        email.textContent =
            member.email || "Member";


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

    myBalance.textContent =
        "Loading...";


    try {

        const response =
            await api.get(
                `/groups/${groupId}/balances`
            );


        const balances =
            response.data || [];


        const balance =
            balances.find(
                item =>
                    item.userId === currentUser.uid
            );


        if (!balance) {

            myBalance.textContent =
                "No balance information.";

            return;
        }


        const amount =
            balance.balancePaise || 0;


        if (amount > 0) {

            myBalance.textContent =
                `You are owed ${formatCurrency(amount)}`;

        } else if (amount < 0) {

            myBalance.textContent =
                `You owe ${formatCurrency(Math.abs(amount))}`;

        } else {

            myBalance.textContent =
                "You are all settled up ✓";

        }

    } catch (error) {

        console.error(
            "Failed to load balance:",
            error
        );

        myBalance.textContent =
            "Unable to load balance.";

    }

}


// ================================
// Expenses
// ================================

async function loadExpenses() {

    expensesContainer.innerHTML = `
        <div class="loading-state">
            Loading expenses...
        </div>
    `;


    try {

        const response =
            await api.get(
                `/groups/${groupId}/expenses`
            );


        const expenses =
            response.data || [];


        renderExpenses(expenses);

    } catch (error) {

        console.error(
            "Failed to load expenses:",
            error
        );


        expensesContainer.innerHTML = `
            <div class="error-state">
                Unable to load expenses.
            </div>
        `;

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


    expenses.forEach(expense => {

        const card =
            document.createElement("div");

        card.className = "expense-card";


        const info =
            document.createElement("div");

        info.className = "expense-info";


        const title =
            document.createElement("h3");

        title.textContent =
            expense.description;


        const details =
            document.createElement("p");

        details.textContent =
            `${expense.category || "Other"} • ${
                expense.expenseDate || ""
            }`;


        info.appendChild(title);

        info.appendChild(details);


        const amount =
            document.createElement("span");

        amount.className =
            "expense-amount";

        amount.textContent =
            formatCurrency(
                expense.amountPaise
            );


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

        const response =
            await api.get(
                `/groups/${groupId}/settlements`
            );


        const settlements =
            response.data || [];


        renderSettlements(settlements);

    } catch (error) {

        console.error(
            "Failed to load settlements:",
            error
        );


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


    settlements.forEach(settlement => {

        const card =
            document.createElement("div");

        card.className =
            "settlement-card";


        const info =
            document.createElement("div");

        info.className =
            "settlement-info";


        const from =
            getMemberName(settlement.from);

        const to =
            getMemberName(settlement.to);


        info.textContent =
            `${from} → ${to}`;


        const amount =
            document.createElement("span");

        amount.className =
            "settlement-amount";

        amount.textContent =
            formatCurrency(
                settlement.amountPaise
            );


        card.appendChild(info);

        card.appendChild(amount);


        settlementsContainer.appendChild(card);

    });

}


// ================================
// Add Member
// ================================

addMemberButton.addEventListener(
    "click",
    openMemberModal
);


cancelMemberButton.addEventListener(
    "click",
    closeMemberModal
);


closeMemberButton.addEventListener(
    "click",
    closeMemberModal
);


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


addMemberForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            memberEmail.value.trim();


        if (!email) {

            memberError.textContent =
                "Enter an email address.";

            return;
        }


        try {

            submitMemberButton.disabled = true;

            submitMemberButton.textContent =
                "Searching...";


            const searchResponse =
                await api.get(
                    `/users/search?email=${encodeURIComponent(email)}`
                );


            const user =
                searchResponse.data;


            if (!user || !user.uid) {

                throw new Error(
                    "User not found."
                );

            }


            if (user.uid === currentUser.uid) {

                throw new Error(
                    "You are already in this group."
                );

            }


            submitMemberButton.textContent =
                "Adding...";


            await api.post(
                `/groups/${groupId}/members`,
                {
                    userId: user.uid
                }
            );


            closeMemberModal();


            await loadGroup();

            await loadMembers();


        } catch (error) {

            console.error(
                "Add member failed:",
                error
            );


            memberError.textContent =
                error.message ||
                "Unable to add member.";

        } finally {

            submitMemberButton.disabled = false;

            submitMemberButton.textContent =
                "Add Member";

        }

    }
);


// ================================
// Expense Modal
// ================================

addExpenseButton.addEventListener(
    "click",
    openExpenseModal
);


cancelExpenseButton.addEventListener(
    "click",
    closeExpenseModal
);


closeExpenseButton.addEventListener(
    "click",
    closeExpenseModal
);


function openExpenseModal() {

    expenseError.textContent = "";

    expenseForm.reset();


    /*
     * Default expense date to today.
     */

    expenseDate.value =
        new Date()
            .toISOString()
            .split("T")[0];


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


    members.forEach(member => {

        const option =
            document.createElement("option");

        option.value =
            member.uid;

        option.textContent =
            member.uid === currentUser.uid
                ? `${member.name} (You)`
                : member.name;


        expensePaidBy.appendChild(option);

    });


    expensePaidBy.value =
        currentUser.uid;

}


// ================================
// Participants
// ================================

function renderParticipants() {

    participantsList.innerHTML = "";


    members.forEach(member => {

        const row =
            document.createElement("div");

        row.className =
            "participant-row";


        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "participant-checkbox";

        checkbox.value =
            member.uid;

        checkbox.checked = true;


        const name =
            document.createElement("span");

        name.textContent =
            member.uid === currentUser.uid
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

expenseSplitType.addEventListener(
    "change",
    () => {

        updateParticipantInputs();

    }
);


function updateParticipantInputs() {

    const type =
        expenseSplitType.value;


    const rows =
        document.querySelectorAll(
            ".participant-row"
        );


    rows.forEach(row => {

        const existingInput =
            row.querySelector(
                ".participant-value"
            );


        if (existingInput) {
            existingInput.remove();
        }


        if (type === "exact") {

            const input =
                document.createElement("input");

            input.type = "number";

            input.min = "0";

            input.step = "0.01";

            input.placeholder =
                "₹ amount";

            input.className =
                "participant-value";

            row.appendChild(input);

        }


        if (type === "percentage") {

            const input =
                document.createElement("input");

            input.type = "number";

            input.min = "0";

            input.max = "100";

            input.step = "0.01";

            input.placeholder =
                "%";

            input.className =
                "participant-value";

            row.appendChild(input);

        }

    });

}


// ================================
// Create Expense
// ================================

expenseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        expenseError.textContent = "";


        try {

            submitExpenseButton.disabled = true;

            submitExpenseButton.textContent =
                "Adding...";


            const description =
                expenseDescription.value.trim();


            const amount =
                Number(expenseAmount.value);


            const paidBy =
                expensePaidBy.value;


            const splitType =
                expenseSplitType.value;


            const category =
                expenseCategory.value;


            const date =
                expenseDate.value;


            if (!description) {

                throw new Error(
                    "Enter an expense description."
                );

            }


            if (!amount || amount <= 0) {

                throw new Error(
                    "Enter a valid amount."
                );

            }


            if (!paidBy) {

                throw new Error(
                    "Select who paid."
                );

            }


            const selectedParticipants =
                Array.from(
                    document.querySelectorAll(
                        ".participant-checkbox:checked"
                    )
                );


            if (
                selectedParticipants.length === 0
            ) {

                throw new Error(
                    "Select at least one participant."
                );

            }


            const amountPaise =
                rupeesToPaise(amount);


            let participants;


            if (splitType === "equal") {

                participants =
                    selectedParticipants.map(
                        checkbox => checkbox.value
                    );

            } else {

                participants =
                    selectedParticipants.map(
                        checkbox => {

                            const row =
                                checkbox.closest(
                                    ".participant-row"
                                );


                            const input =
                                row.querySelector(
                                    ".participant-value"
                                );


                            const value =
                                Number(input.value);


                            if (
                                !value ||
                                value < 0
                            ) {

                                throw new Error(
                                    "Enter valid split values."
                                );

                            }


                            if (
                                splitType ===
                                "exact"
                            ) {

                                return {
                                    userId:
                                        checkbox.value,

                                    amountPaise:
                                        rupeesToPaise(
                                            value
                                        )
                                };

                            }


                            return {
                                userId:
                                    checkbox.value,

                                percentage:
                                    value
                            };

                        }
                    );

            }


            if (splitType === "exact") {

                const total =
                    participants.reduce(
                        (sum, participant) =>
                            sum +
                            participant.amountPaise,
                        0
                    );


                if (total !== amountPaise) {

                    throw new Error(
                        "Exact split amounts must equal the total."
                    );

                }

            }


            if (splitType === "percentage") {

                const total =
                    participants.reduce(
                        (sum, participant) =>
                            sum +
                            participant.percentage,
                        0
                    );


                if (total !== 100) {

                    throw new Error(
                        "Percentages must add up to 100%."
                    );

                }

            }


            await api.post(
                `/groups/${groupId}/expenses`,
                {
                    description,
                    amountPaise,
                    paidBy,
                    splitType,
                    participants,
                    category,
                    expenseDate: date
                }
            );


            closeExpenseModal();


            await Promise.all([
                loadExpenses(),
                loadBalance(),
                loadSettlements()
            ]);


        } catch (error) {

            console.error(
                "Create expense failed:",
                error
            );


            expenseError.textContent =
                error.message ||
                "Unable to create expense.";

        } finally {

            submitExpenseButton.disabled = false;

            submitExpenseButton.textContent =
                "Add Expense";

        }

    }
);


// ================================
// Logout
// ================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            await signOut(auth);


            window.location.href =
                "./login.html";


        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );

            logoutButton.disabled = false;

            logoutButton.textContent =
                "Logout";

        }

    }
);


// ================================
// Helpers
// ================================

function getMemberName(uid) {

    if (uid === currentUser.uid) {
        return "You";
    }


    const member =
        members.find(
            item => item.uid === uid
        );


    return member
        ? member.name
        : "Member";

}


function rupeesToPaise(rupees) {

    return Math.round(
        Number(rupees) * 100
    );

}


function formatCurrency(paise) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    ).format((paise || 0) / 100);

}


function showPageError(message) {

    groupName.textContent =
        "Unable to load group";

    groupDescription.textContent =
        message;

}