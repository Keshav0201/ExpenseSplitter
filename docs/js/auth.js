import { auth } from "./firebase.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";


const googleLoginButton =
    document.getElementById("google-login-btn");

const authError =
    document.getElementById("auth-error");

const provider = new GoogleAuthProvider();


/* =========================
   Google Login
========================= */

if (googleLoginButton) {

    const googleLoginText =
        googleLoginButton.querySelector("span");

    googleLoginButton.addEventListener("click", async () => {

        if (authError) {
            authError.textContent = "";
        }

        googleLoginButton.disabled = true;

        if (googleLoginText) {
            googleLoginText.textContent = "Signing in...";
        }

        try {

            await signInWithPopup(auth, provider);

        } catch (error) {

            console.error("Google login failed:", error);

            if (authError) {
                authError.textContent =
                    "Unable to sign in. Please try again.";
            }

            googleLoginButton.disabled = false;

            if (googleLoginText) {
                googleLoginText.textContent =
                    "Continue with Google";
            }
        }
    });
}


/* =========================
   Authentication State
========================= */

onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log("User is logged in:", user.email);

        try {

            const profile = await api.get("/users/me");

            console.log("Backend profile:", profile);

            window.location.href = "./dashboard.html";

        } catch (error) {

            console.error(
                "Backend authentication failed:",
                error
            );

            if (authError) {
                authError.textContent =
                    "Login failed. Please try again.";
            }

            if (googleLoginButton) {
                googleLoginButton.disabled = false;

                const googleLoginText =
                    googleLoginButton.querySelector("span");

                if (googleLoginText) {
                    googleLoginText.textContent =
                        "Continue with Google";
                }
            }
        }

    } else {

        console.log("No authenticated user");

        if (googleLoginButton) {
            googleLoginButton.disabled = false;

            const googleLoginText =
                googleLoginButton.querySelector("span");

            if (googleLoginText) {
                googleLoginText.textContent =
                    "Continue with Google";
            }
        }
    }

});