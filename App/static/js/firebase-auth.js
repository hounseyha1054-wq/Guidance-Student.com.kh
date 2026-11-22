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

let isProcessingAuth = false;

/**
 * Show a sleek full-screen loading overlay on mobile so user never experiences silent delay
 */
function showFullScreenAuthLoader(text = "Connecting to Google...") {
    let overlay = document.getElementById('authFullScreenLoader');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'authFullScreenLoader';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            padding: 20px;
        `;
        overlay.innerHTML = `
            <div class="spinner-border text-primary" role="status" style="width: 3.2rem; height: 3.2rem; border-width: 0.25em;"></div>
            <h5 id="authLoaderTitle" style="margin-top: 1.5rem; font-weight: 700; font-size: 1.25rem;">${text}</h5>
            <p id="authLoaderSubtitle" style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-top: 0.5rem; max-width: 320px;">
                Setting up your profile and signing in. Please wait a moment...
            </p>
        `;
        document.body.appendChild(overlay);
    } else {
        const titleEl = document.getElementById('authLoaderTitle');
        if (titleEl) titleEl.textContent = text;
        overlay.style.display = 'flex';
    }
}

function hideFullScreenAuthLoader() {
    const overlay = document.getElementById('authFullScreenLoader');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Send authenticated Firebase user token to Flask backend session endpoint
 */
async function sendFirebaseUserToBackend(user) {
    if (isProcessingAuth) return;
    isProcessingAuth = true;

    showFullScreenAuthLoader("Signing you in...");

    const googleBtn = document.getElementById('googleLoginBtn') || document.querySelector('.google-login-btn');
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing in...';
    }

    try {
        const idToken = await user.getIdToken(false);
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
            sessionStorage.removeItem('pending_google_login');
            // Use location.replace for instant redirect without dirtying back history on iOS
            window.location.replace(data.redirect_url || '/account');
        } else {
            sessionStorage.removeItem('pending_google_login');
            hideFullScreenAuthLoader();
            showAuthAlert(data.message || 'Authentication error from server.', 'danger');
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = '<i class="bi bi-google text-danger me-2"></i>Continue with Google';
            }
            isProcessingAuth = false;
        }
    } catch (err) {
        sessionStorage.removeItem('pending_google_login');
        hideFullScreenAuthLoader();
        console.error('Backend Auth Sync Error:', err);
        showAuthAlert('Failed to connect with application server. Please try again.', 'danger');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="bi bi-google text-danger me-2"></i>Continue with Google';
        }
        isProcessingAuth = false;
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
            googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Connecting to Google...';
        }

        // If user is already authenticated in Firebase, directly log them into backend
        if (firebase.auth().currentUser) {
            await sendFirebaseUserToBackend(firebase.auth().currentUser);
            return;
        }

        // Mobile & iOS Safari: Use redirect flow with pending flag
        if (isMobileOrInApp()) {
            showFullScreenAuthLoader("Redirecting to Google...");
            sessionStorage.setItem('pending_google_login', 'true');
            await firebase.auth().signInWithRedirect(googleProvider);
            return;
        }

        // Desktop: Try popup first
        try {
            const result = await firebase.auth().signInWithPopup(googleProvider);
            if (result && result.user) {
                await sendFirebaseUserToBackend(result.user);
            }
        } catch (popupError) {
            if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
                console.log('Popup blocked. Falling back to signInWithRedirect...');
                showFullScreenAuthLoader("Redirecting to Google...");
                sessionStorage.setItem('pending_google_login', 'true');
                await firebase.auth().signInWithRedirect(googleProvider);
                return;
            }
            throw popupError;
        }

    } catch (error) {
        console.error('Firebase Google Sign-In Error:', error);
        sessionStorage.removeItem('pending_google_login');
        hideFullScreenAuthLoader();
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
    hideFullScreenAuthLoader();
    if (error.code === 'auth/popup-closed-by-user') {
        return;
    }

    if (error.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        showAuthAlert(`<b>Domain unauthorized in Firebase:</b> <code>${host}</code><br><br>👉 Go to <b>Firebase Console > Authentication > Settings > Authorized domains</b>, click <b>Add domain</b>, and add: <code>${host}</code>`, 'warning');
    } else if (error.code === 'auth/popup-blocked') {
        showAuthAlert('Popup was blocked by your mobile browser. Switching to redirect sign-in...', 'info');
        sessionStorage.setItem('pending_google_login', 'true');
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
        const isPending = sessionStorage.getItem('pending_google_login') === 'true';

        // If returning from Google redirect on iOS/mobile, immediately show full-screen overlay
        // so the user never sees a delay or wonder why the page loaded
        if (isPending) {
            showFullScreenAuthLoader("Completing Google Sign-In...");
        }

        // 1. Process getRedirectResult
        firebase.auth().getRedirectResult().then(async (result) => {
            if (result && result.user) {
                await sendFirebaseUserToBackend(result.user);
            } else if (isPending) {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    await sendFirebaseUserToBackend(currentUser);
                }
            }
        }).catch((error) => {
            console.error('Redirect Sign-in Error:', error);
            sessionStorage.removeItem('pending_google_login');
            hideFullScreenAuthLoader();
            handleAuthError(error);
        });

        // 2. Also listen to onAuthStateChanged (fastest fallback for iOS Safari)
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && sessionStorage.getItem('pending_google_login') === 'true') {
                await sendFirebaseUserToBackend(user);
            }
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
