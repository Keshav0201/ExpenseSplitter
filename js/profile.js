import { api } from "./api.js";

const bar = document.getElementById("bar");
bar.style.width = "0%";

const loadingBar = document.getElementById("progress-bar-container");

const nameInput = document.getElementById("profile-name");

const emailInput = document.getElementById("profile-email");

const upiInput = document.getElementById("profile-upi");

const form = document.getElementById("profile-form");

const saveButton = document.getElementById("save-profile-btn");

const errorMessage = document.getElementById("profile-error");

const successMessage = document.getElementById("profile-success");

// ============================================================
// Load profile
// ============================================================

async function loadProfile() {
    try {
        const response = await api.get("/users/me");

        const profile = response.data;

        if (!profile) {
            throw new Error("Profile not found");
        }

        nameInput.value = profile.name || "";
        emailInput.value = profile.email || "";
        upiInput.value =
            profile.upiId ||
            profile.upi_id ||
            "";

    } catch (error) {
        console.error("Failed to load profile:", error);

        errorMessage.textContent =
            error.message || "Failed to load profile.";

        throw error;
    }
}

bar.style.width = "20%";

// ============================================================
// Update profile
// ============================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  loadingBar.style.display = "flex";

  errorMessage.textContent = "";
  successMessage.textContent = "";

  const name = nameInput.value.trim();

  const upiId = upiInput.value.trim();

  if (!name) {
    errorMessage.textContent = "Name cannot be empty.";

    loadingBar.style.display = "none";

    bar.style.width = "0%";

    return;
  }

  try {
    bar.style.width = "40%";

    saveButton.disabled = true;

    saveButton.textContent = "Saving...";

    await api.put("/users/me", {
      name,
      upiId,
    });

    bar.style.width = "80%";

    successMessage.textContent = "Profile updated successfully.";

    bar.style.width = "100%";

    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Failed to update profile:", error);

    errorMessage.textContent = error.message || "Failed to update profile.";
  } finally {
    saveButton.disabled = false;

    saveButton.textContent = "Save Changes";

    loadingBar.style.display = "none";
  }
});

// ============================================================
// Logout
// ============================================================

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    const logoutButton = document.getElementById("logout-btn");

    logoutButton.disabled = true;

    logoutButton.textContent = "Logging out...";

    if (window.Clerk && Clerk.signOut) {
      await Clerk.signOut();
    }

    window.location.href = "./login.html";
  } catch (error) {
    console.error("Logout failed:", error);

    const logoutButton = document.getElementById("logout-btn");

    logoutButton.disabled = false;

    logoutButton.textContent = "Logout";
  }
});

// ============================================================
// Authentication / Initial load
// ============================================================

bar.style.width = "60%";
async function initializeProfile() {
    try {
        await loadProfile();
        bar.style.width = "100%";
    } catch (error) {
        console.error("Failed to initialize profile:", error);
        errorMessage.textContent =
            error.message || "Failed to load profile.";
    }
}

initializeProfile();

// Hide loading bar after initialization
setTimeout(() => {
  loadingBar.style.display = "none";
}, 500);
