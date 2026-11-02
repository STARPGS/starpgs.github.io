document.addEventListener("click", (e) => {
    // Fix: Use .closest("a") so clicking icons/spans inside links still works
    const link = e.target.closest("a");
    if (!link) return;

    const url = link.getAttribute("href");
    if (!url || url.startsWith("javascript:")) return;

    // 1. HANDLE SCROLL LINKS (#)
    if (url.startsWith("#")) {
        e.preventDefault();
        const targetElement = document.getElementById(url.substring(1));
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    // INTERNAL LINK DETECTION
    // Checks if the link is root-relative, baseurl-relative, domain-relative, or a simple path
    const isInternal = 
        url.startsWith("/") || 
        url.startsWith(window.siteConfig.baseurl) || 
        url.startsWith(window.siteConfig.url) || 
        (!url.startsWith("http") && !url.startsWith("//"));

    if (isInternal) {
        e.preventDefault(); 
        
        const content = document.getElementById("content-area");
        const curtain = document.getElementById("turbo-curtain");

        if (content && curtain) {
            curtain.classList.add("active"); 
            content.classList.add("slide-out"); 

            setTimeout(() => {
                Turbo.visit(url); 
            }, 500); 
        } else {
            window.location.href = url;
        }
    }
    // If not internal, the browser follows the link normally (External)
});

// ENTRANCE ANIMATION
document.addEventListener("turbo:load", () => {
    const content = document.getElementById("content-area");
    const curtain = document.getElementById("turbo-curtain");

    if (content && curtain) {
        curtain.classList.remove("active");

        // Snap new page to top immediately
        content.classList.add("slide-in-start");
        
        // Force reflow to trigger animation
        void content.offsetWidth;

        // Slide into center view
        content.classList.remove("slide-in-start");
    }
});
