document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("javascript:")) return;

    // Create a URL object to easily compare paths and origins
    // This resolves relative paths (/blog/) into absolute ones (https://site.com/blog/)
    const targetUrl = new URL(href, window.location.origin);
    const currentUrl = new URL(window.location.href);

    // 1. SAME-PAGE DETECTION (The Root Page Check)
    // If the hostname and pathname are the same, we are on the same page
    const isSamePage = targetUrl.hostname === currentUrl.hostname && 
                       targetUrl.pathname === currentUrl.pathname;

    if (isSamePage) {
        // If we are on the same page and there is a hash, smooth scroll
        if (targetUrl.hash) {
            e.preventDefault();
            const targetElement = document.getElementById(targetUrl.hash.substring(1));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        // We return here so that same-page links NEVER trigger the slide animation
        return;
    }

    // 2. ROBUST INTERNAL LINK DETECTION
    // Now we only reach this point if we are actually changing pages
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
            }, 500); 
        } else {
            window.location.href = href;
        }
    }
});

document.addEventListener("turbo:load", () => {
    // 3. THE ENTRANCE GUARD
    // This remains critical: if we landed on a page via a hash (different page),
    // we skip the slide-in so the browser can jump to the anchor.
    if (window.location.hash) {
        return; 
    }

    const content = document.getElementById("content-area");
    const curtain = document.getElementById("turbo-curtain");

    if (content && curtain) {
        curtain.classList.remove("active");
        content.classList.add("slide-in-start");
        void content.offsetWidth; 
        content.classList.remove("slide-in-start");
    }
});
