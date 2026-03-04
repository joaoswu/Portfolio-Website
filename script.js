document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // CUSTOMIZATION SECTION
    // ==========================================
    const MY_MOOD = "Alive, I Guess.";
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

    if (enterBtn && enterScreen) {
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
        });
    }

    const cursor = document.getElementById('cursor');
    const cursorShape = document.getElementById('cursor-shape');
    const reticle = document.getElementById('target-reticle');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Movement tracking for velocity rotation
    let lastX = mouseX;
    let lastY = mouseY;
    let currentAngle = 0;

    // Reticle State
    let reticleX = mouseX;
    let reticleY = mouseY;
    let reticleW = 40;
    let reticleH = 40;

    let targetX = mouseX;
    let targetY = mouseY;
    let targetW = 40;
    let targetH = 40;
    let isLocked = false;

    document.addEventListener('mousemove', (e) => {
        if (isTouchDevice) return;
        mouseX = e.clientX;
        mouseY = e.clientY;

        // If not locked, target follows mouse
        if (!isLocked) {
            targetX = mouseX;
            targetY = mouseY;
            targetW = 40;
            targetH = 40;
        }

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

        // --- RETICLE LERP ---
        const lerpSpeed = isLocked ? 0.3 : 0.15;
        reticleX += (targetX - reticleX) * lerpSpeed;
        reticleY += (targetY - reticleY) * lerpSpeed;
        reticleW += (targetW - reticleW) * lerpSpeed;
        reticleH += (targetH - reticleH) * lerpSpeed;

        reticle.style.width = `${reticleW}px`;
        reticle.style.height = `${reticleH}px`;
        reticle.style.transform = `translate(-50%, -50%) translate(${reticleX}px, ${reticleY}px)`;

        lastX = mouseX;
        lastY = mouseY;
        requestAnimationFrame(animateCursor);
    }
    if (!isTouchDevice) {
        animateCursor();
    }

    // Lock-on Logic for Bento Items
    const bentoCards = document.querySelectorAll('.bento-item');
    if (!isTouchDevice) {
        bentoCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const rect = card.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
                targetW = rect.width + 10;
                targetH = rect.height + 10;
                isLocked = true;
                reticle.classList.add('locked');
            });

            card.addEventListener('mouseleave', () => {
                isLocked = false;
                reticle.classList.remove('locked');
            });
        });

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

        // --- THEME CUSTOMIZATION LOGIC ---
        const colorBg = document.getElementById('color-bg');
        const colorCard = document.getElementById('color-card');
        const colorBorder = document.getElementById('color-border');
        const colorText = document.getElementById('color-text');
        const resetThemeBtn = document.getElementById('reset-theme-btn');

        const updateTheme = (varName, value) => {
            document.documentElement.style.setProperty(varName, value);

            // Save to localStorage
            let currentTheme = JSON.parse(localStorage.getItem('custom-theme')) || {};
            currentTheme[varName] = value;
            localStorage.setItem('custom-theme', JSON.stringify(currentTheme));

            // If they change theme, force removal of light mode to prevent conflicts
            if (document.body.classList.contains('light-mode')) {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark-mode');
                const themeIconSun = document.getElementById('theme-icon-sun');
                const themeIconMoon = document.getElementById('theme-icon-moon');
                if (themeIconSun && themeIconMoon) {
                    themeIconSun.style.display = 'block';
                    themeIconMoon.style.display = 'none';
                }
            }
        };

        if (colorBg) colorBg.addEventListener('input', (e) => updateTheme('--bg-color', e.target.value));
        if (colorCard) colorCard.addEventListener('input', (e) => updateTheme('--card-bg', e.target.value));
        if (colorBorder) colorBorder.addEventListener('input', (e) => {
            updateTheme('--border-color', e.target.value);
            // Also update hover bg to match the new border theme loosely
            updateTheme('--hover-bg', e.target.value + '80'); // Add 50% opacity hex
        });
        if (colorText) colorText.addEventListener('input', (e) => updateTheme('--text-primary', e.target.value));

        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', () => {
                localStorage.removeItem('custom-theme');
                // Remove inline styles to revert to CSS file defaults
                document.documentElement.style.removeProperty('--bg-color');
                document.documentElement.style.removeProperty('--card-bg');
                document.documentElement.style.removeProperty('--border-color');
                document.documentElement.style.removeProperty('--hover-bg');
                document.documentElement.style.removeProperty('--text-primary');

                // Reset picker values to defaults
                if (colorBg) colorBg.value = '#050505';
                if (colorCard) colorCard.value = '#0a0a0f';
                if (colorBorder) colorBorder.value = '#222222';
                if (colorText) colorText.value = '#ffffff';
            });
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

    // --- 8. SECRET ADMIN LOGIN (KONAMI CODE) ---
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

});
