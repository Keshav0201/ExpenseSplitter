import { auth } from "./firebase.js";
import { api } from "./api.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const nameInput = document.getElementById("profile-name");
const emailInput = document.getElementById("profile-email");
const upiInput = document.getElementById("profile-upi");

const form = document.getElementById("profile-form");
const saveButton = document.getElementById("save-profile-btn");

const errorMessage = document.getElementById("profile-error");
const successMessage = document.getElementById("profile-success");


// Load profile
async function loadProfile() {
    try {
        const response = await api.get("/users/me");

        const profile = response.data;

        nameInput.value = profile.name || "";
        emailInput.value = profile.email || "";
        upiInput.value = profile.upiId || "";

    } catch (error) {
        console.error("Failed to load profile:", error);

        errorMessage.textContent = "Failed to load profile.";
    }
}


// Update profile
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorMessage.textContent = "";
    successMessage.textContent = "";

    const name = nameInput.value.trim();
    const upiId = upiInput.value.trim();

    if (!name) {
        errorMessage.textContent = "Name cannot be empty.";
        return;
    }

    try {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        await api.put("/users/me", {
            name,
            upiId
        });

        successMessage.textContent = "Profile updated successfully.";

    } catch (error) {
        console.error("Failed to update profile:", error);

        errorMessage.textContent =
            error.message || "Failed to update profile.";

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});


// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);

    window.location.href = "./login.html";
});


// Authentication
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    await loadProfile();
});