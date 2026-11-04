// This runs immediately on the first page load.
// It marks the site as "loaded" so that the navbar/footer animations 
// only play once and never again during Turbo navigations.
document.documentElement.classList.add("site-loaded");


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
        e.preventDefault(); // Stop Turbo from reloading the page in all "same page" cases

        if (targetUrl.hash) {
            const targetElement = document.getElementById(targetUrl.hash.substring(1));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // No hash present, just scroll to the top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const content = document.getElementById("content-area");
    const curtain = document.getElementById("turbo-curtain");

    if (curtain) {
        curtain.classList.remove("active");
    }


    // INSTANT SNAP: Force the browser to the right spot immediately 
    // before any animations trigger.
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }


    if (content) {
        // Snap new page to the right, then slide into center
        content.classList.add("slide-in-start");
        void content.offsetWidth; 
        content.classList.remove("slide-in-start");
    }
});
