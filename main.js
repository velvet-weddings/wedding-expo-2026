document.addEventListener('DOMContentLoaded', () => {
    const introStage      = document.getElementById('intro-stage');
    const introVideo      = document.getElementById('intro-video');
    const announcementStage = document.getElementById('announcement-stage');
    const overlay         = document.getElementById('interaction-overlay');
    const bloom           = document.getElementById('transition-bloom');
    const mainContent     = document.getElementById('main-content');
    const bgMusic         = document.getElementById('bg-music');
    const bgMusicToggle   = document.getElementById('bg-music-toggle');
    const musicUnmutedIcon = bgMusicToggle.querySelector('.wc-music-icon-unmuted');
    const musicMutedIcon   = bgMusicToggle.querySelector('.wc-music-icon-muted');
    
    // Select secondary videos for priming
    const heroVideo       = document.querySelector('.wc-hero__video');
    const featuredVideo   = document.querySelector('.wc-featured-content__video');

    let hasStarted        = false;
    let transitionStarted = false;

    // 1. Media Initialization
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic.volume = 1;
        bgMusic.muted = false;
        // Ensure the audio is pre-loaded and ready for the tap
        bgMusic.load();
    }
    
    // Video remains permanently muted (since it has no sound)
    introVideo.pause();
    introVideo.muted = true; 
    introVideo.currentTime = 0;

    // 2. Cinematic Flow: Direct Website Reveal after Video
    const triggerTransition = () => {
        if (transitionStarted) return;
        transitionStarted = true;

        // Hide intro stage
        introStage.style.opacity = '0';
        setTimeout(() => { introStage.style.display = 'none'; }, 800);

        // Stage 1: Reveal Main Content with Bloom bridge
        bloom.style.opacity = '1';

        setTimeout(() => {
            mainContent.classList.remove('hidden');
            document.body.style.overflow = 'auto';

            // Init all Layer 2 interactions now that elements are in DOM
            initMainContent();

            setTimeout(() => {
                bloom.style.opacity = '0';
                mainContent.classList.add('visible');
                
                // Show mute button when main content is revealed
                setTimeout(() => {
                    bgMusicToggle.classList.add('visible');
                }, 1000);
            }, 100);
        }, 600);
    };

    // 3. "Tap to Open" interaction
    const startIntro = () => {
        hasStarted = true;

        console.log("Interaction detected. Activating media...");

        // Prime secondary videos for mobile autoplay/low-power-mode bypass
        if (heroVideo) heroVideo.play().catch(() => {});
        if (featuredVideo) featuredVideo.play().catch(() => {});

        // CRITICAL: Play both immediately. 
        // Since Video is MUTED, the browser's "Activation Trust" is 100% focused on naming the BG Music.
        if (bgMusic) {
            bgMusic.play().then(() => {
                console.log("Music Playing Successfully");
            }).catch(e => {
                console.error("Music Play Failed:", e);
            });
        }

        // Muted video play is almost always allowed instantly on click
        introVideo.play().catch(e => console.warn("Video Play Blocked", e));

        // UI Animations
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(() => { overlay.style.display = 'none'; }, 400);

        const onVideoPlay = () => {
            introVideo.removeEventListener('playing', onVideoPlay);
            introVideo.addEventListener('ended', triggerTransition, { once: true });
        };
        introVideo.addEventListener('playing', onVideoPlay);
    };

    // Use a single click listener for highest compatibility
    overlay.addEventListener('click', startIntro);

    // 4. Background Music Fade & Controls
    if (bgMusic) {
        // Smooth 5-second Fade Out before ending
        bgMusic.addEventListener('timeupdate', () => {
            const timeLeft = bgMusic.duration - bgMusic.currentTime;
            if (timeLeft <= 5 && timeLeft > 0) {
                // Linear volume ramp down
                bgMusic.volume = Math.max(0, timeLeft / 5);
            }
        });

        // Mute Toggle Handler
        bgMusicToggle.addEventListener('click', () => {
            const isMuted = !bgMusic.muted;
            bgMusic.muted = isMuted;

            // Swap icons
            if (isMuted) {
                musicUnmutedIcon.classList.add('hidden');
                musicMutedIcon.classList.remove('hidden');
            } else {
                musicUnmutedIcon.classList.remove('hidden');
                musicMutedIcon.classList.add('hidden');
            }
        });
    }


    /* ════════════════════════════════════════════════════════
       LAYER 2 — MAIN CONTENT INIT
       ════════════════════════════════════════════════════════ */
    function initMainContent() {

        // ── Scroll Reveal ─────────────────────────────────
        const revealEls = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));


        // ── Floating Petals ───────────────────────────────
        const petalsContainer = document.getElementById('petalsContainer');
        if (petalsContainer) {
            const count = 22;
            for (let i = 0; i < count; i++) {
                const petal     = document.createElement('div');
                petal.className = 'petal';
                const size      = 7 + Math.random() * 13;
                const left      = Math.random() * 100;
                const dur       = 14 + Math.random() * 20;
                const delay     = (Math.random() * -28);
                const rot       = Math.random() * 360;
                const opacity   = 0.06 + Math.random() * 0.16;
                petal.style.cssText = [
                    `left: ${left}%`,
                    `width: ${size}px`,
                    `height: ${(size * 1.65).toFixed(1)}px`,
                    `animation-duration: ${dur}s`,
                    `animation-delay: ${delay}s`,
                    `transform: rotate(${rot}deg)`,
                    `opacity: ${opacity.toFixed(2)}`
                ].join(';');
                petalsContainer.appendChild(petal);
            }
        }


        // ── Hero Parallax (scroll + gyroscope + mouse) ────
        const heroParallax = document.getElementById('heroParallax');
        if (heroParallax) {
            let gyroActive = false;

            // Scroll-based vertical shift
            const onScroll = () => {
                if (gyroActive) return;
                const shift = window.scrollY * 0.22;
                heroParallax.style.transform = `translateY(${shift}px)`;
            };
            window.addEventListener('scroll', onScroll, { passive: true });

            // Gyroscope (mobile)
            const handleOrientation = (e) => {
                if (e.gamma === null || e.beta === null) return;
                gyroActive = true;
                const x = Math.max(-20, Math.min(20, e.gamma)) / 20;
                const y = Math.max(-30, Math.min(30, (e.beta - 20))) / 30;
                heroParallax.style.transform = `translate(${x * 16}px, ${y * 10}px)`;
            };

            if (typeof DeviceOrientationEvent !== 'undefined') {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ requires permission gesture
                    document.addEventListener('click', () => {
                        DeviceOrientationEvent.requestPermission()
                            .then(state => {
                                if (state === 'granted') {
                                    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
                                }
                            })
                            .catch(() => {});
                    }, { once: true });
                } else {
                    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
                }
            }

            // Mouse parallax (desktop fallback)
            document.addEventListener('mousemove', (e) => {
                if (gyroActive) return;
                const x = (e.clientX / window.innerWidth  - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;
                const scrollShift = window.scrollY * 0.22;
                heroParallax.style.transform =
                    `translate(${x * 14}px, calc(${y * 8}px + ${scrollShift}px))`;
            }, { passive: true });
        }


        // ── 'Bulletproof' Proposal Sticky Scroll ─────────
        const proposalWrapper = document.getElementById('proposalWrapper');
        const proposalBlocks  = document.querySelectorAll('.wc-proposal__block');
        const proposalSensors = document.querySelectorAll('.wc-proposal-sensor');
        const proposalCounter = document.getElementById('proposalCounter');
        const proposalFill    = document.getElementById('proposalFill');

        if (proposalWrapper && proposalBlocks.length && proposalSensors.length) {
            const total = proposalBlocks.length;
            let activeIdx = 0;

            // Cache measurements for progress bar
            let wrapperTop    = 0;
            let wrapperHeight = 0;
            let windowHeight  = 0;

            const refreshMeasurements = () => {
                const rect    = proposalWrapper.getBoundingClientRect();
                wrapperTop    = rect.top + window.pageYOffset;
                wrapperHeight = proposalWrapper.offsetHeight;
                windowHeight  = window.innerHeight;
            };

            const setBlock = (next) => {
                const nextIdx = parseInt(next, 10);
                if (nextIdx === activeIdx) return;
                
                proposalBlocks[activeIdx].classList.add('exiting');
                proposalBlocks[activeIdx].classList.remove('active');
                const prev = activeIdx;
                activeIdx  = nextIdx;
                proposalBlocks[nextIdx].classList.add('active');
                
                setTimeout(() => {
                    proposalBlocks[prev].classList.remove('exiting');
                }, 750);
            };

            // 1. CHAPTER SWITCHING (IntersectionObserver)
            // This is the "Bulletproof" way: Native browser triggers, no jitter.
            const sensorObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // We look for sensors crossing the middle of the screen
                    if (entry.isIntersecting) {
                        setBlock(entry.target.dataset.index);
                    }
                });
            }, {
                rootMargin: "-25% 0px -25% 0px", // Trigger near center
                threshold: 0 // As soon as it enters the zone
            });

            proposalSensors.forEach(sensor => sensorObserver.observe(sensor));

            // 2. PROGRESS BAR (Smooth Scroll with suspension)
            let isWrapperVisible = false;
            let ticking = false;

            const updateProgress = () => {
                if (!isWrapperVisible) {
                    ticking = false;
                    return;
                }
                const scrolled = window.pageYOffset - wrapperTop;
                const scrollable = wrapperHeight - windowHeight;
                if (scrollable <= 0) {
                    ticking = false;
                    return;
                }

                const progress = Math.max(0, Math.min(1, scrolled / scrollable));
                
                if (proposalCounter) {
                    const blockIdx = Math.min(Math.floor(progress * total), total - 1);
                    const cur = String(blockIdx + 1).padStart(2, '0');
                    const tot = String(total).padStart(2, '0');
                    proposalCounter.textContent = `${cur}\u2009/\u2009${tot}`;
                }

                if (proposalFill) {
                    // Use scaleY for maximum mobile performance
                    proposalFill.style.transform = `scaleY(${Math.max(0.03, progress)})`;
                }

                // Handle Scroll Hint Visibility
                const scrollHint = document.getElementById('proposalScrollHint');
                if (scrollHint) {
                    // Hide hint if we're near the end of the sticky section (e.g. 90% progress)
                    if (progress > 0.88) {
                        scrollHint.style.opacity = '0';
                        scrollHint.style.transform = 'translateX(-50%) translateY(10px)';
                    } else {
                        scrollHint.style.opacity = '0.8';
                        scrollHint.style.transform = 'translateX(-50%) translateY(0)';
                    }
                }

                ticking = false;
            };

            const onScroll = () => {
                if (!ticking && isWrapperVisible) {
                    requestAnimationFrame(updateProgress);
                    ticking = true;
                }
            };

            // Only listen to scroll if the section is on screen
            const wrapperObserver = new IntersectionObserver((entries) => {
                isWrapperVisible = entries[0].isIntersecting;
                if (isWrapperVisible) {
                    refreshMeasurements();
                    updateProgress();
                }
            }, { threshold: 0 });

            wrapperObserver.observe(proposalWrapper);
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', () => { if (isWrapperVisible) refreshMeasurements(); }, { passive: true });

            refreshMeasurements();
            updateProgress();
        }


        // ── Simple Static Countdown ──────────────────────────
        (function initFlipClock() {
            const FC_TARGET   = new Date('2026-07-12T18:00:00');
            const FC_UNITS    = ['days', 'hours', 'mins', 'secs'];
            const fcPrev      = { days: null, hours: null, mins: null, secs: null };
            const fcLive      = document.getElementById('fcLive');

            function fcPad(n) { return String(n).padStart(2, '0'); }

            function fcRemaining() {
                const diff = Math.max(0, FC_TARGET - Date.now());
                return {
                    days:  Math.floor(diff / 86400000),
                    hours: Math.floor((diff % 86400000) / 3600000),
                    mins:  Math.floor((diff % 3600000)  / 60000),
                    secs:  Math.floor((diff % 60000)    / 1000)
                };
            }

            function fcUpdate() {
                const t = fcRemaining();
                let changed = false;
                FC_UNITS.forEach(unit => {
                    if (t[unit] !== fcPrev[unit]) {
                        const str = fcPad(t[unit]);
                        // Uses the updated simpler class
                        const el  = document.querySelector(`.wc-countdown-simple__unit[data-unit="${unit}"]`);
                        if (el) {
                            const valNode = el.querySelector('.fc-val');
                            if (valNode) valNode.textContent = str;
                        }
                        fcPrev[unit] = t[unit];
                        changed = true;
                    }
                });
                
                if (changed && fcLive) {
                    fcLive.textContent = `${t.days} days, ${t.hours} hours, ${t.mins} minutes, ${t.secs} seconds remaining`;
                }
            }

            // Initialize statically
            fcUpdate();
            setInterval(fcUpdate, 1000);
        })();

        // ── RSVP Form ─────────────────────────────────────
        const rsvpForm    = document.getElementById('rsvpForm');
        const rsvpSuccess = document.getElementById('rsvpSuccess');
        const toggleBtns  = document.querySelectorAll('.wc-rsvp__toggle-btn');

        // Attend / Decline toggle
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            });
        });

        // Form submission
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Validate name
                const nameInput = rsvpForm.querySelector('#rsvpName');
                if (nameInput && !nameInput.value.trim()) {
                    nameInput.style.borderColor = 'rgba(220, 100, 80, 0.6)';
                    nameInput.focus();
                    setTimeout(() => {
                        nameInput.style.borderColor = '';
                    }, 2000);
                    return;
                }

                // Trigger Outro Immediately
                triggerOutro();

                // Animate out form
                rsvpForm.style.opacity   = '0';
                rsvpForm.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    rsvpForm.style.display = 'none';
                }, 400);
            });
        }

        // ── Cinematic Outro Reveal ────────────────────────
        function triggerOutro() {
            const outro = document.getElementById('outro-overlay');
            if (!outro) return;

            outro.style.display = 'flex';
            outro.removeAttribute('hidden');
            
            // Allow display:flex to take effect before adding class
            requestAnimationFrame(() => {
                outro.classList.add('active');
                outro.setAttribute('aria-hidden', 'false');
            });
        }


        // ── Info card 3D tilt on hover (desktop) ──────────
        const infoCards = document.querySelectorAll('.wc-info__card');
        infoCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect  = card.getBoundingClientRect();
                const x     = (e.clientX - rect.left) / rect.width  - 0.5;
                const y     = (e.clientY - rect.top)  / rect.height - 0.5;
                card.style.transform = `
                    translateY(-3px)
                    rotateX(${(-y * 6).toFixed(2)}deg)
                    rotateY(${(x * 6).toFixed(2)}deg)
                `;
                card.style.perspective = '800px';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform   = '';
                card.style.perspective = '';
            });
        });

    } // end initMainContent()

});


