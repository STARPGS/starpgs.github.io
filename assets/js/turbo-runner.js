// This runs once per session. 
// The 100ms delay ensures the "Hard Load" CSS animations actually trigger 
// before we add the class that blocks them for the rest of the session.
setTimeout(() => {
    document.documentElement.classList.add("site-loaded");
}, 100);


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
    // FIRST LOAD GUARD: Exit immediately on the very first visit
    if (!document.documentElement.classList.contains("site-loaded")) {
        return;
    }

    const content = document.getElementById("content-area");
    const curtain = document.getElementById("turbo-curtain");

    if (curtain) {
        curtain.classList.remove("active");
    }

    if (content) {
        content.style.visibility = 'hidden';
    }


    // 1. Force instant movement by overriding CSS smooth-scroll
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    // 2. Execute Snap and Animation in the same frame to prevent "fighting"
    requestAnimationFrame(() => {
        // UNIFIED SNAP: Use scrollIntoView for both hashes and the top of the page
        const target = window.location.hash 
            ? document.getElementById(window.location.hash.substring(1)) 
            : document.documentElement;

        if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }

        if (content) {
            content.style.visibility = 'visible';
            content.classList.add("slide-in-start");
            void content.offsetWidth; // Force reflow
            content.classList.remove("slide-in-start");
        }

        // Restore smooth scrolling for the user
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
    });
});
