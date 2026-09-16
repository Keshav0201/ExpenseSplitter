import { api } from "./api.js";

const nameInput = document.getElementById("profile-name");

const emailInput = document.getElementById("profile-email");

const usernameInput = document.getElementById("profile-username");

const upiInput = document.getElementById("profile-upi");

const form = document.getElementById("profile-form");

const saveButton = document.getElementById("save-profile-btn");

const errorMessage = document.getElementById("profile-error");

const successMessage = document.getElementById("profile-success");

// ============================================================
// Load profile
// ============================================================

function loadProfile() {
  try {
    const cachedUser = localStorage.getItem("currentUser");

    if (!cachedUser) {
      throw new Error("User information not found.");
    }

    const profile = JSON.parse(cachedUser);

    nameInput.value = profile.name || "";
    usernameInput.value = profile.username || "";
    emailInput.value = profile.email || "";
    upiInput.value = profile.upiId || profile.upi_id || "";

    if (profile.username) {
      usernameInput.disabled = true;
    }

    console.log("[PROFILE] Loaded from localStorage");
  } catch (error) {
    console.error("Failed to load profile:", error);

    errorMessage.textContent = error.message || "Failed to load profile.";

    throw error;
  }
}

// ============================================================
// Update profile
// ============================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  successMessage.textContent = "";

  const name = nameInput.value.trim();
  const username = usernameInput.value.trim().toLowerCase();
  const upiId = upiInput.value.trim();

  if (!name) {
    errorMessage.textContent = "Name cannot be empty.";
    return;
  }

  if (username && (username.length < 6 || username.length > 10)) {
    errorMessage.textContent = "Username should be between 6 to 10 characters.";
    return;
  }

  if (username?.includes(" ")) {
    errorMessage.textContent = "Username should not contain space";
    return;
  }

  if (username) {
    const response = await api.get(`/users/check-username/${username}`);
    if (!response.available) {
      errorMessage.textContent = "Username already exists.";
      return;
    }
  }

  try {
    saveButton.disabled = true;

    saveButton.textContent = "Saving...";

    await api.put("/users/me", {
      name,
      upiId,
      username,
    });

    localStorage.removeItem("currentUser");

    successMessage.textContent = "Profile updated successfully.";

    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Failed to update profile:", error);

    errorMessage.textContent = error.message || "Failed to update profile.";
  } finally {
    saveButton.disabled = false;

    saveButton.textContent = "Save Changes";
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
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
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

async function initializeProfile() {
  try {
    await loadProfile();
    
  } catch (error) {
    console.error("Failed to initialize profile:", error);
    errorMessage.textContent = error.message || "Failed to load profile.";
  }
}

initializeProfile();
