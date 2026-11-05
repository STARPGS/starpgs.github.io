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
    // --- SANDWICH MENU TOGGLE ---
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

    // --- CLOSE MENU ON LINK CLICK ---
    const navItem = e.target.closest(".navbar-item");
    if (navItem) {
        // FIX: Check if this item is a dropdown trigger.
        // It's a trigger if it contains a .navbar-dropdown or is immediately followed by one.
        const isDropdownTrigger = navItem.querySelector('.navbar-dropdown') || navItem.nextElementSibling?.classList.contains('navbar-dropdown');
        const isInsideDropdown = navItem.closest('.navbar-dropdown');

        // If it's a trigger and NOT a link inside a dropdown, keep the menu open
        if (isDropdownTrigger && !isInsideDropdown) {
            return; 
        }

        const menu = navItem.closest(".navbar-menu");
        if (menu && menu.classList.contains("is-active")) {
            menu.classList.remove("is-active");
            const burgerToClose = document.querySelector(`.navbar-burger[data-target="${menu.id}"]`);
            if (burgerToClose) {
                burgerToClose.classList.remove("is-active");
            }
        }
        return;
    }

    // --- CLOSE MENU ON OUTSIDE CLICK ---
    if (!e.target.closest(".navbar-menu") && !e.target.closest(".navbar-burger")) {
        const activeMenu = document.querySelector(".navbar-menu.is-active");
        if (activeMenu) {
            activeMenu.classList.remove("is-active");
            const burgerToClose = document.querySelector(`.navbar-burger[data-target="${activeMenu.id}"]`);
            if (burgerToClose) {
                burgerToClose.classList.remove("is-active");
            }
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
document.addEventListener("turbo:before-render", (event) => {
    const incoming = event.detail.newBody.querySelector("#content-area");
    if (incoming) {
        incoming.classList.add("slide-in-start");
    }
});

document.addEventListener("turbo:render", () => {
    const content = document.getElementById("content-area");
    if (!content || !content.classList.contains("slide-in-start")) {
        return;
    }

    void content.offsetWidth;
    requestAnimationFrame(() => {
        content.classList.remove("slide-in-start");
    });
});

document.addEventListener("turbo:load", () => {
    if (!document.documentElement.classList.contains("site-loaded")) {
        return;
    }

    const root = document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const target = window.location.hash
        ? document.getElementById(window.location.hash.substring(1))
        : null;

    if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    root.style.scrollBehavior = originalScrollBehavior;

    document.getElementById("turbo-curtain")?.classList.remove("active");
});

