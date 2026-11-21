// Firebase Authentication Integration for Student Guidance System
// Project: Student-Guidane (student-guidane)

const firebaseConfig = {
    apiKey: "AIzaSyDZiz0-wZXrOcNsNXyW3YIVgdk9wSZRjAA",
    authDomain: "student-guidane.firebaseapp.com",
    projectId: "student-guidane",
    storageBucket: "student-guidane.firebasestorage.app",
    messagingSenderId: "809565342497",
    appId: "1:809565342497:web:38d2077f7e416c48954c60"
};

// Initialize Firebase if not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const googleProvider = (typeof firebase !== 'undefined') ? new firebase.auth.GoogleAuthProvider() : null;

// Helper to detect iOS or in-app webviews (Telegram, Messenger, Instagram, etc.)
function isMobileOrInApp() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isInApp = /Telegram|FBAN|FBAV|Instagram|Line|WhatsApp/i.test(ua);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isIOS || isInApp || isMobile;
}

/**
 * Send authenticated Firebase user token to Flask backend session endpoint
 */
async function sendFirebaseUserToBackend(user) {
    const idToken = await user.getIdToken();
    const userTypeInput = document.getElementById('userTypeInput');
    const userType = userTypeInput ? userTypeInput.value : 'user';

    const response = await fetch('/auth/firebase-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            uid: user.uid,
            idToken: idToken,
            user_type: userType
        })
    });

    const data = await response.json();

    if (data.success) {
        window.location.href = data.redirect_url || '/account';
    } else {
        showAuthAlert(data.message || 'Authentication error from server.', 'danger');
    }
}

/**
 * Handle Google Sign-In with automatic fallback to redirect for mobile & iOS
 */
async function handleFirebaseGoogleLogin() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        showAuthAlert('Firebase Auth library failed to load. Please check your internet connection.', 'danger');
        return;
    }

    const googleBtn = document.getElementById('googleLoginBtn') || document.querySelector('.google-login-btn');
    const originalBtnHtml = googleBtn ? googleBtn.innerHTML : '';

    try {
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing in with Google...';
        }

        // On iOS Safari / in-app browsers (Telegram, etc.), popups are blocked by default.
        // Use signInWithRedirect directly on mobile for a seamless flow, or try popup on desktop.
        if (isMobileOrInApp()) {
            await firebase.auth().signInWithRedirect(googleProvider);
            return;
        }

        try {
            const result = await firebase.auth().signInWithPopup(googleProvider);
            await sendFirebaseUserToBackend(result.user);
        } catch (popupError) {
            if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
                console.log('Popup blocked. Falling back to signInWithRedirect...');
                await firebase.auth().signInWithRedirect(googleProvider);
                return;
            }
            throw popupError;
        }

    } catch (error) {
        console.error('Firebase Google Sign-In Error:', error);
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalBtnHtml;
        }
        handleAuthError(error);
    }
}

/**
 * Centralized error handler with user-friendly instructions
 */
function handleAuthError(error) {
    if (error.code === 'auth/popup-closed-by-user') {
        return;
    }

    if (error.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        showAuthAlert(`<b>Domain unauthorized in Firebase:</b> <code>${host}</code><br><br>👉 Go to <b>Firebase Console > Authentication > Settings > Authorized domains</b>, click <b>Add domain</b>, and add: <code>${host}</code>`, 'warning');
    } else if (error.code === 'auth/popup-blocked') {
        showAuthAlert('Popup was blocked by your mobile browser. Switching to redirect sign-in...', 'info');
        firebase.auth().signInWithRedirect(googleProvider);
    } else if (error.code === 'auth/operation-not-allowed') {
        showAuthAlert('Google Sign-in is not enabled in Firebase Console. Go to Authentication > Sign-in method > Google, and click Enable.', 'warning');
    } else {
        showAuthAlert(error.message || 'Failed to sign in with Google.', 'danger');
    }
}

/**
 * Display alert messages dynamically on the page
 */
function showAuthAlert(message, type = 'danger') {
    let alertDiv = document.getElementById('firebaseErrorAlert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'firebaseErrorAlert';
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        const form = document.getElementById('loginForm') || document.getElementById('registerForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(alertDiv, form);
        }
    } else {
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    }

    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertDiv.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Check for redirect result on page load (essential for mobile & iOS)
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().getRedirectResult().then(async (result) => {
            if (result && result.user) {
                const googleBtn = document.getElementById('googleLoginBtn') || document.querySelector('.google-login-btn');
                if (googleBtn) {
                    googleBtn.disabled = true;
                    googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Finalizing sign in...';
                }
                await sendFirebaseUserToBackend(result.user);
            }
        }).catch((error) => {
            console.error('Redirect Sign-in Error:', error);
            handleAuthError(error);
        });
    }

    const googleBtns = document.querySelectorAll('.google-login-btn, #googleLoginBtn, a[href*="google_login"]');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            handleFirebaseGoogleLogin();
        });
    });
});
