import {
    EmailAuthProvider,
    createUserWithEmailAndPassword,
    linkWithCredential,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseAuth, googleProvider } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const loggedInUser = sessionStorage.getItem('userEmail');
    const loggedInName = sessionStorage.getItem('userName') || 'Student';

    // One-time login flow: keep users out of the login screen after they have already logged in.
    if (currentPage === 'login.html' && loggedInUser) {
        window.location.replace('student-dashboard.html');
        return;
    }

    if (['student-dashboard.html', 'admin-dashboard.html'].includes(currentPage) && !loggedInUser) {
        window.location.replace('login.html');
        return;
    }

    const googleButton = document.getElementById('googleSignInBtn') || document.getElementById('google-btn');
    const emailButton = document.getElementById('loginBtn') || document.getElementById('email-login-btn');
    const signupForm = document.getElementById('signupForm');

    function saveFirebaseUser(user) {
        sessionStorage.setItem('userEmail', user.email || 'firebase-user');
        sessionStorage.setItem('userName', user.displayName || 'Student');
        window.location.href = 'student-dashboard.html';
    }

    async function signInWithEmail(email, password) {
        const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
        saveFirebaseUser(result.user);
    }

    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            googleButton.disabled = true;
            try {
                const result = await signInWithPopup(firebaseAuth, googleProvider);
                saveFirebaseUser(result.user);
            } catch (error) {
                const email = document.getElementById('emailInput')?.value.trim();
                const password = document.getElementById('passwordInput')?.value;
                const googleCredential = error.customData?.email && GoogleAuthProvider.credentialFromError(error);
                if (error.code === 'auth/account-exists-with-different-credential' && email === error.customData.email && password && googleCredential) {
                    const existing = await signInWithEmailAndPassword(firebaseAuth, email, password);
                    await linkWithCredential(existing.user, googleCredential);
                    saveFirebaseUser(existing.user);
                    return;
                }
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = 'Google sign-in could not be completed. Please try again.';
                    errorMessage.style.display = 'block';
                }
                googleButton.disabled = false;
            }
        });
    }


    if (signupForm) {
        signupForm.addEventListener('submit', async event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            const name = document.getElementById('fullNameInput')?.value.trim();
            const email = document.getElementById('emailInput')?.value.trim();
            const password = document.getElementById('passwordInput')?.value;
            const errorMessage = document.getElementById('errorMessage');
            const submitButton = signupForm.querySelector('button[type="submit"]');

            const showSignupError = message => {
                if (errorMessage) {
                    errorMessage.textContent = message;
                    errorMessage.style.display = 'block';
                }
            };

            if (!name || !email || !password) {
                showSignupError('Please fill in your name, email, and password.');
                return;
            }
            if (password.length < 6) {
                showSignupError('Password must be at least 6 characters long.');
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="ri-loader-4-line ai-spin"></i> Creating account...';
            }

            try {
                const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
                await updateProfile(result.user, { displayName: name });
                sessionStorage.setItem('userEmail', result.user.email || email);
                sessionStorage.setItem('userName', name);
                window.location.href = 'student-dashboard.html';
            } catch (error) {
                const message = error.code === 'auth/email-already-in-use'
                    ? 'This email is already registered. Please go to the Login page.'
                    : error.code === 'auth/invalid-email'
                        ? 'Please enter a valid email address.'
                        : error.code === 'auth/weak-password'
                            ? 'Password must be at least 6 characters long.'
                            : 'Registration could not be completed. Please try again.';
                showSignupError(message);
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Sign Up <i class="ri-user-add-line"></i>';
                }
            }
        }, true);
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm && emailButton) {
        loginForm.addEventListener('submit', async event => {
            if (!document.getElementById('passwordSection') || document.getElementById('passwordSection').style.display === 'none') return;

            event.preventDefault();
            event.stopImmediatePropagation();

            const email = document.getElementById('emailInput')?.value.trim();
            const password = document.getElementById('passwordInput')?.value;
            const errorMessage = document.getElementById('errorMessage');

            if (!email || !password) {
                if (errorMessage) {
                    errorMessage.textContent = 'Please enter both your email address and password.';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            emailButton.disabled = true;
            emailButton.innerHTML = '<i class="ri-loader-4-line ai-spin"></i> Checking your account...';

            try {
                await signInWithEmail(email, password);
            } catch (error) {
                const messages = {
                    'auth/user-not-found': 'Account not found. Please check your email or sign up first.',
                    'auth/wrong-password': 'Incorrect password. Please try again.',
                    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
                    'auth/invalid-email': 'Please enter a valid email address.',
                    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.'
                };
                if (errorMessage) {
                    errorMessage.textContent = messages[error.code] || 'We could not sign you in. Please try again.';
                    errorMessage.style.display = 'block';
                }
                emailButton.disabled = false;
                emailButton.innerHTML = 'Login to Dashboard <i class="ri-login-circle-line"></i>';
            }
        }, true);
    }

    const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="./login.html"], a[href="/login.html"]');
    loginLinks.forEach(link => {
        if (loggedInUser) {
            link.setAttribute('href', 'student-dashboard.html');
            const label = link.querySelector('.btn-text') || link.querySelector('.tb-btn') || link.querySelector('.nav-cta');
            if (label && !label.dataset.originalText) {
                label.dataset.originalText = label.textContent.trim();
            }
            if (label) {
                label.textContent = 'Dashboard';
            } else {
                link.textContent = 'Dashboard';
            }
        } else {
            const label = link.querySelector('.btn-text');
            if (label && label.dataset.originalText) {
                label.textContent = label.dataset.originalText;
            }
        }
    });

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const spans = document.querySelectorAll('.menu-toggle span');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animate Hamburger
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
                navLinks.style.display = 'flex';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                navLinks.style.display = '';
            }
        });
    }

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                    navLinks.style.display = '';
                }

                const offset = 80; // Navbar height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update active link
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });

    // Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to all reveal elements
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });

    // ==========================================================================
    // 🤖 AI GURU PREMIUM CHATBOX CONTROLLER & INJECTION
    // ==========================================================================

        return; // Disable the AI chat section

    // 2. DOM Elements Selection
    const fab = document.getElementById('ai-guru-fab');
    const chatPanel = document.getElementById('ai-guru-chat-panel');
    const closeBtn = document.getElementById('ai-close-btn');
    const soundToggle = document.getElementById('ai-sound-toggle');
    const messagesBox = document.getElementById('ai-chat-messages');
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const suggestionsContainer = document.getElementById('ai-suggestions-container');
    const statusDot = document.getElementById('chat-status-dot');
    const statusText = document.getElementById('chat-status-text');

    // 3. Audio & UI State Management
    let isSoundMuted = localStorage.getItem('aiGuruMuted') === 'true';
    updateSoundIcon();

    // Web Audio Synthesizer
    function playSynthesizedSound(type) {
        if (isSoundMuted) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            if (type === 'open') {
                // Ascending double chime
                const now = ctx.currentTime;
                
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(523.25, now); // C5
                gain1.gain.setValueAtTime(0.08, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.12);
                
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
                gain2.gain.setValueAtTime(0.08, now + 0.08);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.08);
                osc2.stop(now + 0.28);
            } 
            else if (type === 'send') {
                // Brief frequency swoosh/click
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.07);
            }
            else if (type === 'receive') {
                // Warm notification double chime
                const now = ctx.currentTime;
                
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, now); // D5
                gain1.gain.setValueAtTime(0.08, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.15);
                
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880.00, now + 0.1); // A5
                gain2.gain.setValueAtTime(0.08, now + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.1);
                osc2.stop(now + 0.32);
            }
            else if (type === 'click') {
                // Ultra-short click/pop
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.03);
            }
        } catch (e) {
            console.warn('Web Audio synthesis failed or blocked by autoplay policy:', e);
        }
    }

    function updateSoundIcon() {
        if (isSoundMuted) {
            soundToggle.innerHTML = '<i class="ri-volume-mute-fill"></i>';
            soundToggle.title = 'Unmute Sounds';
        } else {
            soundToggle.innerHTML = '<i class="ri-volume-up-fill"></i>';
            soundToggle.title = 'Mute Sounds';
        }
    }

    function toggleSound(e) {
        e.stopPropagation();
        isSoundMuted = !isSoundMuted;
        localStorage.setItem('aiGuruMuted', isSoundMuted);
        updateSoundIcon();
        if (!isSoundMuted) {
            playSynthesizedSound('click');
        }
    }

    // Toggle Chat visibility
    function toggleChat() {
        const isActive = chatPanel.classList.toggle('active');
        if (isActive) {
            playSynthesizedSound('open');
            setTimeout(() => chatInput.focus(), 300);
        } else {
            playSynthesizedSound('click');
        }
    }

    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    soundToggle.addEventListener('click', toggleSound);

    // Dynamic Suggestion Click
    suggestionsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip');
        if (chip) {
            const queryText = chip.textContent;
            playSynthesizedSound('click');
            submitMessage(queryText);
        }
    });

    // Send controls
    sendBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) submitMessage(text);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = chatInput.value.trim();
            if (text) submitMessage(text);
        }
    });

    // Append Message to view
    function appendMessage(sender, text, isAIGenerated = false) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = `chat-msg-wrapper ${sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        // Support standard markdown bold elements, newlines
        let formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        bubble.innerHTML = formattedText;
        msgWrapper.appendChild(bubble);

        // Meta info
        const meta = document.createElement('div');
        meta.className = 'chat-msg-meta';
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        meta.innerHTML = `${sender === 'user' ? 'You' : 'AI Guru'} • ${timeStr}`;
        msgWrapper.appendChild(meta);

        // Feedback loop for AI responses
        if (sender === 'ai' && isAIGenerated) {
            const feedback = document.createElement('div');
            feedback.className = 'chat-feedback-row';
            feedback.innerHTML = `
                <button class="chat-feedback-btn thumbs-up" title="Helpful"><i class="ri-thumb-up-line"></i></button>
                <button class="chat-feedback-btn thumbs-down" title="Not Helpful"><i class="ri-thumb-down-line"></i></button>
            `;
            
            // Set up rating feedback micro-interactions
            feedback.addEventListener('click', (e) => {
                const btn = e.target.closest('.chat-feedback-btn');
                if (btn) {
                    playSynthesizedSound('click');
                    feedback.querySelectorAll('.chat-feedback-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    btn.style.transform = 'scale(1.2)';
                    setTimeout(() => btn.style.transform = 'none', 150);
                    // Disable row to prevent multiple changes
                    feedback.style.pointerEvents = 'none';
                    feedback.style.opacity = '0.7';
                }
            });
            msgWrapper.appendChild(feedback);
        }

        messagesBox.appendChild(msgWrapper);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    // Append Typing Indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-msg-wrapper ai typing-wrapper';
        indicator.innerHTML = `
            <div class="chat-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesBox.appendChild(indicator);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return indicator;
    }

    // Submit Message logic
    function submitMessage(text) {
        // Clear input
        chatInput.value = '';
        
        // Append user query
        appendMessage('user', text);
        playSynthesizedSound('send');
        
        // Render typing indicator
        const typingEl = showTypingIndicator();

        // Query the Smart Dual-Mode Fail-Safe Engine
        getChatResponse(text)
            .then(res => {
                // Remove indicator
                typingEl.remove();
                
                // Append AI reply
                appendMessage('ai', res.response, true);
                playSynthesizedSound('receive');
                
                // Update Suggestion Chips
                updateSuggestionChips(res.suggestions);
            })
            .catch(err => {
                console.error("Chat engine critical resolution error:", err);
                typingEl.remove();
                appendMessage('ai', "I apologize, but I am experiencing an internal routing hiccup. Please try again soon!");
            });
    }

    // Update suggestions chips helper
    function updateSuggestionChips(chips) {
        suggestionsContainer.innerHTML = '';
        if (chips && chips.length > 0) {
            chips.forEach(c => {
                const div = document.createElement('div');
                div.className = 'suggestion-chip';
                div.textContent = c;
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.style.display = 'flex';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }

    // Smart Dual-Mode Resolver: Server API with Offline Client-Side Fallback
    function getChatResponse(message) {
        return fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error status: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Restore online status badges if we were offline
            statusDot.style.background = '#10b981'; // Green
            statusDot.style.animation = 'statusPulse 1.8s ease-in-out infinite';
            statusText.textContent = 'Academic Assistant • Online';
            return data;
        })
        .catch(err => {
            // Fallback engaged!
            console.warn("🔔 Narayan e-Gurukul Fail-Safe Chatbox engaged! Switching to Local Matching Engine.", err);
            
            // Switch UI dot to amber/orange pulsing indicator to show offline-fail-safe mode!
            statusDot.style.background = '#f59e0b'; // Amber
            statusDot.style.animation = 'statusPulse 1.2s ease-in-out infinite';
            statusText.textContent = 'Academic Assistant • Fail-Safe Mode';
            
            return new Promise((resolve) => {
                // Simulate network delay for realistic visual typing states
                setTimeout(() => {
                    const localResult = getLocalChatResponse(message);
                    resolve(localResult);
                }, 800);
            });
        });
    }

    // Fail-Safe Offline Client-Side Matcher
    function getLocalChatResponse(message) {
        const query = message.toLowerCase().trim();
        let reply = "";
        let suggestions = [];

        if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('greetings')) {
            reply = "Hello there! I am **AI Guru** (Fail-Safe Local Mode active). 🎓 I am running directly in your browser because our backend server is temporarily resting. I can still answer all your queries about study materials, pre-school, and timelines!";
            suggestions = ["Explore Study Material", "Ask About JEE Prep", "Sanfort Pre-School Inquiry", "Tell me about AIML"];
        } 
        else if (query.includes('launch') || query.includes('when') || query.includes('date') || query.includes('toolkit') || query.includes('august')) {
            reply = "New study material and learning paths are coming soon! 🚀 You can join our notification list in the 'Stay Updated' section or use the contact form to stay informed.";
            suggestions = ["How to join notification list?", "Explore Study Material", "Tell me about AIML"];
        }
        else if (query.includes('waitlist') || query.includes('join') || query.includes('sign up') || query.includes('notify')) {
            reply = "To join our priority notification list, scroll to the bottom of the page and submit your email in the **'Stay Updated'** box, or use the homepage contact form. We'll alert you when new material is available.";
            suggestions = ["Explore Study Material", "What study notes do you have?"];
        }
        else if (query.includes('material') || query.includes('note') || query.includes('pyq') || query.includes('book') || query.includes('study') || query.includes('paper') || query.includes('viva')) {
            reply = "We offer **100% Free** academic resources including high-quality hand-written notes, solved Previous Year Questions (PYQs), viva banks, and visual maps to help you score higher in your exams.";
            suggestions = ["Explore Our Batches", "Download Mobile App", "Ask About JEE Prep"];
        }
        else if (query.includes('batch') || query.includes('course') || query.includes('branch') || query.includes('specialization') || query.includes('computer science') || query.includes('skills')) {
            reply = "We offer focused study tracks for JEE, NEET, school competitions, and computer science skills. Explore the 'Our Batch' page or contact us for guidance on the best resources.";
            suggestions = ["Tell me about JEE prep", "Tell me about NEET prep", "Explore Our Batches"];
        }
        else if (query.includes('school') || query.includes('preschool') || query.includes('sanfort') || query.includes('admission') || query.includes('franchise') || query.includes('child') || query.includes('inquiry')) {
            reply = "We host pre-school admissions and inquiries for **Sanfort Pre-School (Hanumangarh)**! 🏫 When the server is online, forms on the 'My School' page sync straight to SQLite. Right now, because we're offline, our system auto-saves inquiry submissions to your **Browser LocalStorage Cache** so you never lose data!";
            suggestions = ["How does SQLite database work?", "View Admin Dashboard"];
        }
        else if (query.includes('database') || query.includes('sqlite') || query.includes('json') || query.includes('fail-safe') || query.includes('dashboard') || query.includes('admin')) {
            reply = "Narayan e-Gurukul operates a multi-layered DB hierarchy: Primary SQLite, Secondary JSON, and Tertiary Browser LocalStorage backup. When the backend is offline, forms seamlessly switch to browser cache storage. Truly indestructible design!";
            suggestions = ["Submit a Test Inquiry", "How to contact support?"];
        }
        else if (query.includes('app') || query.includes('download') || query.includes('android') || query.includes('ios') || query.includes('mobile') || query.includes('play store')) {
            reply = "Our customized **Narayan e-Gurukul Mobile App** is coming soon to the Google Play Store and iOS App Store. Access offline lectures, notes, and interactive test series directly from your phone!";
            suggestions = ["Ask About JEE Prep", "How to contact support?"];
        }
        else if (query.includes('contact') || query.includes('support') || query.includes('email') || query.includes('address') || query.includes('location') || query.includes('help')) {
            reply = "Connect with us anytime: \n\n" +
                    "📧 **Email:** nishant.sanfort@gmail.com\n" +
                    "📍 **Location:** Hanumangarh, Rajasthan (335512)\n\n" +
                    "Or use the Contact Form on the Home page to draft a message!";
            suggestions = ["Go to Contact Form", "Explore Study Material"];
        }
        else if (query.includes('author') || query.includes('creator') || query.includes('developer') || query.includes('built') || query.includes('nishant')) {
            reply = "This portal was fully designed and built by **Nishant Saini**! 💻 It combines clean Outfit modern typography, high-performance node server backends, and modular responsive grids.";
            suggestions = ["Send message to Nishant", "Tell me more about the mission"];
        }
        else if (query.includes('thank') || query.includes('thanks') || query.includes('awesome') || query.includes('great')) {
            reply = "Anytime! 👍 I am glad I could assist in offline fail-safe mode. Let me know if you have other questions about Narayan e-Gurukul!";
            suggestions = ["Explore Study Materials", "Go to homepage"];
        }
        else {
            reply = "That's an interesting inquiry! 💡 As **AI Guru** in local offline mode, I recommend checking out our study resources for JEE, NEET, and school competitions. Let me know what else I can cover!";
            suggestions = ["Explore Study Material", "Ask About JEE Prep", "Sanfort Pre-School Admission", "How to contact support?"];
        }

        return {
            response: reply,
            suggestions: suggestions
        };
    }
});

