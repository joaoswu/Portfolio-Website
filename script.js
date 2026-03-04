document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ENTRY SCREEN LOGIC ---
    const enterScreen = document.getElementById('enter-screen');
    const enterBtn = document.getElementById('enter-btn');
    const bgMusic = document.getElementById('bg-music');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const loadingText = document.getElementById('loading-text');
    const visualizerCanvas = document.getElementById('music-visualizer');

    // Audio Visualizer Variables
    let audioCtx;
    let analyser;
    let source;
    let dataArray;
    let animationId;

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

    if (enterBtn && enterScreen) {
        enterBtn.addEventListener('click', () => {
            // Hide the button
            enterBtn.style.display = 'none';

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
                    source = audioCtx.createMediaElementSource(bgMusic);
                    source.connect(analyser);
                    analyser.connect(audioCtx.destination);
                    analyser.fftSize = 256; // High frequency resolution
                    analyser.smoothingTimeConstant = 0.85; // Smoother transitions
                    const bufferLength = analyser.frequencyBinCount;
                    dataArray = new Uint8Array(bufferLength);

                    // Start drawing loop but only visually active when playing
                    drawVisualizer();
                }

                bgMusic.volume = 0.5; // Start at reasonable volume
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

                        // --- START ADVANCED BOOT SEQUENCE ---
                        const bentoItems = document.querySelectorAll('.bento-item');
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

                        // Dispatch event for the logger
                        document.dispatchEvent(new CustomEvent('siteAction', {
                            detail: { message: '> Authentication bypass successful.' }
                        }));
                        setTimeout(() => {
                            document.dispatchEvent(new CustomEvent('siteAction', {
                                detail: { message: '> Welcome, guest.' }
                            }));
                        }, 800);

                    }, 400); // small pause at 100% before entering
                }
            }, 100); // update every 100ms
        });
    }

    // --- 1.6 AUDIO VISUALIZER DRAWING ---
    function drawVisualizer() {
        if (!visualizerCanvas) return;
        const ctx = visualizerCanvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;

        function draw() {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // Resize canvas to its element size (CSS controlled)
            const width = visualizerCanvas.clientWidth;
            const height = visualizerCanvas.clientHeight;
            if (visualizerCanvas.width !== width || visualizerCanvas.height !== height) {
                visualizerCanvas.width = width;
                visualizerCanvas.height = height;
            }

            ctx.clearRect(0, 0, width, height);

            // Only draw bars if audio is actually playing (to keep it clean)
            if (bgMusic.paused) {
                // Optional: Gentle flat line or nothing
                return;
            }

            const barWidth = (width / bufferLength);
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Color based on light/dark mode
                const isLight = document.body.classList.contains('light-mode');
                // Use a subtle white glow in dark and gray in light
                ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)';

                // Draw mirrored bars or just standard frequency bars
                ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        }
        draw();
    }

    // --- 1.5 SYSTEM LOG WIDGET ---
    const actionLog = document.getElementById('action-log');
    if (actionLog) {
        let lastLogMessage = ''; // Keep track of the last logged message

        // Listen for custom events across the site
        document.addEventListener('siteAction', (e) => {
            const msg = e.detail.message;
            const isHighlight = e.detail.highlight;
            const isCodeGreen = e.detail.codeGreen;

            // Only log if it's a new unique action to prevent hover spam
            if (msg === lastLogMessage) return;
            lastLogMessage = msg;

            const entry = document.createElement('div');
            entry.className = 'log-entry';
            if (isHighlight) entry.classList.add('highlight');
            if (isCodeGreen) entry.classList.add('code-green');

            // Add timestamp
            const now = new Date();
            const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;

            entry.innerText = `${timeStr} ${msg}`;

            actionLog.appendChild(entry);

            // Keep only the last 5 logs to prevent overflow
            while (actionLog.childElementCount > 6) { // 6 because of the hardcoded 2 in HTML
                actionLog.removeChild(actionLog.firstChild);
            }
        });
    }

    // --- 2. CUSTOM CYBER CURSOR & TARGETING RETICLE ---
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
    animateCursor();

    // Lock-on Logic for Bento Items
    const bentoCards = document.querySelectorAll('.bento-item');
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

            // Log hover actions
            let targetName = "element";
            let glowColor = "rgba(255, 255, 255, 0.04)"; // Default

            if (el.classList.contains('github-commits-card') || el.classList.contains('github')) {
                targetName = "GitHub";
                glowColor = "rgba(192, 132, 252, 0.15)"; // Purple
            }
            else if (el.classList.contains('music-card')) {
                targetName = "audio interface";
                glowColor = "rgba(255, 255, 255, 0.1)"; // Brighter white
            }
            else if (el.classList.contains('discord-status-card') || el.classList.contains('discord-invite') || el.id === 'discord-card') {
                targetName = "Discord";
                glowColor = "rgba(88, 101, 242, 0.15)"; // Discord Blue
            }
            else if (el.classList.contains('spotify-card')) {
                targetName = "Spotify";
                glowColor = "rgba(29, 185, 84, 0.15)"; // Spotify Green
            }
            else if (el.classList.contains('wakatime-card')) {
                targetName = "WakaTime stats";
                glowColor = "rgba(0, 0, 0, 0.2)"; // Darker for stats
            }
            else if (el.classList.contains('tiktok')) {
                targetName = "TikTok";
                glowColor = "rgba(255, 0, 80, 0.15)"; // TikTok Red/Pink
            }
            else if (el.classList.contains('action-log-card')) {
                targetName = "system log";
                glowColor = "rgba(255, 255, 255, 0.08)";
            }
            else if (el.id === 'theme-toggler') {
                targetName = "theme override";
                glowColor = "rgba(255, 255, 0, 0.1)"; // Yellowish
            }


            if (targetName !== "element") {
                document.dispatchEvent(new CustomEvent('siteAction', {
                    detail: { message: `> Scanning ${targetName}...` }
                }));
            }
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
        });
    });


    // --- 4. 3D TILT INTERACTION ---
    const bentoItems = document.querySelectorAll('.bento-item');

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
                // If the API fails, show a slightly more graceful placeholder
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
        // Initial setup for loaded metadata
        bgMusic.addEventListener('loadedmetadata', () => {
            if (audioDuration) audioDuration.textContent = formatTime(bgMusic.duration);
        });

        // Time update loop
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

        // Seek dragging
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
                document.dispatchEvent(new CustomEvent('siteAction', {
                    detail: { message: '> Audio playback initialized.' }
                }));
            } else {
                bgMusic.pause();
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                document.dispatchEvent(new CustomEvent('siteAction', {
                    detail: { message: '> Audio playback paused.' }
                }));
            }
        });

        // Volume control
        if (volumeSlider) {
            bgMusic.volume = volumeSlider.value / 100;
            volumeSlider.addEventListener('change', (e) => {
                const vol = Math.round(e.target.value);
                document.dispatchEvent(new CustomEvent('siteAction', {
                    detail: { message: `> Audio volume set to ${vol}%.` }
                }));
            });
            volumeSlider.addEventListener('input', (e) => {
                bgMusic.volume = e.target.value / 100;
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

    function updateLanyardData(data) {
        const status = data.discord_status;

        // Avatar and Favicon
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

        // Status Indicator
        if (statusDot && statusText) {
            statusDot.className = `status-indicator ${status}`;
            const displayStatus = status === 'dnd' ? 'Do Not Disturb' : status.charAt(0).toUpperCase() + status.slice(1);
            statusText.textContent = displayStatus;
        }

        // Discord RPC
        if (customStatus) {
            let rpcText = '';
            if (data.activities && data.activities.length > 0) {
                // Find an activity that is NOT a custom status and NOT Spotify (since Spotify has its own card)
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

        // Spotify
        if (data.spotify && data.listening_to_spotify) {
            if (spotifySong && spotifyArtist) {
                spotifySong.textContent = data.spotify.song;
                spotifyArtist.textContent = data.spotify.artist;
            }
        } else {
            if (spotifySong && spotifyArtist) {
                spotifySong.textContent = 'Not playing';
                spotifyArtist.textContent = '-';
            }
        }
    }

    connectLanyard();

    // --- NEW WIDGETS LOGIC ---

    // Theme Toggler
    const themeToggler = document.getElementById('theme-toggler');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    if (themeToggler) {
        themeToggler.classList.add('interactable'); // Make sure it works with cursor hover logging

        themeToggler.addEventListener('click', () => {
            // Trigger Glitch Effect
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

            document.dispatchEvent(new CustomEvent('siteAction', {
                detail: {
                    message: `> Theme override: ${isLight ? 'LIGHT_MODE' : 'DARK_MODE'}`,
                    highlight: true
                }
            }));
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
        // Fetch weather for a default location (e.g. London, or based on user location if requested. Using hardcoded lat/lon for demo)
        fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5085&longitude=-0.1257&current_weather=true')
            .then(res => res.json())
            .then(data => {
                const weather = data.current_weather;
                weatherTemp.textContent = `${Math.round(weather.temperature)}°C`;
                weatherDesc.textContent = `Wind: ${weather.windspeed} km/h`; // Open-Meteo current_weather doesn't give text descriptions easily, so we show windspeed instead
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
                // Find the latest PushEvent
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

    // --- 5. NETWORK CANVAS PARTICLES ---
    const canvas = document.getElementById('network-canvas');
    const ctx = canvas.getContext('2d');
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

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            // Mouse Repel
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                // Push slowly away
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }
    }

    // Init particles
    const particleCount = (canvas.width * canvas.height) / 15000; // Density
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateNetwork() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw
        particles.forEach(p => p.update());

        // Connect lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    // Opacity based on distance
                    const opacity = 1 - (dist / 120);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`; // White connections
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => p.draw());
        requestAnimationFrame(animateNetwork);
    }
    animateNetwork();

    // --- 6. WAKATIME STATS WIDGET ---
    const wakatimeStats = document.getElementById('wakatime-stats');
    if (wakatimeStats) {
        // We use a free open WakaTime proxy or standard stats JSON if available publicly
        // For demonstration without exposing a private API key, we use a known public endpoint or proxy
        // (NOTE: replace this URL with your actual public Wakatime JSON share URL)
        const wakaUrl = 'https://wakatime.com/@8fc5d29f-f747-4ff0-9166-2ab64ebd2a6f';

        // Since WakaTime share URLs might have CORS issues, a common workaround is creating a simple
        // Vercel serverless function, or using a proxy. For front-end only, we will try to fetch, 
        // and provide dummy data if it fails due to CORS, so the UI can be built and tested now.

        fetch(wakaUrl)
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    renderWakatime(data.data);
                } else {
                    renderDummyWakatime();
                }
            })
            .catch(err => {
                console.log("WakaTime fetch error (likely CORS). Using fallback data for styling.", err);
                renderDummyWakatime();
            });

        function renderWakatime(languages) {
            wakatimeStats.innerHTML = '';

            // Only take top 3 to fit the card
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

                // Animate bar fill
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
    }

    // --- 7. AUDIO VISUALIZER ---
    function setupVisualizer() {
        const visualizerCanvas = document.getElementById('audio-visualizer');
        if (!visualizerCanvas || !bgMusic || window.audioVisualizerInitialized) return;

        const visualizerCtx = visualizerCanvas.getContext('2d');
        window.audioVisualizerInitialized = true;

        function resizeVisualizer() {
            visualizerCanvas.width = window.innerWidth;
            visualizerCanvas.height = 150;
        }
        window.addEventListener('resize', resizeVisualizer);
        resizeVisualizer();

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();

        // Connect the source only once
        const source = audioCtx.createMediaElementSource(bgMusic);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256; // 128 frequency bins
        const bufferLength = analyser.frequencyBinCount;
        const visualizerDataArray = new Uint8Array(bufferLength);

        function drawVisualizer() {
            requestAnimationFrame(drawVisualizer);
            if (bgMusic.paused) {
                // Decay the visuals smoothly if paused, rather than hard stop
                visualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                visualizerCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
                return;
            }

            analyser.getByteFrequencyData(visualizerDataArray);
            visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

            const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = visualizerDataArray[i] / 2; // scale

                const isLightMode = document.body.classList.contains('light-mode');
                if (isLightMode) {
                    visualizerCtx.fillStyle = `rgba(0, 0, 0, ${barHeight / 150})`;
                } else {
                    visualizerCtx.fillStyle = `rgba(255, 255, 255, ${barHeight / 150})`;
                }

                // Draw from bottom up
                visualizerCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 2;
            }
        }
        drawVisualizer();
    }
    window.setupVisualizer = setupVisualizer; // Expose to the enter click handler

    // --- 11. BROWSER TAB TITLE ANIMATION ---
    const titleText = "> joao.sw";
    let titleIndex = 0;
    let titleIsDeleting = false;

    function animateTitle() {
        // Build the current string: the typed portion plus a blinking cursor if typing
        const currentText = titleText.substring(0, titleIndex);
        const cursorChar = (titleIndex < titleText.length && !titleIsDeleting) ? "_" : "";
        document.title = currentText + cursorChar;

        let typeSpeed = titleIsDeleting ? 100 : 250;

        if (!titleIsDeleting && titleIndex === titleText.length) {
            // Pause at the end before deleting
            typeSpeed = 3000;
            titleIsDeleting = true;
        } else if (titleIsDeleting && titleIndex === 0) {
            titleIsDeleting = false;
            // Brief pause before re-typing
            typeSpeed = 500;
        } else {
            if (titleIsDeleting) {
                titleIndex--;
            } else {
                titleIndex++;
            }
        }
        setTimeout(animateTitle, typeSpeed);
    }
    animateTitle();

    // --- 12. DAILY QUOTE LOGIC (ENCRYPTION DECODING) ---

    const quoteTextEl = document.getElementById('quote-text');
    const quoteAuthorEl = document.getElementById('quote-author');

    async function fetchDailyQuote() {
        try {
            const response = await fetch('https://api.allorigins.win/raw?url=https://zenquotes.io/api/today');
            const data = await response.json();

            if (data && data[0]) {
                const quote = data[0].q;
                const author = data[0].a;

                if (quoteTextEl) {
                    await typeText(quoteTextEl, quote, 30);
                }
                if (quoteAuthorEl) {
                    quoteAuthorEl.textContent = author;
                }
            }
        } catch (error) {
            console.error('Failed to fetch quote:', error);
            if (quoteTextEl) quoteTextEl.textContent = 'STAY HUNGRY, STAY FOOLISH.';
            if (quoteAuthorEl) quoteAuthorEl.textContent = 'STEVE JOBS';
        }
    }

    setTimeout(fetchDailyQuote, 2500);

    // --- 13. FINALIZE ---
    document.dispatchEvent(new CustomEvent('siteAction', {
        detail: { message: '> DAILY_TRANSMISSION: DECODED.' }
    }));
});
