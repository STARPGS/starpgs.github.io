// This runs once per session. 
// The 100ms delay ensures the "Hard Load" CSS animations actually trigger 
// before we add the class that blocks them for the rest of the session.
setTimeout(() => {
    document.documentElement.classList.add("site-loaded");
}, 100);


function fastScrollToTop(duration = 200) {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";

    const start = window.scrollY;
    const startTime = performance.now();

    function animate(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        window.scrollTo(0, start * (1 - ease));

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            root.style.scrollBehavior = previousBehavior;
        }
    }

    requestAnimationFrame(animate);
}



// ============================================================
// 1. GLOBAL CLICK HANDLER (Transitions & Menu)
// ============================================================
document.addEventListener("click", (e) => {
    // --- SANDWICH MENU LOGIC ---
    const burger = e.target.closest(".navbar-burger"); 
    if (burger) {
        const targetId = burger.dataset.target;
        const targetMenu = document.getElementById(targetId);
        if (targetMenu) {
            burger.classList.toggle("is-active");
            targetMenu.classList.toggle("is-active");
        }
        return; 
    }

    // --- JRPG SLIDE OUT LOGIC ---
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("javascript:")) return;

    if (link.dataset.turbo === "false") return;

    const targetUrl = new URL(href, window.location.href);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") return;

    const currentUrl = new URL(window.location.href);

    const isSamePage = targetUrl.hostname === currentUrl.hostname && 
                       targetUrl.pathname === currentUrl.pathname;

    if (isSamePage) {
        e.preventDefault(); 

        if (targetUrl.hash) {
            const targetElement = document.getElementById(targetUrl.hash.substring(1));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // 1. Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // 2. Clean the URL: Remove the hash if it exists
            if (window.location.hash) {
                // This replaces the current URL in the address bar with the version without the hash
                const cleanUrl = window.location.pathname + window.location.search;
                history.replaceState(null, "", cleanUrl);
            }
        }
        return;
    }

    const isInternal = 
        href.startsWith("/") || 
        href.startsWith(window.siteConfig.baseurl) || 
        href.startsWith(window.siteConfig.url) || 
        targetUrl.hostname === window.location.hostname ||
        (!href.startsWith("http") && !href.startsWith("//"));

    if (isInternal) {
        e.preventDefault(); 
        const content = document.getElementById("content-area");
        const curtain = document.getElementById("turbo-curtain");

        if (content && curtain) {
            curtain.classList.add("active");
            content.classList.add("slide-out"); 
            // Scroll to top in exactly 200ms
            fastScrollToTop(200);
            setTimeout(() => { 
                Turbo.visit(href); 
            }, 200); 
        } else {
            window.location.href = href;
        }
    }
});

// ============================================================
// 2. PAGE ENTRANCE HANDLER (Slide-In)
// ============================================================
document.addEventListener("turbo:load", () => {
    if (!document.documentElement.classList.contains("site-loaded")) {
        return;
    }

    const content = document.getElementById("content-area");
    const curtain = document.getElementById("turbo-curtain");

    // 1. HIDE IMMEDIATELY: Prevent the 1-frame flash
    if (content) {
        content.style.visibility = 'hidden';
    }

    // 2. SETTLE: Give the DOM a moment to stabilize
    setTimeout(() => {
        const originalScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';

        requestAnimationFrame(() => {
            // 3. SNAP: Move to top/hash while content is still hidden
            const target = window.location.hash 
                ? document.getElementById(window.location.hash.substring(1)) 
                : document.documentElement;

            if (target) {
                target.scrollIntoView({ behavior: 'auto', block: 'start' });
            }

            if (content) {
                // 4. REVEAL: Make visible now that scroll is corrected
                content.style.visibility = 'visible';

                // 5. ANIMATE & UNLOCK: Double rAF to trigger transition, then kill curtain
                content.classList.add("slide-in-start");
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        content.classList.remove("slide-in-start");
                        
                        // REMOVE CURTAIN LAST: Re-enable clicks only after animation starts
                        if (curtain) {
                            curtain.classList.remove("active");
                        }
                    });
                });
            }

            document.documentElement.style.scrollBehavior = originalScrollBehavior;
        });
    }, 20);
});