/* ══════════════════════════════════════════════════════════
   TRANSLATION ENGINE — English ↔ Arabic
   ══════════════════════════════════════════════════════════ */
const translations = {
    en: {
        tapToOpen:         'Tap to Open',
        countdownEyebrow:  'COUNTING DOWN TO THE MAGIC',
        days:              'DAYS',
        hours:             'HOURS',
        mins:              'MINS',
        secs:              'SECS',
        scrollToExplore:   'Scroll to explore',
        welcomeTitle:      'Welcome!',
        welcomeText:       'We warmly invite you to celebrate our wedding day with us in the beautiful city of Amman, Jordan.\nWe look forward to sharing this unforgettable moment with our most special people.',
        dayProgramme:      'Day Programme',
        eventDate:         '12 July 2026',
        arrival:           'ARRIVAL',
        fashionShow:       'FASHION SHOW',
        makeupShow:        'MAKEUP & HAIR STYLING SHOW',
        jewelryShow:       'JEWELRY SHOW',
        entertainment:     'ENTERTAINMENT HIGHLIGHTS',
        prizeDraw:         'EXCLUSIVE PRIZE DRAW',
        weddingPackages:   'COMPREHENSIVE WEDDING PACKAGES',
        forCouples:        'FOR LUCKY COUPLES',
        swipe:             'SWIPE TO EXPLORE',
        ch01:              'Chapter 01',
        ch01Title:         'The Wedding Gallery <em>2026</em>',
        ch01By:            'by tamara abdullah',
        ch01Sub:           'In collaboration with the Princess Taghrid Institute for Development and Training',
        ch02:              'Chapter 02',
        aboutUsTitle:      'About Us:',
        aboutUsText:       'The Wedding Gallery is a premier event platform organized by a professional team with extensive expertise in large-scale exhibitions, strategic partnerships, and luxury brand activation, with a dedicated focus on operational excellence and commercial impact.',
        ch03:              'Chapter 03',
        overviewTitle:     'Exhibition Overview:',
        overviewText1:     'The Wedding Gallery 2026 is the ultimate destination for bridal excellence, bringing together the most prestigious names in bridal fashion, event planning, beauty, décor, and luxury services under one roof.',
        overviewText2:     'Designed to inspire and connect future couples, the exhibition offers a unique experience that blends creativity with professional expertise. It features interactive displays, high-end fashion shows, and specialized exhibit halls.',
        ch04:              'Chapter 04',
        expLabel:          'Your Experience:',
        expTitle:          'The Experience',
        expText:           'An extraordinary journey where art meets elegance and distinction. Every detail is meticulously crafted to inspire you and turn the wedding of your dreams into a refined reality.',
        venueName:         'Grand Views',
        addressLine:       'Right Service Rd,',
        addressRegion:     'Amman – Jordan',
        rsvpEyebrow:       'We Hope to See You',
        rsvpTitle:         'Kindly Reply',
        nameLabel:         'Your Full Name',
        namePlaceholder:   'Enter your name',
        guestsLabel:       'Number of Guests',
        guest1:            '1 Guest',
        guest2:            '2 Guests',
        guest3:            '3 Guests',
        guest4:            '4+ Guests',
        joinLabel:         'Will You Join Us?',
        accept:            'Joyfully Accept',
        decline:           'Regretfully Decline',
        dietaryLabel:      'Dietary Requirements',
        dietaryPlaceholder:'Any special dietary needs or notes...',
        sendRsvp:          'Send RSVP',
        successText:       'Thank you! We look forward to celebrating with you.',
        footerTagline:     'With Love & Gratitude',
        footerDate:        'July 12, 2026',
    },
    ar: {
        tapToOpen:         'اضغط لفتح الدعوة',
        countdownEyebrow:  'العدّ التنازلي نحو اللحظة السحرية',
        days:              'أيام',
        hours:             'ساعات',
        mins:              'دقائق',
        secs:              'ثوانٍ',
        scrollToExplore:   'مرّر للاستكشاف',
        welcomeTitle:      'أهلاً وسهلاً!',
        welcomeText:       'يسعدنا دعوتكم للاحتفال معنا بهذه المناسبة الاستثنائية في مدينة عمّان الجميلة.\nنتطلع إلى مشاركة هذه اللحظة التي لا تُنسى مع أعزّ الناس على قلوبنا.',
        dayProgramme:      'البرنامج اليومي',
        eventDate:         '١٢ يوليو ٢٠٢٦',
        arrival:           'الاستقبال',
        fashionShow:       'عرض الأزياء',
        makeupShow:        'عرض المكياج وتصفيف الشعر',
        jewelryShow:       'عرض المجوهرات',
        entertainment:     'فقرات الترفيه',
        prizeDraw:         'السحب على الجوائز الحصرية',
        weddingPackages:   'باقات الزفاف الشاملة',
        forCouples:        'للأزواج المحظوظين',
        swipe:             'اسحب للاستكشاف',
        ch01:              'الفصل الأول',
        ch01Title:         'معرض الزفاف <em>٢٠٢٦</em>',
        ch01By:            'بقلم تمارا عبدالله',
        ch01Sub:           'بالتعاون مع معهد الأميرة تغريد للتنمية والتدريب',
        ch02:              'الفصل الثاني',
        aboutUsTitle:      'من نحن:',
        aboutUsText:       'معرض الزفاف هو منصة فعاليات رائدة، ينظّمها فريق احترافي يمتلك خبرة واسعة في المعارض الكبرى، والشراكات الاستراتيجية، وتفعيل العلامات التجارية الفاخرة، مع التركيز المستمر على التميّز التشغيلي والأثر التجاري.',
        ch03:              'الفصل الثالث',
        overviewTitle:     'نظرة عامة على المعرض:',
        overviewText1:     'معرض الزفاف ٢٠٢٦ هو الوجهة الأمثل لروعة العرائس، حيث يجمع أرقى الأسماء في عالم الأزياء والتخطيط للحفلات والجمال والديكور والخدمات الفاخرة تحت سقف واحد.',
        overviewText2:     'صُمّم المعرض لإلهام الأزواج المقبلين وتوحيد مساراتهم، إذ يقدّم تجربة فريدة تمزج الإبداع بالخبرة المهنية، من خلال عروض تفاعلية وعروض أزياء راقية وقاعات متخصصة.',
        ch04:              'الفصل الرابع',
        expLabel:          'تجربتكم:',
        expTitle:          'التجربة',
        expText:           'رحلة استثنائية حيث يلتقي الفن بالأناقة والتميّز. كل تفصيلة صُممت بعناية فائقة لتلهمكم وتحوّل زفافكم المنشود إلى واقعٍ مُعاش بكل رقيّ.',
        venueName:         'غراند فيوز',
        addressLine:       'طريق الخدمة الأيمن،',
        addressRegion:     'عمّان – الأردن',
        rsvpEyebrow:       'نأمل أن نراكم',
        rsvpTitle:         'تفضّلوا بالرد',
        nameLabel:         'الاسم الكامل',
        namePlaceholder:   'أدخل اسمك',
        guestsLabel:       'عدد الضيوف',
        guest1:            'ضيف واحد',
        guest2:            'ضيفان',
        guest3:            '٣ ضيوف',
        guest4:            '٤ ضيوف أو أكثر',
        joinLabel:         'هل ستنضمون إلينا؟',
        accept:            'بكل سرور',
        decline:           'مع الأسف، لن أتمكن',
        dietaryLabel:      'متطلبات غذائية خاصة',
        dietaryPlaceholder:'أي احتياجات أو ملاحظات غذائية خاصة...',
        sendRsvp:          'إرسال التأكيد',
        successText:       'شكراً جزيلاً! نتطلع للاحتفال معكم.',
        footerTagline:     'بكل المحبة والامتنان',
        footerDate:        '١٢ يوليو ٢٠٢٦',
    }
};

let currentLang = 'en';

function applyTranslations(lang) {
    const t = translations[lang];
    const html = document.documentElement;

    // Swap lang & dir on <html>
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Update all tagged text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key] !== undefined) {
            el.innerHTML = t[key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key] !== undefined) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // Update toggle button label
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = lang === 'ar' ? 'AR | EN' : 'EN | AR';
        langBtn.classList.toggle('lang-ar', lang === 'ar');
    }
}

// Wire up the button
document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ar' : 'en';
            applyTranslations(currentLang);
        });
    }
});
