import { auth } from "./firebase.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { api } from "./api.js";


const googleLoginButton =
    document.getElementById("google-login-btn");

const authError =
    document.getElementById("auth-error");

const provider = new GoogleAuthProvider();


/* Google Login */
if (googleLoginButton) {

    googleLoginButton.addEventListener("click", async () => {

        authError.textContent = "";

        try {

            googleLoginButton.disabled = true;
            googleLoginButton.textContent = "Signing in...";

            await signInWithPopup(auth, provider);

        } catch (error) {

            console.error(error);

            authError.textContent =
                "Unable to sign in. Please try again.";

            googleLoginButton.disabled = false;
            googleLoginButton.textContent =
                "Continue with Google";
        }

    });

}


/* Authentication State */
onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log("User is logged in:", user.email);

        try {

            const profile = await api.get("/users/me");

            console.log("Backend profile:", profile);

            window.location.href = "./dashboard.html";

        } catch (error) {

            console.error("Backend authentication failed:", error);

        }

    } else {

        console.log("No authenticated user");

    }

});

