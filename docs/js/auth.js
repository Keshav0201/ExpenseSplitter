import { auth } from "./firebase.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";
const bar = document.getElementById("bar");
bar.style.width = "0%";
const loadingBar = document.getElementById("progress-bar-container");
loadingBar.style.display = "none";

const googleLoginButton = document.getElementById("google-login-btn");

const authError = document.getElementById("auth-error");

const provider = new GoogleAuthProvider();

/* =========================
   Google Login
========================= */

if (googleLoginButton) {
  const googleLoginText = googleLoginButton.querySelector("span");

  googleLoginButton.addEventListener("click", async () => {
    loadingBar.style.display = "flex";
    bar.style.width = "20%";
    if (authError) {
      authError.textContent = "";
    }

    googleLoginButton.disabled = true;
    bar.style.width = "40%";

    if (googleLoginText) {
      googleLoginText.textContent = "Signing in...";
    }

    try {
      bar.style.width = "60%";
      await signInWithPopup(auth, provider);
      bar.style.width = "80%";
    } catch (error) {
      console.error("Google login failed:", error);

      if (authError) {
        authError.textContent = "Unable to sign in. Please try again.";
      }

      googleLoginButton.disabled = false;

      if (googleLoginText) {
        googleLoginText.textContent = "Continue with Google";
      }
    }
    loadingBar.style.display = "none";
    bar.style.width = "0%";
  });
}

/* =========================
   Authentication State
========================= */

onAuthStateChanged(auth, async (user) => {
  loadingBar.style.display = "flex";
  bar.style.width = "20%";
  if (user) {
    console.log("User is logged in:", user.email);
    bar.style.width = "40%";

    try {
      const profile = await api.get("/users/me");

      console.log("Backend profile:", profile);
      loadingBar.style.display = "none";
      bar.style.width = "0%";
      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error("Backend authentication failed:", error);

      if (authError) {
        authError.textContent = "Login failed. Please try again.";
      }

      if (googleLoginButton) {
        googleLoginButton.disabled = false;

        const googleLoginText = googleLoginButton.querySelector("span");

        if (googleLoginText) {
          googleLoginText.textContent = "Continue with Google";
        }
      }
    }
    loadingBar.style.display = "none";
    bar.style.width = "0%";
  } else {
    console.log("No authenticated user");

    if (googleLoginButton) {
      googleLoginButton.disabled = false;

      const googleLoginText = googleLoginButton.querySelector("span");

      if (googleLoginText) {
        googleLoginText.textContent = "Continue with Google";
      }
    }
  }
  loadingBar.style.display = "none";
  bar.style.width = "0%";
});
