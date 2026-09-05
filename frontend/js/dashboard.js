import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";


const welcomeName =
    document.getElementById("welcome-name");

const userName =
    document.getElementById("user-name");

const userPhoto =
    document.getElementById("user-photo");

const totalOwe =
    document.getElementById("total-owe");

const totalOwed =
    document.getElementById("total-owed");

const groupsContainer =
    document.getElementById("groups-container");

const logoutButton =
    document.getElementById("logout-btn");

const createGroupButton =
    document.getElementById("create-group-btn");

const createGroupModal =
    document.getElementById("create-group-modal");

const createGroupForm =
    document.getElementById("create-group-form");

const cancelGroupButton =
    document.getElementById("cancel-group-btn");

const closeGroupButton =
    document.getElementById("close-group-btn");

const groupNameInput =
    document.getElementById("group-name");

const groupError =
    document.getElementById("group-error");

const submitGroupButton =
    document.getElementById("submit-group-btn");


/*
 * Authentication
 */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "./login.html";

        return;
    }


    renderUser(user);


    await loadDashboard();

});


/*
 * User information
 */

function renderUser(user) {

    const name =
        user.displayName || "User";

    welcomeName.textContent = name;

    userName.textContent = name;


    if (user.photoURL) {

        userPhoto.src = user.photoURL;

    } else {

        userPhoto.style.display = "none";

    }

}


/*
 * Dashboard data
 */

async function loadDashboard() {

    await Promise.all([
        loadGroups()
    ]);

}


/*
 * Groups
 */

async function loadGroups() {

    groupsContainer.innerHTML = `
        <div class="loading-state">
            Loading groups...
        </div>
    `;


    try {

        const response =
            await api.get("/groups");

        const groups =
            response.data || [];

        renderGroups(groups);

        await loadBalances(groups);

    } catch (error) {

        console.error(
            "Failed to load groups:",
            error
        );

        groupsContainer.innerHTML = `
            <div class="error-state">
                Unable to load your groups.
                Please try again.
            </div>
        `;

    }

}


function renderGroups(groups) {

    if (groups.length === 0) {

        groupsContainer.innerHTML = `
            <div class="empty-state">
                <p>You haven't joined any groups yet.</p>

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
            .addEventListener(
                "click",
                openCreateGroupModal
            );

        return;
    }


    groupsContainer.innerHTML = "";


    groups.forEach(group => {

        const card =
            document.createElement("div");

        card.className = "group-card";


        const title =
            document.createElement("h3");

        title.textContent =
            group.name || "Unnamed Group";


        const description =
            document.createElement("p");

        description.textContent =
            "View group details";


        card.appendChild(title);

        card.appendChild(description);


        card.addEventListener("click", () => {

            window.location.href =
                `./group.html?id=${group.id}`;

        });


        groupsContainer.appendChild(card);

    });

}


/*
 * Balances
 */

async function loadBalances(groups) {

    let owePaise = 0;
    let owedPaise = 0;


    try {

        const balanceRequests =
            groups.map(group =>
                api.get(
                    `/groups/${group.id}/balances`
                )
            );


        const responses =
            await Promise.all(balanceRequests);


        responses.forEach(response => {

            const balances =
                response.data || [];


            balances.forEach(balance => {

                if (
                    balance.userId !==
                    auth.currentUser.uid
                ) {
                    return;
                }


                const amount =
                    balance.balancePaise || 0;


                if (amount < 0) {

                    owePaise += Math.abs(amount);

                } else if (amount > 0) {

                    owedPaise += amount;

                }

            });

        });


        totalOwe.textContent =
            formatCurrency(owePaise);

        totalOwed.textContent =
            formatCurrency(owedPaise);


    } catch (error) {

        console.error(
            "Failed to load balances:",
            error
        );

        totalOwe.textContent = "—";

        totalOwed.textContent = "—";

    }

}


/*
 * Create group modal
 */

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


createGroupButton.addEventListener(
    "click",
    openCreateGroupModal
);


cancelGroupButton.addEventListener(
    "click",
    closeCreateGroupModal
);


closeGroupButton.addEventListener(
    "click",
    closeCreateGroupModal
);


/*
 * Create group
 */

createGroupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            groupNameInput.value.trim();


        if (!name) {

            groupError.textContent =
                "Please enter a group name.";

            return;
        }


        try {

            submitGroupButton.disabled = true;

            submitGroupButton.textContent =
                "Creating...";


            await api.post("/groups", {
                name: name
            });


            closeCreateGroupModal();


            await loadGroups();


        } catch (error) {

            console.error(
                "Create group failed:",
                error
            );

            groupError.textContent =
                error.message ||
                "Unable to create group.";


        } finally {

            submitGroupButton.disabled = false;

            submitGroupButton.textContent =
                "Create Group";

        }

    }
);


/*
 * Logout
 */

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


/*
 * Currency
 */

function formatCurrency(paise) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    ).format(paise / 100);

}