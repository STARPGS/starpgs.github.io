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
