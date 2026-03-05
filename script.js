document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // CUSTOMIZATION SECTION
    // ==========================================
    const MY_MOOD = "Regret. Guilt. Disappointment.";
    const TIKTOK_FOLLOWERS_COUNT = 47659; // Type your numbers here
    const TIKTOK_LIKES_COUNT = 7700000;
    const TIKTOK_VIDEOS_COUNT = 369;

    // ==========================================
    // FIREBASE INITIALIZATION & CONFIG
    // ==========================================
    const firebaseConfig = {
        apiKey: "AIzaSyDZqmGt7fJf_sbP6J3iXQXH9PLDSFj_ZJU",
        authDomain: "portfolio-89aac.firebaseapp.com",
        projectId: "portfolio-89aac",
        storageBucket: "portfolio-89aac.firebasestorage.app",
        messagingSenderId: "67486466015",
        appId: "1:67486466015:web:cfe56106758741e4210e6a",
        measurementId: "G-RJSH0B1NKS"
    };

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // Session flags to prevent spamming
    const sessionFlags = {
        profileHovered: false,
        socialHovered: false,
        pcHovered: false
    };

    // Use a bullet point (•) to separate spec items
    const PC_SPECS_TEXT = "• RTX 4070 • INTEL CORE i9-14900K • 32GB DDR5 RAM • 2TB NVME SSD • LIQUID COOLING • 900W PSU";
    // ==========================================

    // --- LOAD CUSTOM THEME ---
    const savedTheme = localStorage.getItem('custom-theme');
    if (savedTheme) {
        const themeVars = JSON.parse(savedTheme);
        for (const [key, value] of Object.entries(themeVars)) {
            document.documentElement.style.setProperty(key, value);
        }
    }

    // --- 1. ENTRY SCREEN LOGIC ---
    const enterScreen = document.getElementById('enter-screen');
    const enterBtn = document.getElementById('enter-btn');
    const optimizeBtn = document.getElementById('optimize-btn'); // Optimize Trigger
    const bgMusic = document.getElementById('bg-music');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const loadingText = document.getElementById('loading-text');
    const visualizerCanvas = document.getElementById('music-visualizer');

    // Quote Setup
    const dailyQuoteEl = document.getElementById('daily-quote');
    const quoteContainer = document.querySelector('.quote-container');
    if (dailyQuoteEl) {
        dailyQuoteEl.setAttribute('data-text', MY_MOOD);
        dailyQuoteEl.textContent = ''; // Clear for typing effect
    }

    // --- GLOBAL SELECTORS & STATE ---
    const bentoItems = document.querySelectorAll('.bento-item');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
    let isOptimized = false; // Add state tracker

    // Audio Visualizer Variables
    let audioCtx;
    let analyser;
    let gainNode;
    let source;
    let dataArray;

    // Typewriter Utility
    async function typeText(element, text, speed = 40) {
        element.textContent = '';
        element.classList.add('typing-active');
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        element.classList.remove('typing-active');
    }

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', () => {
            isOptimized = !isOptimized;
            if (isOptimized) {
                optimizeBtn.textContent = '[ OPTIMIZE : ON ]';
                optimizeBtn.classList.add('active');
            } else {
                optimizeBtn.textContent = '[ OPTIMIZE : OFF ]';
                optimizeBtn.classList.remove('active');
            }
        });
    }

    const hasEnteredSession = sessionStorage.getItem('joao_site_entered');

    if (hasEnteredSession && enterScreen) {
        // Skip enter screen completely
        enterScreen.style.display = 'none';
        document.body.classList.remove('loading');

        // Fast animate-in
        bentoItems.forEach((item) => {
            item.classList.add('animate-in');
            const textEls = item.querySelectorAll('h1, h2, h3, p, .icon, span:not(.no-type)');
            textEls.forEach(el => {
                const originalText = el.getAttribute('data-text') || el.textContent;
                el.textContent = originalText;
            });
        });
        if (quoteContainer) {
            quoteContainer.classList.add('animate-in');
            if (dailyQuoteEl) dailyQuoteEl.textContent = MY_MOOD;
        }
        if (window.setupVisualizer) window.setupVisualizer();

        if (bgMusic) {
            bgMusic.volume = 0.8;
            bgMusic.muted = sessionStorage.getItem('joao_audio_muted') === 'true';
            // Attempt to play, caught lightly if autoplay policy blocks since there was no interaction on THIS page yet
            bgMusic.play().catch(() => { console.log('Autoplay prevented by browser.'); });
        }
    } else if (enterBtn && enterScreen) {
        enterBtn.addEventListener('click', () => {
            // Hide the buttons
            enterBtn.style.display = 'none';
            if (optimizeBtn) optimizeBtn.style.display = 'none';

            // Show loading text and progress bar
            if (loadingText) {
                loadingText.textContent = 'LOADING';
                loadingText.setAttribute('data-text', 'LOADING');
            }
            if (progressContainer) {
                progressContainer.style.display = 'block';
                void progressContainer.offsetWidth; // trigger reflow
                progressContainer.style.opacity = '1';
            }

            // Play Audio early so it loads during the fake loading bar
            if (bgMusic) {
                // Initialize AudioContext
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    analyser = audioCtx.createAnalyser();
                    gainNode = audioCtx.createGain(); // For cleaner hardware volume control

                    source = audioCtx.createMediaElementSource(bgMusic);

                    // Route: source -> analyser -> gainNode -> destination
                    source.connect(analyser);
                    analyser.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    // Mobile optimization: lower FFT size for less CPU strain
                    const isMobile = window.innerWidth <= 768;
                    analyser.fftSize = isMobile ? 128 : 256;
                    analyser.smoothingTimeConstant = 0.85;

                    gainNode.gain.value = 0.8; // Set default gain louder

                    const bufferLength = analyser.frequencyBinCount;
                    dataArray = new Uint8Array(bufferLength);

                }

                bgMusic.volume = 0.8; // Set default volume louder
                bgMusic.play().then(() => {
                    // Update the bento box icon to show it is playing
                    const playIcon = document.getElementById('play-icon');
                    const pauseIcon = document.getElementById('pause-icon');
                    if (playIcon && pauseIcon) {
                        playIcon.style.display = 'none';
                        pauseIcon.style.display = 'block';
                    }
                }).catch(e => console.log("Audio play failed, user may need to interact more:", e));
            }

            // Fake loading sequence (fast but smooth, ~1.2 seconds total)
            let progress = 0;
            const loadInterval = setInterval(() => {
                progress += Math.random() * 20 + 5; // Fast chunks
                if (progress > 100) progress = 100;

                if (progressBar) progressBar.style.width = `${progress}%`;

                if (progress === 100) {
                    clearInterval(loadInterval);

                    if (loadingText) {
                        loadingText.textContent = 'Website ready';
                        loadingText.setAttribute('data-text', 'Website ready');
                    }

                    setTimeout(() => {
                        // Enter the site
                        enterScreen.classList.add('hidden');
                        document.body.classList.remove('loading');

                        // Apply Performance Optimizations
                        if (isOptimized) {
                            document.body.classList.add('optimized-mode');
                        }

                        // Animate Quote Container First
                        if (quoteContainer) {
                            quoteContainer.classList.add('animate-in');
                            setTimeout(() => {
                                if (dailyQuoteEl) typeText(dailyQuoteEl, MY_MOOD);
                            }, 300);
                        }

                        // --- START ADVANCED BOOT SEQUENCE ---
                        bentoItems.forEach((item, index) => {
                            // Staggered Entrance
                            setTimeout(() => {
                                item.classList.add('animate-in');

                                // Start Typewriter for specific elements inside
                                const textEls = item.querySelectorAll('h1, h2, h3, p, .icon, span:not(.no-type)');
                                textEls.forEach(el => {
                                    const originalText = el.getAttribute('data-text') || el.textContent;
                                    if (!el.getAttribute('data-text')) el.setAttribute('data-text', originalText);
                                    el.textContent = ''; // Clear for typing

                                    setTimeout(() => {
                                        typeText(el, originalText);
                                    }, 400); // Wait for card to settle slightly
                                });
                            }, index * 80); // 80ms stagger
                        });

                        // Start Bottom Visualizer
                        if (window.setupVisualizer) window.setupVisualizer();
                    }, 400); // small pause at 100% before entering
                }
            }, 100); // update every 100ms

            // Mark session as entered
            sessionStorage.setItem('joao_site_entered', 'true');
        });
    }

    // --- AUDIO MUTE BUTTON LOGIC ---
    const audioBtn = document.getElementById('nav-audio-btn');
    if (audioBtn && bgMusic) {
        // Restore state
        const isMuted = sessionStorage.getItem('joao_audio_muted') === 'true';
        bgMusic.muted = isMuted;

        const updateAudioIcon = () => {
            if (bgMusic.muted) {
                audioBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
            } else {
                audioBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
            }
        };
        updateAudioIcon();

        audioBtn.addEventListener('click', () => {
            bgMusic.muted = !bgMusic.muted;
            sessionStorage.setItem('joao_audio_muted', bgMusic.muted);
            updateAudioIcon();

            if (!bgMusic.muted && bgMusic.paused) {
                bgMusic.play().catch(() => { });
            }
        });
    }

    // --- SUPPORT MODAL LOGIC ---
    const supportBtn = document.getElementById('nav-support-btn');
    const supportModal = document.getElementById('support-modal');
    const closeSupportBtn = document.getElementById('close-support');
    const sendSupportBtn = document.getElementById('send-support');

    if (supportBtn && supportModal) {
        supportBtn.addEventListener('click', () => {
            supportModal.classList.remove('hidden');
        });
    }

    if (closeSupportBtn && supportModal) {
        closeSupportBtn.addEventListener('click', () => {
            supportModal.classList.add('hidden');
        });
    }

    if (sendSupportBtn) {
        sendSupportBtn.addEventListener('click', () => {
            const email = document.getElementById('support-email').value;
            const message = document.getElementById('support-message').value;
            if (!message) return; // Simple validation

            const subject = encodeURIComponent("Support Request");
            const body = encodeURIComponent(`From: ${email}\n\nMessage:\n${message}`);
            window.location.href = `mailto:joaofilmss33@gmail.com?subject=${subject}&body=${body}`;

            supportModal.classList.add('hidden');
            document.getElementById('support-message').value = '';
            document.getElementById('support-email').value = '';
        });
    }

    const cursor = document.getElementById('cursor');
    const cursorShape = document.getElementById('cursor-shape');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Movement tracking for velocity rotation
    let lastX = mouseX;
    let lastY = mouseY;
    let currentAngle = 0;

    document.addEventListener('mousemove', (e) => {
        if (isTouchDevice) return;
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Follow perfectly
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    function animateCursor() {
        // --- CURSOR ROTATION ---
        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const velocity = Math.sqrt(dx * dx + dy * dy);

        if (velocity > 1) {
            const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            let diff = targetAngle - currentAngle;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            currentAngle += diff * 0.2;
        }
        cursor.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;

        lastX = mouseX;
        lastY = mouseY;
        requestAnimationFrame(animateCursor);
    }
    if (!isTouchDevice) {
        animateCursor();
    }

    if (!isTouchDevice) {
        // Hover states for cursor morphing
        const interactables = document.querySelectorAll('.interactable, .bento-item');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hovering');
            });
        });

        // --- Q&A SIDEBAR LOGIC ---
        const qaTrigger = document.getElementById('qa-trigger');
        const qaSidebar = document.getElementById('qa-sidebar');
        let qaHoverTimeout;

        if (qaTrigger && qaSidebar) {
            const openSidebar = () => {
                clearTimeout(qaHoverTimeout);
                qaSidebar.classList.add('active');
            };

            const closeSidebar = () => {
                qaHoverTimeout = setTimeout(() => {
                    qaSidebar.classList.remove('active');
                }, 300); // Small delay to allow moving mouse to sidebar
            };

            qaTrigger.addEventListener('mouseenter', openSidebar);
            qaTrigger.addEventListener('mouseleave', closeSidebar);

            qaSidebar.addEventListener('mouseenter', openSidebar);
            qaSidebar.addEventListener('mouseleave', closeSidebar);
        }

        // --- SETTINGS SIDEBAR LOGIC ---
        const settingsTrigger = document.getElementById('settings-trigger');
        const settingsSidebar = document.getElementById('settings-sidebar');
        let settingsHoverTimeout;

        if (settingsTrigger && settingsSidebar) {
            const openSettings = () => {
                clearTimeout(settingsHoverTimeout);
                settingsSidebar.classList.add('active');
            };

            const closeSettings = () => {
                settingsHoverTimeout = setTimeout(() => {
                    settingsSidebar.classList.remove('active');
                }, 300);
            };

            settingsTrigger.addEventListener('mouseenter', openSettings);
            settingsTrigger.addEventListener('mouseleave', closeSettings);

            settingsSidebar.addEventListener('mouseenter', openSettings);
            settingsSidebar.addEventListener('mouseleave', closeSettings);
        }

    }

    // --- 4. 3D TILT INTERACTION ---
    if (!isTouchDevice) {
        bentoItems.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Calculate rotation (max 15 degrees)
                const rotateX = ((y - centerY) / centerY) * -15;
                const rotateY = ((x - centerX) / centerX) * 15;

                item.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
            });
        });
    }

    // --- 5. BENTO WIDGETS LOGIC ---

    // View Count
    const viewCountEl = document.getElementById('view-count');
    if (viewCountEl) {
        // Switching to counterapi.dev which is currently more stable than countapi.xyz
        fetch('https://api.counterapi.dev/v1/joao-portfolio-unique/views/up')
            .then(res => res.json())
            .then(data => {
                if (data.count !== undefined) {
                    viewCountEl.textContent = data.count;
                }
            })
            .catch(err => {
                console.error("View count error", err);
                viewCountEl.textContent = "Offline";
            });
    }

    const musicToggleBtn = document.getElementById('music-toggle');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const audioProgress = document.getElementById('audio-progress');
    const audioCurrentTime = document.getElementById('audio-current-time');
    const audioDuration = document.getElementById('audio-duration');

    // Helper to format seconds to M:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (musicToggleBtn && bgMusic) {
        bgMusic.addEventListener('loadedmetadata', () => {
            if (audioDuration) audioDuration.textContent = formatTime(bgMusic.duration);
        });

        bgMusic.addEventListener('timeupdate', () => {
            if (audioProgress && audioCurrentTime) {
                const percent = (bgMusic.currentTime / bgMusic.duration) * 100;
                audioProgress.value = percent || 0;
                audioCurrentTime.textContent = formatTime(bgMusic.currentTime);
            }
            if (audioDuration && bgMusic.duration) {
                audioDuration.textContent = formatTime(bgMusic.duration);
            }
        });

        if (audioProgress) {
            audioProgress.addEventListener('input', (e) => {
                const seekTime = (e.target.value / 100) * bgMusic.duration;
                bgMusic.currentTime = seekTime;
            });
        }

        musicToggleBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                bgMusic.play().catch(e => console.log("Audio play failed:", e));
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                bgMusic.pause();
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        });

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = e.target.value / 100;
                if (gainNode) {
                    gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
                } else {
                    bgMusic.volume = vol;
                }
            });
        }
    }

    // Lanyard API
    const LANYARD_USER_ID = '1303100870988271828';
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const customStatus = document.getElementById('custom-status');
    const discordAvatar = document.getElementById('discord-avatar');
    const spotifySong = document.getElementById('spotify-song');
    const spotifyArtist = document.getElementById('spotify-artist');
    let spotifyInterval;

    function connectLanyard() {
        const ws = new WebSocket('wss://api.lanyard.rest/socket');

        ws.onopen = () => {
            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: LANYARD_USER_ID }
            }));
        };

        ws.onmessage = (event) => {
            const { t, d } = JSON.parse(event.data);
            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
                updateLanyardData(d);
            }
        };

        ws.onclose = () => {
            setTimeout(connectLanyard, 5000);
        };
    }

    function updateSpotifyProgress(start, end) {
        if (spotifyInterval) clearInterval(spotifyInterval);

        const progressBar = document.getElementById('spotify-progress-bar');
        const progressContainer = document.getElementById('spotify-progress-container');
        if (!progressBar || !progressContainer) return;

        progressContainer.style.display = 'block';

        function update() {
            const now = Date.now();
            const total = end - start;
            const current = now - start;
            const progress = Math.min(Math.max((current / total) * 100, 0), 100);

            progressBar.style.width = `${progress}%`;

            if (now >= end) {
                clearInterval(spotifyInterval);
            }
        }

        update();
        spotifyInterval = setInterval(update, 1000);
    }

    function updateLanyardData(data) {
        const status = data.discord_status;

        if (data.discord_user) {
            const avatar = data.discord_user.avatar;
            const ext = avatar && avatar.startsWith('a_') ? 'gif' : 'png';
            const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${avatar}.${ext}?size=128`;

            if (discordAvatar) {
                discordAvatar.src = avatarUrl;
                discordAvatar.style.display = 'block';
            }

            const favicon = document.getElementById('favicon');
            if (favicon) {
                favicon.href = avatarUrl;
            }
        }

        if (statusDot && statusText) {
            statusDot.className = `status-indicator ${status}`;
            const displayStatus = status === 'dnd' ? 'Do Not Disturb' : status.charAt(0).toUpperCase() + status.slice(1);
            statusText.textContent = displayStatus;
        }

        if (customStatus) {
            let rpcText = '';
            if (data.activities && data.activities.length > 0) {
                const rpcAct = data.activities.find(act => act.type !== 4 && act.name !== 'Spotify');
                if (rpcAct) {
                    let typeStr = 'Playing';
                    if (rpcAct.type === 2) typeStr = 'Listening to';
                    if (rpcAct.type === 3) typeStr = 'Watching';
                    rpcText = `${typeStr} ${rpcAct.name}`;
                    if (rpcAct.details) rpcText += ` - ${rpcAct.details}`;
                }
            }
            customStatus.textContent = rpcText;
        }

        const spotifyAlbumArt = document.getElementById('spotify-album-art');
        const albumArtContainer = document.getElementById('album-art-container');

        if (data.spotify && data.listening_to_spotify) {
            if (spotifySong && spotifyArtist) {
                spotifySong.textContent = data.spotify.song;
                spotifyArtist.textContent = data.spotify.artist;
            }
            if (spotifyAlbumArt && albumArtContainer) {
                spotifyAlbumArt.src = data.spotify.album_art_url;
                albumArtContainer.style.display = 'block';
            }
            if (data.spotify.timestamps) {
                updateSpotifyProgress(data.spotify.timestamps.start, data.spotify.timestamps.end);
            }
        } else {
            if (spotifySong && spotifyArtist) {
                spotifySong.textContent = 'Not playing';
                spotifyArtist.textContent = '-';
            }
            if (albumArtContainer) {
                albumArtContainer.style.display = 'none';
            }
            if (spotifyInterval) clearInterval(spotifyInterval);
            const progressContainer = document.getElementById('spotify-progress-container');
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }

    connectLanyard();

    // Theme Toggler
    const themeToggler = document.getElementById('theme-toggler');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    if (themeToggler) {
        themeToggler.classList.add('interactable');

        themeToggler.addEventListener('click', () => {
            document.body.classList.add('glitch-active');
            setTimeout(() => {
                document.body.classList.remove('glitch-active');
            }, 400);

            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');

            if (isLight) {
                themeIconMoon.style.display = 'none';
                themeIconSun.style.display = 'block';
            } else {
                themeIconMoon.style.display = 'block';
                themeIconSun.style.display = 'none';
            }
        });
    }

    // Live Clock Widget
    const clockDate = document.getElementById('clock-date');
    const clockTime = document.getElementById('clock-time');

    function updateClock() {
        if (!clockTime) return;
        const now = new Date();
        clockDate.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        clockTime.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Weather Widget
    const weatherTemp = document.getElementById('weather-temp');
    const weatherDesc = document.getElementById('weather-desc');

    if (weatherTemp) {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5085&longitude=-0.1257&current_weather=true')
            .then(res => res.json())
            .then(data => {
                const weather = data.current_weather;
                weatherTemp.textContent = `${Math.round(weather.temperature)}°C`;
                weatherDesc.textContent = `Wind: ${weather.windspeed} km/h`;
            })
            .catch(err => {
                console.error("Weather error", err);
                weatherTemp.textContent = "--°C";
                weatherDesc.textContent = "Error fetching";
            });
    }

    // GitHub Commits Widget
    const commitMsg = document.getElementById('commit-message');
    const commitRepo = document.getElementById('commit-repo');

    if (commitMsg) {
        fetch('https://api.github.com/users/joaoswu/events')
            .then(res => res.json())
            .then(data => {
                const pushEvent = data.find(event => event.type === 'PushEvent');
                if (pushEvent && pushEvent.payload.commits && pushEvent.payload.commits.length > 0) {
                    commitMsg.textContent = pushEvent.payload.commits[0].message;
                    commitRepo.textContent = pushEvent.repo.name;
                } else {
                    commitMsg.textContent = "No recent pushes";
                    commitRepo.textContent = "";
                }
            })
            .catch(err => {
                console.error("GitHub error", err);
                commitMsg.textContent = "Rate limited or Error";
                commitRepo.textContent = "";
            });
    }

    // --- Q&A WEBHOOK LOGIC ---
    const qaForm = document.getElementById('qa-form');
    const qaStatus = document.getElementById('qa-status');
    const qaSubmitBtn = document.getElementById('qa-submit');

    // Configured Webhook
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1478894660360470682/H4Am2jgJwl6ADaJcERG2WbpnZKbWdGmAhobrBCGEdIsu29bsExDRQIrs6wEXM0XToCa2';

    if (qaForm) {
        qaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (qaSubmitBtn.disabled) return;

            const nameValue = document.getElementById('qa-name').value.trim() || 'Anonymous';
            const questionValue = document.getElementById('qa-question').value.trim();

            if (!questionValue) return;

            qaSubmitBtn.disabled = true;
            qaSubmitBtn.textContent = 'Sending...';
            qaStatus.textContent = '';
            qaStatus.className = 'qa-status';

            const payload = {
                embeds: [{
                    color: 0x43b581, // Discord Green
                    title: "New Anonymous Question!",
                    fields: [
                        {
                            name: "Question:",
                            value: questionValue,
                            inline: false
                        },
                        {
                            name: "Username ( optional ):",
                            value: nameValue,
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            try {
                const response = await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    qaStatus.textContent = "Message sent successfully! \u2713";
                    qaStatus.classList.add('success');
                    qaForm.reset();
                } else {
                    throw new Error('Network response was not ok');
                }
            } catch (error) {
                console.error('Webhook Error:', error);
                qaStatus.textContent = "Failed to send message. Please try again.";
                qaStatus.classList.add('error');
            } finally {
                qaSubmitBtn.disabled = false;
                qaSubmitBtn.textContent = 'Send Message';

                // Clear status after 5 seconds
                setTimeout(() => {
                    qaStatus.textContent = '';
                    qaStatus.className = 'qa-status';
                }, 5000);
            }
        });
    }

    // Network Canvas
    const canvas = document.getElementById('network-canvas');
    const ctx_net = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 1.5 + 0.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }
        }

        draw() {
            ctx_net.beginPath();
            ctx_net.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx_net.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx_net.fill();
        }
    }

    const particleCount = (canvas.width * canvas.height) / 15000;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateNetwork() {
        if (isOptimized) return; // KILLSWITCH for particles
        ctx_net.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => p.update());
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx_net.beginPath();
                    const opacity = 1 - (dist / 120);
                    ctx_net.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
                    ctx_net.lineWidth = 0.8;
                    ctx_net.moveTo(particles[i].x, particles[i].y);
                    ctx_net.lineTo(particles[j].x, particles[j].y);
                    ctx_net.stroke();
                }
            }
        }
        particles.forEach(p => p.draw());
        requestAnimationFrame(animateNetwork);
    }
    animateNetwork();

    // WakaTime Stats
    const wakatimeStats = document.getElementById('wakatime-stats');
    if (wakatimeStats) {
        const wakaUrl = 'https://wakatime.com/@8fc5d29f-f747-4ff0-9166-2ab64ebd2a6f';
        renderDummyWakatime(); // Initial render with dummy data while we wait/try fetch
    }

    function renderWakatime(languages) {
        if (!wakatimeStats) return;
        wakatimeStats.innerHTML = '';
        const topLangs = languages.slice(0, 3);
        topLangs.forEach(lang => {
            const row = document.createElement('div');
            row.className = 'waka-lang-row';
            row.innerHTML = `
                <div class="waka-lang-info">
                    <span>${lang.name}</span>
                    <span>${lang.percent.toFixed(1)}%</span>
                </div>
                <div class="waka-bar-container">
                    <div class="waka-bar-fill" style="width: 0%; background: ${lang.color || 'var(--text-primary)'}"></div>
                </div>
            `;
            wakatimeStats.appendChild(row);
            setTimeout(() => {
                const fill = row.querySelector('.waka-bar-fill');
                if (fill) fill.style.width = `${lang.percent}%`;
            }, 100);
        });
    }

    function renderDummyWakatime() {
        renderWakatime([
            { name: "JavaScript", percent: 45.2, color: "#f1e05a" },
            { name: "HTML/CSS", percent: 30.8, color: "#e34c26" },
            { name: "Python", percent: 24.0, color: "#3572A5" }
        ]);
    }

    // --- 7. BOTTOM AUDIO VISUALIZER ---
    function setupVisualizer() {
        if (isOptimized) return; // KILLSWITCH for Audio Visualizer Loop

        const visualizerCanvas = document.getElementById('music-visualizer');
        if (!visualizerCanvas || !bgMusic || window.audioVisualizerInitialized) return;

        const visualizerCtx = visualizerCanvas.getContext('2d');
        window.audioVisualizerInitialized = true;

        function resizeVisualizer() {
            visualizerCanvas.width = window.innerWidth;
            visualizerCanvas.height = 150;
        }
        window.addEventListener('resize', resizeVisualizer);
        resizeVisualizer();

        // AudioContext is already initialized in the enter logic
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaElementSource(bgMusic);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
        }

        // Density refinement: 1024 on PC for many bars, 256 on mobile for stability
        analyser.fftSize = !isTouchDevice ? 1024 : 256;
        const bufferLength = analyser.frequencyBinCount;
        const visualizerDataArray = new Uint8Array(bufferLength);

        function drawVisualizer() {
            requestAnimationFrame(drawVisualizer);
            if (bgMusic.paused) {
                visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
                return;
            }

            analyser.getByteFrequencyData(visualizerDataArray);
            visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

            const barWidth = (visualizerCanvas.width / bufferLength) * (!isTouchDevice ? 1.5 : 2.5);
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                // Height refinement: Reach higher on PC (/1.4 vs /2)
                barHeight = !isTouchDevice ? (visualizerDataArray[i] / 1.4) : (visualizerDataArray[i] / 2);
                const isLightMode = document.body.classList.contains('light-mode');

                if (!isTouchDevice) {
                    // Enhanced PC Rendering: Gradients and Glow
                    const gradient = visualizerCtx.createLinearGradient(0, visualizerCanvas.height, 0, visualizerCanvas.height - barHeight);
                    if (isLightMode) {
                        gradient.addColorStop(0, `rgba(0, 0, 0, 0.6)`);
                        gradient.addColorStop(1, `rgba(0, 0, 0, 0.05)`);
                    } else {
                        gradient.addColorStop(0, `rgba(255, 255, 255, 0.5)`);
                        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                    }
                    visualizerCtx.fillStyle = gradient;
                    // Add subtle glow on PC
                    visualizerCtx.shadowBlur = 10;
                    visualizerCtx.shadowColor = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                } else {
                    // Standard Mobile Rendering: Solid but dynamic
                    visualizerCtx.fillStyle = isLightMode ? `rgba(0, 0, 0, ${barHeight / 150})` : `rgba(255, 255, 255, ${barHeight / 150})`;
                    visualizerCtx.shadowBlur = 0;
                }

                visualizerCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2;
            }
        }
        drawVisualizer();
    }
    window.setupVisualizer = setupVisualizer;

    // Tab Title Animation
    const titleText = "> joao.sw";
    let titleIndex = 0;
    let titleIsDeleting = false;

    function animateTitle() {
        const currentText = titleText.substring(0, titleIndex);
        const cursorChar = (titleIndex < titleText.length && !titleIsDeleting) ? "_" : "";
        document.title = currentText + cursorChar;

        let typeSpeed = titleIsDeleting ? 100 : 250;
        if (!titleIsDeleting && titleIndex === titleText.length) {
            typeSpeed = 3000;
            titleIsDeleting = true;
        } else if (titleIsDeleting && titleIndex === 0) {
            titleIsDeleting = false;
            typeSpeed = 500;
        } else {
            if (titleIsDeleting) titleIndex--;
            else titleIndex++;
        }
        setTimeout(animateTitle, typeSpeed);
    }
    animateTitle();

    // --- 7. TIKTOK LIVE STATS SCRAPING (CORS PROXY) ---
    const tiktokSection = document.getElementById('tiktok-section');
    const tiktokFollowersEl = document.getElementById('tiktok-followers');
    const tiktokLikesEl = document.getElementById('tiktok-likes');
    const tiktokVideosEl = document.getElementById('tiktok-videos');
    let hasAnimatedTikTok = false;

    function animateTikTokCounter(el, target) {
        if (!el || isNaN(target)) return;
        let current = 0;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        const intervalTime = duration / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            if (current >= 1000000) {
                el.textContent = (current / 1000000).toFixed(1) + 'M';
            } else if (current >= 1000) {
                el.textContent = (current / 1000).toFixed(1) + 'K';
            } else {
                el.textContent = Math.floor(current).toLocaleString();
            }
        }, intervalTime);
    }

    if (tiktokSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled-in');
                    if (!hasAnimatedTikTok) {
                        hasAnimatedTikTok = true;
                        animateTikTokCounter(tiktokFollowersEl, TIKTOK_FOLLOWERS_COUNT);
                        animateTikTokCounter(tiktokLikesEl, TIKTOK_LIKES_COUNT);
                        animateTikTokCounter(tiktokVideosEl, TIKTOK_VIDEOS_COUNT);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(tiktokSection);
    }

    // --- 8. CURSOR GRAVEYARD (FIREBASE LIVE STATS) ---
    const graveyardSection = document.getElementById('graveyard-section');
    const elPageVisits = document.getElementById('stats-page-visits');
    const elProfileHovers = document.getElementById('stats-profile-hovers');
    const elSocialHovers = document.getElementById('stats-social-hovers');
    const elDiscordClicks = document.getElementById('stats-discord-clicks');
    const elPcHovers = document.getElementById('stats-pc-hovers');
    let hasAnimatedGraveyard = false;

    // Helper: Safely increment a counter in Firebase
    function incrementStat(statName) {
        const ref = db.ref('stats/' + statName);
        ref.transaction((currentValue) => {
            return (currentValue || 0) + 1;
        });
    }

    // 1. EVENT LISTENERS FOR INCREMENTS
    // Page visit - increment on load
    incrementStat('page_visits');

    // Profile hovers
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.addEventListener('mouseenter', () => {
            if (!sessionFlags.profileHovered) {
                sessionFlags.profileHovered = true;
                incrementStat('profile_hovers');
            }
        });
    }

    // Social hovers
    const socialLinks = document.querySelectorAll('.social-links a');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (!sessionFlags.socialHovered) {
                sessionFlags.socialHovered = true;
                incrementStat('social_hovers');
            }
        });
    });

    // Discord Clicks
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.href && target.href.includes('discord')) {
            incrementStat('discord_clicks');
        }
    });

    // PC Hovers
    const specsSectionEl = document.getElementById('specs-section');
    if (specsSectionEl) {
        specsSectionEl.addEventListener('mouseenter', () => {
            if (!sessionFlags.pcHovered) {
                sessionFlags.pcHovered = true;
                incrementStat('pc_hovers');
            }
        });
    }

    // 2. LIVE UI UPDATES
    // Listen for realtime database changes
    let currentStats = {
        page_visits: 0,
        profile_hovers: 0,
        social_hovers: 0,
        discord_clicks: 0,
        pc_hovers: 0
    };

    db.ref('stats').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentStats = {
                page_visits: data.page_visits || 0,
                profile_hovers: data.profile_hovers || 0,
                social_hovers: data.social_hovers || 0,
                discord_clicks: data.discord_clicks || 0,
                pc_hovers: data.pc_hovers || 0
            };

            // If we are already visible and animated, update instantly
            if (hasAnimatedGraveyard) {
                if (elPageVisits) elPageVisits.textContent = currentStats.page_visits.toLocaleString();
                if (elProfileHovers) elProfileHovers.textContent = currentStats.profile_hovers.toLocaleString();
                if (elSocialHovers) elSocialHovers.textContent = currentStats.social_hovers.toLocaleString();
                if (elDiscordClicks) elDiscordClicks.textContent = currentStats.discord_clicks.toLocaleString();
                if (elPcHovers) elPcHovers.textContent = currentStats.pc_hovers.toLocaleString();
            }
        }
    });

    if (graveyardSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled-in');
                    if (!hasAnimatedGraveyard) {
                        hasAnimatedGraveyard = true;
                        // Animate up to current live values
                        animateTikTokCounter(elPageVisits, currentStats.page_visits);
                        animateTikTokCounter(elProfileHovers, currentStats.profile_hovers);
                        animateTikTokCounter(elSocialHovers, currentStats.social_hovers);
                        animateTikTokCounter(elDiscordClicks, currentStats.discord_clicks);
                        animateTikTokCounter(elPcHovers, currentStats.pc_hovers);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(graveyardSection);
    }

    // Populate PC Specs Marquee
    const specsMarqueeContent = document.getElementById('pc-specs-marquee-content');
    if (specsMarqueeContent && typeof PC_SPECS_TEXT !== 'undefined') {
        const specItems = PC_SPECS_TEXT.split('•').map(s => s.trim()).filter(s => s.length > 0);
        // Duplicate multiple times for smooth infinite scrolling
        let marqueeHTML = '';
        for (let i = 0; i < 5; i++) {
            specItems.forEach(item => {
                marqueeHTML += `<span>${item}</span>`;
            });
        }
        specsMarqueeContent.innerHTML = marqueeHTML;
    }

    const specsSection = document.getElementById('specs-section');
    if (specsSection) {
        const specsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled-in');
                    specsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        specsObserver.observe(specsSection);
    }


    // --- 9. SECRET ADMIN LOGIN (KONAMI CODE) ---
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    const adminModal = document.getElementById('admin-log-modal');
    const closeAdminBtn = document.getElementById('close-admin');

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                // KONAMI CODE ENTERED
                if (adminModal) {
                    adminModal.classList.remove('hidden');
                }
                konamiIndex = 0; // reset
            }
        } else {
            konamiIndex = 0; // reset on wrong key
        }
    });

    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            if (adminModal) adminModal.classList.add('hidden');
        });
    }

    // --- 10. SECRET TOPSU CODE ---
    const topsuCode = ['j', 'o', 'a', 'o'];
    let topsuIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === topsuCode[topsuIndex]) {
            topsuIndex++;
            if (topsuIndex === topsuCode.length) {
                showTopsuNotification();
                topsuIndex = 0;
            }
        } else {
            if (e.key.toLowerCase() === topsuCode[0]) {
                topsuIndex = 1;
            } else {
                topsuIndex = 0;
            }
        }
    });

    function showTopsuNotification() {
        let notif = document.getElementById('topsu-notif');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'topsu-notif';
            notif.className = 'topsu-toast';
            notif.innerHTML = `
                <div class="topsu-toast-content">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="color: var(--text-primary);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Topsu was here</span>
                </div>
            `;
            document.body.appendChild(notif);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            notif.classList.add('show');
            setTimeout(() => {
                notif.classList.remove('show');
            }, 3500); // hide after 3.5 seconds
        });
    }

    // --- 11. SECRET SNAKE CODE ---
    const snakeCode = ['s', 'n', 'a', 'k', 'e'];
    let snakeIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === snakeCode[snakeIndex]) {
            snakeIndex++;
            if (snakeIndex === snakeCode.length) {
                openSnakeGame();
                snakeIndex = 0;
            }
        } else {
            if (e.key.toLowerCase() === snakeCode[0]) {
                snakeIndex = 1;
            } else {
                snakeIndex = 0;
            }
        }
    });

    function openSnakeGame() {
        let modal = document.getElementById('snake-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'snake-modal';
            modal.className = 'snake-modal';
            modal.innerHTML = `
                <div class="snake-content">
                    <h2>S N A K E</h2>
                    <div class="snake-scoreboard">
                        <div>SCORE: <span id="snake-current-score">0</span></div>
                        <div>HIGH SCORE: <span id="snake-high-score">0</span></div>
                    </div>
                    <canvas id="snake-canvas" width="400" height="400"></canvas>
                    <p>Use Arrow Keys to move. Press [SPACE] to restart. Press [ESC] to exit.</p>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.classList.add('active');
        startSnakeGame();

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
                stopSnakeGame();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    let snakeGameInterval;
    function startSnakeGame() {
        const canvas = document.getElementById('snake-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const box = 20;
        let score = 0;
        let highscore = localStorage.getItem('snakeHighscore') || 0;
        let gameSpeed = 100;
        let particles = [];
        let isGameOver = false;

        const scoreEl = document.getElementById('snake-current-score');
        const highscoreEl = document.getElementById('snake-high-score');
        if (highscoreEl) highscoreEl.textContent = highscore;

        let snake = [{ x: 9 * box, y: 10 * box }];
        let food = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box
        };
        let d;
        let nextD;

        const direction = (e) => {
            // Prevent scrolling with arrow keys
            if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }

            if (e.keyCode == 37 && d != "RIGHT") nextD = "LEFT";
            else if (e.keyCode == 38 && d != "DOWN") nextD = "UP";
            else if (e.keyCode == 39 && d != "LEFT") nextD = "RIGHT";
            else if (e.keyCode == 40 && d != "UP") nextD = "DOWN";

            if (isGameOver && e.keyCode == 32) { // Space to restart
                clearInterval(snakeGameInterval);
                document.removeEventListener("keydown", direction);
                startSnakeGame();
            }
        };
        document.addEventListener("keydown", direction);

        function createParticles(x, y, color) {
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: x + box / 2,
                    y: y + box / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1.0,
                    color: color
                });
            }
        }

        function updateParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.05;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }

        function drawParticles() {
            particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        function drawGrid() {
            ctx.strokeStyle = "rgba(76, 175, 80, 0.05)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= canvas.width; i += box) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }
        }

        function collision(head, array) {
            for (let i = 0; i < array.length; i++) {
                if (head.x == array[i].x && head.y == array[i].y) return true;
            }
            return false;
        }

        function gameLoop() {
            if (isGameOver) return;

            d = nextD;

            // Background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawGrid();

            // Draw Snake
            for (let i = 0; i < snake.length; i++) {
                const gradient = ctx.createLinearGradient(snake[i].x, snake[i].y, snake[i].x + box, snake[i].y + box);
                if (i === 0) {
                    gradient.addColorStop(0, "#4CAF50");
                    gradient.addColorStop(1, "#81C784");
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "#4CAF50";
                } else {
                    gradient.addColorStop(0, "#2E7D32");
                    gradient.addColorStop(1, "#388E3C");
                    ctx.shadowBlur = 0;
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2);
            }
            ctx.shadowBlur = 0;

            // Draw Food
            const foodGrad = ctx.createRadialGradient(food.x + box / 2, food.y + box / 2, 2, food.x + box / 2, food.y + box / 2, box / 2);
            foodGrad.addColorStop(0, "#ff5252");
            foodGrad.addColorStop(1, "#b71c1c");
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#f44336";
            ctx.fillStyle = foodGrad;
            ctx.beginPath();
            ctx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Update particles
            updateParticles();
            drawParticles();

            let snakeX = snake[0].x;
            let snakeY = snake[0].y;

            if (d == "LEFT") snakeX -= box;
            if (d == "UP") snakeY -= box;
            if (d == "RIGHT") snakeX += box;
            if (d == "DOWN") snakeY += box;

            if (snakeX == food.x && snakeY == food.y) {
                score++;
                if (scoreEl) scoreEl.textContent = score;
                createParticles(food.x, food.y, "#f44336");
                food = {
                    x: Math.floor(Math.random() * 19 + 1) * box,
                    y: Math.floor(Math.random() * 19 + 1) * box
                };
                // Speed ramp
                if (score % 5 === 0 && gameSpeed > 50) {
                    gameSpeed -= 10;
                    clearInterval(snakeGameInterval);
                    snakeGameInterval = setInterval(gameLoop, gameSpeed);
                }
            } else {
                snake.pop();
            }

            let newHead = { x: snakeX, y: snakeY };

            if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
                isGameOver = true;
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 30px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("CRITICAL FAILURE", canvas.width / 2, canvas.height / 2 - 20);

                ctx.font = "16px Rajdhani";
                ctx.fillStyle = "#4CAF50";
                if (score > highscore) {
                    localStorage.setItem('snakeHighscore', score);
                    ctx.fillText("NEW SYSTEM RECORD: " + score, canvas.width / 2, canvas.height / 2 + 20);
                } else {
                    ctx.fillText("FINAL SCORE: " + score, canvas.width / 2, canvas.height / 2 + 20);
                }

                ctx.fillStyle = "#888";
                ctx.fillText("PRESS [SPACE] TO REBOOT", canvas.width / 2, canvas.height / 2 + 60);
                return;
            }

            snake.unshift(newHead);
        }

        if (snakeGameInterval) clearInterval(snakeGameInterval);
        snakeGameInterval = setInterval(gameLoop, gameSpeed);
    }


    // --- 12. SECRET TETRIS CODE ---
    const tetrisCode = ['t', 'e', 't', 'r', 'i', 's'];
    let tetrisIdx = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === tetrisCode[tetrisIdx]) {
            tetrisIdx++;
            if (tetrisIdx === tetrisCode.length) {
                openTetrisGame();
                tetrisIdx = 0;
            }
        } else {
            if (e.key.toLowerCase() === tetrisCode[0]) {
                tetrisIdx = 1;
            } else {
                tetrisIdx = 0;
            }
        }
    });

    let tetrisGameLoop;
    function openTetrisGame() {
        let modal = document.getElementById('tetris-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tetris-modal';
            modal.className = 'tetris-modal';
            modal.innerHTML = '<div class="tetris-content"><div class="tetris-main"><h2>TETRIS</h2><canvas id="tetris-canvas" width="240" height="480"></canvas></div><div class="tetris-side"><div class="tetris-stat-box"><div class="tetris-stat-label">SCORE</div><div id="tetris-score" class="tetris-stat-value">0</div></div><div class="tetris-stat-box"><div class="tetris-stat-label">HIGH SCORE</div><div id="tetris-highscore" class="tetris-stat-value">0</div></div><div class="tetris-stat-box"><div class="tetris-stat-label">NEXT</div><canvas id="tetris-next" width="80" height="80"></canvas></div><div class="tetris-controls"><b>ARROWS</b>: MOVE<br><b>UP</b>: ROTATE<br><b>SPACE</b>: HARD DROP<br><b>ESC</b>: EXIT</div></div></div>';
            document.body.appendChild(modal);
        }

        modal.classList.add('active');
        startTetrisGame();

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
                cancelAnimationFrame(tetrisGameLoop);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function startTetrisGame() {
        const canvas = document.getElementById('tetris-canvas');
        const nextCanvas = document.getElementById('tetris-next');
        const ctx = canvas.getContext('2d');
        const nextCtx = nextCanvas.getContext('2d');

        const COLS = 12;
        const ROWS = 20;
        const SQ = 20;
        const VACANT = "#000000";

        function drawSquare(x, y, color, context = ctx) {
            context.fillStyle = color;
            context.fillRect(x * SQ, y * SQ, SQ, SQ);
            context.strokeStyle = "rgba(255,255,255,0.05)";
            context.strokeRect(x * SQ, y * SQ, SQ, SQ);
            if (color !== VACANT) {
                // Glow effect inside square
                context.strokeStyle = color;
                context.lineWidth = 1;
                context.strokeRect(x * SQ + 2, y * SQ + 2, SQ - 4, SQ - 4);
                context.lineWidth = 1;
            }
        }

        let board = [];
        for (let r = 0; r < ROWS; r++) { board[r] = []; for (let c = 0; c < COLS; c++) { board[r][c] = VACANT; } }

        function drawBoard() { for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { drawSquare(c, r, board[r][c]); } } }

        const PIECES = [
            [[[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], "#00f0f0"],
            [[[1, 0, 0], [1, 1, 1], [0, 0, 0]], "#0000f0"],
            [[[0, 0, 1], [1, 1, 1], [0, 0, 0]], "#f0a000"],
            [[[1, 1], [1, 1]], "#f0f000"],
            [[[0, 1, 1], [1, 1, 0], [0, 0, 0]], "#00f000"],
            [[[0, 1, 0], [1, 1, 1], [0, 0, 0]], "#a000f0"],
            [[[1, 1, 0], [0, 1, 1], [0, 0, 0]], "#f00000"]
        ];

        function Piece(tetromino, color) {
            this.tetromino = tetromino;
            this.color = color;
            this.activeTetromino = this.tetromino;
            this.x = Math.floor(COLS / 2) - 2;
            this.y = -2;
        }

        function rotateMatrix(matrix) { return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse()); }

        Piece.prototype.draw = function (context = ctx) {
            for (let r = 0; r < this.activeTetromino.length; r++) {
                for (let c = 0; c < this.activeTetromino.length; c++) {
                    if (this.activeTetromino[r][c]) {
                        drawSquare(this.x + c, this.y + r, this.color, context);
                    }
                }
            }
        };

        Piece.prototype.unDraw = function () {
            for (let r = 0; r < this.activeTetromino.length; r++) {
                for (let c = 0; c < this.activeTetromino.length; c++) {
                    if (this.activeTetromino[r][c]) {
                        drawSquare(this.x + c, this.y + r, VACANT);
                    }
                }
            }
        };

        Piece.prototype.moveDown = function () {
            if (!this.collision(0, 1, this.activeTetromino)) {
                this.unDraw();
                this.y++;
                this.draw();
            } else {
                this.lock();
                p = nextP;
                nextP = randomPiece();
                drawNext();
            }
        };

        Piece.prototype.moveRight = function () { if (!this.collision(1, 0, this.activeTetromino)) { this.unDraw(); this.x++; this.draw(); } };
        Piece.prototype.moveLeft = function () { if (!this.collision(-1, 0, this.activeTetromino)) { this.unDraw(); this.x--; this.draw(); } };
        Piece.prototype.rotate = function () {
            let nextPattern = rotateMatrix(this.activeTetromino);
            if (!this.collision(0, 0, nextPattern)) { this.unDraw(); this.activeTetromino = nextPattern; this.draw(); }
        };

        Piece.prototype.collision = function (x, y, piece) {
            for (let r = 0; r < piece.length; r++) {
                for (let c = 0; c < piece.length; c++) {
                    if (!piece[r][c]) continue;
                    let newX = this.x + c + x;
                    let newY = this.y + r + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                    if (newY < 0) continue;
                    if (board[newY][newX] != VACANT) return true;
                }
            }
            return false;
        };

        let score = 0;
        let highscore = localStorage.getItem('tetrisHighscore') || 0;
        document.getElementById('tetris-highscore').textContent = highscore;

        Piece.prototype.lock = function () {
            for (let r = 0; r < this.activeTetromino.length; r++) {
                for (let c = 0; c < this.activeTetromino.length; c++) {
                    if (!this.activeTetromino[r][c]) continue;
                    if (this.y + r < 0) { isGameOver = true; break; }
                    board[this.y + r][this.x + c] = this.color;
                }
            }
            for (let r = 0; r < ROWS; r++) {
                let isRowFull = true;
                for (let c = 0; c < COLS; c++) { isRowFull = isRowFull && (board[r][c] != VACANT); }
                if (isRowFull) {
                    for (let y = r; y > 1; y--) { for (let c = 0; c < COLS; c++) { board[y][c] = board[y - 1][c]; } }
                    for (let c = 0; c < COLS; c++) { board[0][c] = VACANT; }
                    score += 100;
                }
            }
            drawBoard();
            document.getElementById('tetris-score').textContent = score;
        };

        function randomPiece() { let r = Math.floor(Math.random() * PIECES.length); return new Piece(PIECES[r][0], PIECES[r][1]); }

        function drawNext() {
            nextCtx.fillStyle = "#000";
            nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
            for (let r = 0; r < nextP.activeTetromino.length; r++) {
                for (let c = 0; c < nextP.activeTetromino.length; c++) {
                    if (nextP.activeTetromino[r][c]) {
                        nextCtx.fillStyle = nextP.color;
                        nextCtx.fillRect(c * 20 + 10, r * 20 + 10, 18, 18);
                    }
                }
            }
        }

        let p = randomPiece();
        let nextP = randomPiece();
        drawNext();
        drawBoard();

        let dropStart = Date.now();
        let isGameOver = false;

        function control(e) {
            if (isGameOver) return;
            if ([37, 38, 39, 40, 32].indexOf(e.keyCode) > -1) e.preventDefault();
            if (e.keyCode == 37) p.moveLeft();
            else if (e.keyCode == 38) p.rotate();
            else if (e.keyCode == 39) p.moveRight();
            else if (e.keyCode == 40) p.moveDown();
            else if (e.keyCode == 32) { while (!p.collision(0, 1, p.activeTetromino)) { p.moveDown(); } p.moveDown(); }
        }
        document.addEventListener("keydown", control);

        function gameLoopFunc() {
            if (isGameOver) {
                if (score > highscore) { localStorage.setItem('tetrisHighscore', score); }
                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#fff";
                ctx.font = "18px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
                ctx.font = "12px Rajdhani";
                ctx.fillText("FINAL SCORE: " + score, canvas.width / 2, canvas.height / 2 + 30);
                document.removeEventListener("keydown", control);
                return;
            }
            let now = Date.now();
            let delta = now - dropStart;
            if (delta > 800) { p.moveDown(); dropStart = Date.now(); }
            tetrisGameLoop = requestAnimationFrame(gameLoopFunc);
        }
        gameLoopFunc();
    }

    // --- 13. SECRET FLAPPY BIRD CODE ---
    const flappyCode = ['f', 'l', 'a', 'p', 'p', 'y'];
    let flappyIdx = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === flappyCode[flappyIdx]) {
            flappyIdx++;
            if (flappyIdx === flappyCode.length) {
                openFlappyBird();
                flappyIdx = 0;
            }
        } else {
            if (e.key.toLowerCase() === flappyCode[0]) { flappyIdx = 1; }
            else { flappyIdx = 0; }
        }
    });

    let flappyGameLoop;
    function openFlappyBird() {
        let modal = document.getElementById('flappy-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'flappy-modal';
            modal.className = 'flappy-modal';
            modal.innerHTML = '<div class=\"flappy-content\"><h2>FLAPPY BIRD</h2><div class=\"flappy-scoreboard\"><div>SCORE: <span id=\"flappy-score\">0</span></div><div>HIGH SCORE: <span id=\"flappy-highscore\">0</span></div></div><canvas id=\"flappy-canvas\" width=\"800\" height=\"480\"></canvas><div class=\"flappy-controls\"><b>SPACE / CLICK</b>: JUMP | <b>ESC</b>: EXIT</div></div>';
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
        startFlappyBird();

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
                cancelAnimationFrame(flappyGameLoop);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function startFlappyBird() {
        const canvas = document.getElementById('flappy-canvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('flappy-score');
        const highscoreEl = document.getElementById('flappy-highscore');

        let score = 0;
        let highscore = localStorage.getItem('flappyHighscore') || 0;
        highscoreEl.textContent = highscore;

        // Constants
        const GRAVITY = 0.2;
        const JUMP = -5;
        const PIPE_SPEED = 2.0;
        const PIPE_SPAWN = 140; // frames
        const PIPE_GAP = 190;

        let bird = { x: 50, y: canvas.height / 2, w: 30, h: 20, v: 0, tilt: 0 };
        let pipes = [];
        let frame = 0;
        let particles = [];
        let state = 0; // 0: Start, 1: Playing, 2: GameOver

        function createPipes() {
            const minHeight = 50;
            const maxHeight = canvas.height - PIPE_GAP - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            pipes.push({ x: canvas.width, top: topHeight, passed: false });
        }

        function createParticles(x, y, color) {
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color
                });
            }
        }

        function drawBird() {
            ctx.save();
            ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
            bird.tilt = Math.min(Math.max(bird.v * 0.1, -0.5), 0.5);
            ctx.rotate(bird.tilt);

            // Draw Neon Cursor Bird
            ctx.fillStyle = "#FFD700";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FFD700";
            ctx.beginPath();
            ctx.moveTo(-bird.w / 2, -bird.h / 2);
            ctx.lineTo(bird.w / 2, 0);
            ctx.lineTo(-bird.w / 2, bird.h / 2);
            ctx.lineTo(-bird.w / 4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function drawPipes() {
            pipes.forEach(p => {
                const grad = ctx.createLinearGradient(p.x, 0, p.x + 50, 0);
                grad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
                grad.addColorStop(0.5, "rgba(255, 215, 0, 1)");
                grad.addColorStop(1, "rgba(255, 215, 0, 0.8)");

                ctx.fillStyle = grad;
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(255, 215, 0, 0.5)";

                // Top Pipe
                ctx.fillRect(p.x, 0, 50, p.top);
                // Bottom Pipe
                ctx.fillRect(p.x, p.top + PIPE_GAP, 50, canvas.height - (p.top + PIPE_GAP));

                // Neon caps
                ctx.fillStyle = "#FFF";
                ctx.fillRect(p.x - 2, p.top - 5, 54, 5);
                ctx.fillRect(p.x - 2, p.top + PIPE_GAP, 54, 5);
            });
            ctx.shadowBlur = 0;
        }

        function drawState() {
            if (state === 0) {
                ctx.fillStyle = "rgba(0,0,0,0.4)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FFF";
                ctx.font = "bold 20px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("READY SYSTEM", canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = "14px Rajdhani";
                ctx.fillText("PRESS [SPACE] TO ASCENT", canvas.width / 2, canvas.height / 2 + 20);
            } else if (state === 2) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FF3131";
                ctx.font = "bold 24px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("SYSTEM CRASHED", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "#FFF";
                ctx.font = "16px Rajdhani";
                ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillStyle = "#888";
                ctx.fillText("PRESS [SPACE] TO REBOOT", canvas.width / 2, canvas.height / 2 + 60);
            }
        }

        function loop() {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = "rgba(255, 215, 0, 0.05)";
            for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
            for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

            if (state === 1) {
                bird.v += GRAVITY;
                bird.y += bird.v;

                if (bird.y + bird.h > canvas.height || bird.y < 0) {
                    crash();
                }

                if (frame % PIPE_SPAWN === 0) createPipes();

                pipes.forEach((p, i) => {
                    p.x -= PIPE_SPEED;
                    if (p.x + 50 < 0) pipes.splice(i, 1);

                    // Collision
                    if (bird.x + bird.w > p.x && bird.x < p.x + 50) {
                        if (bird.y < p.top || bird.y + bird.h > p.top + PIPE_GAP) {
                            crash();
                        }
                    }

                    if (!p.passed && bird.x > p.x + 50) {
                        p.passed = true;
                        score++;
                        scoreEl.textContent = score;
                    }
                });

                frame++;
            }

            drawPipes();
            drawBird();

            // Particles
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                if (p.life <= 0) particles.splice(i, 1);
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 3, 3);
            });
            ctx.globalAlpha = 1;

            drawState();
            flappyGameLoop = requestAnimationFrame(loop);
        }

        function jump() {
            if (state === 0) state = 1;
            else if (state === 1) bird.v = JUMP;
            else if (state === 2) restart();
        }

        function crash() {
            state = 2;
            createParticles(bird.x, bird.y, "#FFD700");
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('flappyHighscore', highscore);
                highscoreEl.textContent = highscore;
            }
        }

        function restart() {
            score = 0;
            scoreEl.textContent = 0;
            bird = { x: 50, y: canvas.height / 2, w: 30, h: 20, v: 0, tilt: 0 };
            pipes = [];
            particles = [];
            frame = 0;
            state = 0;
        }

        const onKey = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        const onClick = (e) => { e.preventDefault(); jump(); };

        document.addEventListener('keydown', onKey);
        canvas.addEventListener('mousedown', onClick);

        // Escape handling cleanup
        const escapeCheck = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', onKey);
                canvas.removeEventListener('mousedown', onClick);
                document.removeEventListener('keydown', escapeCheck);
            }
        };
        document.addEventListener('keydown', escapeCheck);

        if (flappyGameLoop) cancelAnimationFrame(flappyGameLoop);
        loop();
    }

    // --- 14. SECRET BREAKOUT CODE ---
    const breakoutCode = ['b', 'r', 'e', 'a', 'k'];
    let breakoutIdx = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === breakoutCode[breakoutIdx]) {
            breakoutIdx++;
            if (breakoutIdx === breakoutCode.length) {
                openBreakoutGame();
                breakoutIdx = 0;
            }
        } else {
            if (e.key.toLowerCase() === breakoutCode[0]) { breakoutIdx = 1; }
            else { breakoutIdx = 0; }
        }
    });

    let breakoutGameLoop;
    function openBreakoutGame() {
        let modal = document.getElementById('breakout-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'breakout-modal';
            modal.className = 'breakout-modal';
            modal.innerHTML = '<div class=\"breakout-content\"><h2>QUANTUM BREAKOUT</h2><div class=\"breakout-scoreboard\"><div>SCORE: <span id=\"breakout-score\">0</span></div><div>HIGH SCORE: <span id=\"breakout-highscore\">0</span></div></div><canvas id=\"breakout-canvas\" width=\"600\" height=\"400\"></canvas><div class=\"breakout-controls\"><b>ARROW KEYS</b>: MOVE PADDLE | <b>ESC</b>: EXIT</div></div>';
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
        startBreakoutGame();

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
                cancelAnimationFrame(breakoutGameLoop);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function startBreakoutGame() {
        const canvas = document.getElementById('breakout-canvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('breakout-score');
        const highscoreEl = document.getElementById('breakout-highscore');

        let score = 0;
        let highscore = localStorage.getItem('breakoutHighscore') || 0;
        highscoreEl.textContent = highscore;

        let ball = { x: canvas.width / 2, y: canvas.height - 30, dx: 2.5, dy: -2.5, radius: 6 };
        let paddle = { h: 10, w: 75, x: (canvas.width - 75) / 2 };
        let rightPressed = false;
        let leftPressed = false;

        const brickRowCount = 5;
        const brickColumnCount = 8;
        const brickWidth = 65;
        const brickHeight = 20;
        const brickPadding = 10;
        const brickOffsetTop = 30;
        const brickOffsetLeft = 30;

        let bricks = [];
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }

        let particles = [];
        let state = 0; // 0: Start, 1: Playing, 2: GameOver, 3: Win

        function createParticles(x, y, color) {
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1.0,
                    color
                });
            }
        }

        function drawBall() {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#00ffff";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00ffff";
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
        }

        function drawPaddle() {
            ctx.beginPath();
            ctx.rect(paddle.x, canvas.height - paddle.h - 10, paddle.w, paddle.h);
            ctx.fillStyle = "#00ffff";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00ffff";
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
        }

        function drawBricks() {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if (bricks[c][r].status == 1) {
                        let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                        let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                        bricks[c][r].x = brickX;
                        bricks[c][r].y = brickY;

                        ctx.beginPath();
                        ctx.rect(brickX, brickY, brickWidth, brickHeight);
                        const grad = ctx.createLinearGradient(brickX, brickY, brickX + brickWidth, brickY + brickHeight);
                        grad.addColorStop(0, "rgba(0, 255, 255, 0.2)");
                        grad.addColorStop(1, "rgba(0, 255, 255, 0.05)");
                        ctx.fillStyle = grad;
                        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }

        function collisionDetection() {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    let b = bricks[c][r];
                    if (b.status == 1) {
                        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            score++;
                            scoreEl.textContent = score;
                            createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, "#00ffff");
                            if (score == brickRowCount * brickColumnCount) {
                                state = 3;
                            }
                        }
                    }
                }
            }
        }

        function restart() {
            score = 0;
            scoreEl.textContent = 0;
            ball = { x: canvas.width / 2, y: canvas.height - 30, dx: 2.5, dy: -2.5, radius: 6 };
            paddle = { h: 10, w: 75, x: (canvas.width - 75) / 2 };
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    bricks[c][r].status = 1;
                }
            }
            particles = [];
            state = 0;
        }

        function loop() {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = "rgba(0, 255, 255, 0.03)";
            for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
            for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

            if (state === 1) {
                if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                    ball.dx = -ball.dx;
                }
                if (ball.y + ball.dy < ball.radius) {
                    ball.dy = -ball.dy;
                } else if (ball.y + ball.dy > canvas.height - ball.radius - 20) {
                    if (ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
                        ball.dy = -ball.dy;
                        // Add some variance based on where it hits the paddle
                        let hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
                        ball.dx = hitPos * 5;
                    } else if (ball.y + ball.dy > canvas.height - ball.radius) {
                        state = 2;
                        if (score > highscore) {
                            highscore = score;
                            localStorage.setItem('breakoutHighscore', highscore);
                            highscoreEl.textContent = highscore;
                        }
                    }
                }

                if (rightPressed && paddle.x < canvas.width - paddle.w) {
                    paddle.x += 7;
                } else if (leftPressed && paddle.x > 0) {
                    paddle.x -= 7;
                }

                ball.x += ball.dx;
                ball.y += ball.dy;
                collisionDetection();
            }

            drawBricks();
            drawBall();
            drawPaddle();

            // Particles
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                if (p.life <= 0) particles.splice(i, 1);
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 2, 2);
            });
            ctx.globalAlpha = 1;

            if (state === 0) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FFF";
                ctx.font = "bold 20px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("BREAK THE SYSTEM", canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = "14px Rajdhani";
                ctx.fillText("PRESS [SPACE] OR CLICK TO START", canvas.width / 2, canvas.height / 2 + 20);
            } else if (state === 2) {
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FF3131";
                ctx.font = "bold 24px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("SYSTEM FAILED", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "#FFF";
                ctx.font = "16px Rajdhani";
                ctx.fillText("FINAL SCORE: " + score, canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillStyle = "#888";
                ctx.fillText("PRESS [SPACE] TO REBOOT", canvas.width / 2, canvas.height / 2 + 60);
            } else if (state === 3) {
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#00FF00";
                ctx.font = "bold 24px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText("SYSTEM SECURED", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "#FFF";
                ctx.font = "16px Rajdhani";
                ctx.fillText("YOU CLEANED THE CORE", canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillStyle = "#888";
                ctx.fillText("PRESS [SPACE] TO RE-RUN", canvas.width / 2, canvas.height / 2 + 60);
            }

            breakoutGameLoop = requestAnimationFrame(loop);
        }

        const onKeyDown = (e) => {
            if (e.key == "Right" || e.key == "ArrowRight") rightPressed = true;
            else if (e.key == "Left" || e.key == "ArrowLeft") leftPressed = true;
            else if (e.code == "Space") {
                e.preventDefault();
                if (state === 0) state = 1;
                else if (state === 2 || state === 3) restart();
            }
        };
        const onKeyUp = (e) => {
            if (e.key == "Right" || e.key == "ArrowRight") rightPressed = false;
            else if (e.key == "Left" || e.key == "ArrowLeft") leftPressed = false;
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        canvas.addEventListener("mousedown", () => { if (state === 0) state = 1; else if (state === 2 || state === 3) restart(); });

        const escapeCheck = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', onKeyDown);
                document.removeEventListener('keyup', onKeyUp);
                document.removeEventListener('keydown', escapeCheck);
            }
        };
        document.addEventListener('keydown', escapeCheck);

        if (breakoutGameLoop) cancelAnimationFrame(breakoutGameLoop);
        loop();
    }
    function stopSnakeGame() {
        clearInterval(snakeGameInterval);
    }

    // --- SEAMLESS PAGE TRANSITIONS ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const tgt = e.currentTarget.getAttribute('href');
            if (tgt && tgt.endsWith('.html') && !tgt.startsWith('http')) {
                e.preventDefault();
                document.body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = tgt;
                }, 400); // Wait for fade-out animation
            }
        });
    });

});
