import { api } from "./api.js";

const bar = document.getElementById("bar");
const loadingBar = document.getElementById("progress-bar-container");
const googleLoginButton = document.getElementById("google-login-btn");
const authError = document.getElementById("login-error");

bar.style.width = "0%";
loadingBar.style.display = "none";

async function initializeAuth() {
  try {
    loadingBar.style.display = "flex";
    bar.style.width = "20%";

    // Load Clerk + UI components
    await Clerk.load({
      ui: {
        ClerkUI: window.__internal_ClerkUICtor,
      },
    });

    bar.style.width = "40%";

    console.log("Clerk loaded!");
    console.log("Signed in:", Clerk.isSignedIn);

    if (Clerk.isSignedIn) {
      console.log(
        "User is already signed in:",
        Clerk.user?.primaryEmailAddress?.emailAddress
      );

      bar.style.width = "60%";

      try {
        await api.get("/users/me");
      } catch (error) {
        console.error("Failed to initialize user profile:", error);
      }

      bar.style.width = "100%";

      window.location.href = "./dashboard.html";

      return;
    }

    console.log("No authenticated user");

    if (googleLoginButton) {
      googleLoginButton.disabled = false;

      const googleLoginText = googleLoginButton.querySelector("span");

      if (googleLoginText) {
        googleLoginText.textContent = "Continue with Google";
      }
    }
  } catch (error) {
    console.error("Clerk initialization failed:", error);

    if (authError) {
      authError.textContent = "Unable to initialize authentication.";
    }
  } finally {
    loadingBar.style.display = "none";
    bar.style.width = "0%";
  }
}

if (googleLoginButton) {
  googleLoginButton.addEventListener("click", async () => {
    const googleLoginText = googleLoginButton.querySelector("span");

    try {
      loadingBar.style.display = "flex";
      bar.style.width = "20%";

      if (authError) {
        authError.textContent = "";
      }

      googleLoginButton.disabled = true;

      if (googleLoginText) {
        googleLoginText.textContent = "Signing in...";
      }

      bar.style.width = "40%";

      await Clerk.openSignIn();
    } catch (error) {
      console.error("Google login failed:", error);

      if (authError) {
        authError.textContent = "Unable to sign in. Please try again.";
      }

      googleLoginButton.disabled = false;

      if (googleLoginText) {
        googleLoginText.textContent = "Continue with Google";
      }

      loadingBar.style.display = "none";
      bar.style.width = "0%";
    }
  });
}

initializeAuth();
