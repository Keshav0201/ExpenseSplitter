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

      signInFallbackRedirectUrl: "/pages/dashboard.html",

      signUpFallbackRedirectUrl: "/pages/dashboard.html",
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

        if (authError) {
          authError.textContent =
            "Unable to connect to the server. Please try again.";
        }
      }

      bar.style.width = "100%";
      console.log("CURRENT URL:", window.location.href);
      console.log(
        "REDIRECTING TO:",
        new URL("./pages/dashboard.html", window.location.href).href
      );

      window.location.href = "./pages/dashboard.html";

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

      await Clerk.openSignIn({
        signInFallbackRedirectUrl: "./pages/dashboard.html",
        signUpFallbackRedirectUrl: "./pages/dashboard.html",
      });
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
