/* GLOBAL STATE: These must live outside the listeners to be accessible for cleanup */
let jrpgIsSkipped = false;
let jrpgSequenceStarted = false;
let jrpgIntersectionObserver = null;

document.addEventListener("turbo:load", () => {
    /* Reset state for the new page */
    jrpgIsSkipped = false;
    jrpgSequenceStarted = false;

    const jrpgTextElements = document.querySelectorAll('.jrpg-typewriter-container > *');
    const jrpgSkipBtn = document.getElementById('jrpg-typewriter-skip-button');
    
    if (jrpgTextElements.length === 0) return; /* Stop if no typewriter elements found */

    if (jrpgSkipBtn) {
        jrpgSkipBtn.style.display = 'block';
        jrpgSkipBtn.addEventListener('click', () => {
            jrpgIsSkipped = true;
            jrpgRevealAllText(jrpgTextElements);
        });
    }

    function wrapTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.classList.add('jrpg-typewriter-char');
                span.setAttribute('aria-hidden', 'true'); 
                span.textContent = char;
                fragment.appendChild(span);
            });
            node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const complexBlocks = ['IFRAME', 'IMG', 'VIDEO', 'H1', 'H2', 'H3', 'PRE', 'CODE', 'BR'];
            if (!complexBlocks.includes(node.tagName)) {
                Array.from(node.childNodes).forEach(child => wrapTextNodes(child));
            } else {
                node.classList.add('jrpg-typewriter-char');
            }
        }
    }

    jrpgTextElements.forEach(el => {
        const fullText = el.textContent.trim();
        if (fullText) el.setAttribute('aria-label', fullText);
        Array.from(el.childNodes).forEach(child => wrapTextNodes(child));
    });

    async function jrpgTypeParagraph(element) {
        if (jrpgIsSkipped) return;
        element.classList.add('jrpg-typewriter-active');
        const chars = element.querySelectorAll('.jrpg-typewriter-char');
        
        for (let i = 0; i < chars.length; i++) {
            if (jrpgIsSkipped) break;
            chars[i].classList.add('jrpg-typewriter-visible');
            
            let delay = 10;
            const charText = chars[i].textContent;
            if (chars[i].tagName === 'BR') delay = 500;
            else if (chars[i].tagName === 'IFRAME') delay = 50;
            else if (charText === '.' || charText === ',') delay = 200;

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    async function jrpgRunTypeSequence() {
        jrpgSequenceStarted = true;
        jrpgTextElements.forEach(el => el.style.setProperty('opacity', '1', 'important'));

        for (let i = 0; i < jrpgTextElements.length; i++) {
            if (jrpgIsSkipped) break;
            await jrpgTypeParagraph(jrpgTextElements[i]);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    function jrpgRevealAllText(elements) {
        elements.forEach(el => {
            el.style.setProperty('opacity', '1', 'important');
            el.classList.add('jrpg-typewriter-active');
            el.querySelectorAll('.jrpg-typewriter-char').forEach(c => c.classList.add('jrpg-typewriter-visible'));
        });
    }

    /* Initialize Observer and store it in the global variable */
    jrpgIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !jrpgSequenceStarted) {
            jrpgRunTypeSequence();
            jrpgIntersectionObserver.disconnect();
        }
    }, { threshold: 0.1 });

    jrpgIntersectionObserver.observe(jrpgTextElements[0]);
});

/* THE CLEANUP: This kills everything the moment the user leaves the page */
document.addEventListener('turbo:before-cache', () => {
    jrpgIsSkipped = true; /* Instantly kills all active async typing loops */
    if (jrpgIntersectionObserver) {
        jrpgIntersectionObserver.disconnect(); /* Stops the observer */
        jrpgIntersectionObserver = null;
    }
});
