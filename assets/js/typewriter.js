document.addEventListener('DOMContentLoaded', () => {
    // Target all direct children of the container (works with Jekyll's automatic <p> tags)
    const jrpgTextElements = document.querySelectorAll('.jrpg-typewriter-container > *');
    const jrpgSkipBtn = document.getElementById('jrpg-typewriter-skip-button');
    
    let jrpgIsSkipped = false;
    let jrpgSequenceStarted = false;

    // Show the skip button only if there is actually content to type
    if (jrpgTextElements.length > 0 && jrpgSkipBtn) {
        jrpgSkipBtn.style.display = 'block';
    }

    /**
     * Recursive function to wrap text in spans without destroying HTML tags.
     * Preserves links, bold, italics, and treats iframes/images/br as single units.
     */
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

    // Initialize all elements
    jrpgTextElements.forEach(el => {
        const fullText = el.textContent.trim();
        if (fullText) {
            el.setAttribute('aria-label', fullText);
        }
        Array.from(el.childNodes).forEach(child => wrapTextNodes(child));
    });

    /**
     * Handles the sequential reveal of characters/blocks within a single element
     */
    async function jrpgTypeParagraph(element) {
        if (jrpgIsSkipped) return;
        
        element.classList.add('jrpg-typewriter-active');
        
        const chars = element.querySelectorAll('.jrpg-typewriter-char');
        for (let i = 0; i < chars.length; i++) {
            if (jrpgIsSkipped) break;
            
            chars[i].classList.add('jrpg-typewriter-visible');
            
            // DELAY LOGIC:
            let delay = 10; // Standard letter speed
            const charText = chars[i].textContent;

            if (chars[i].tagName === 'BR') {
                delay = 500; // Long pause for line breaks
            } else if (chars[i].tagName === 'IFRAME') {
                delay = 50;  // Slight pause for videos
            } else if (charText === '.' || charText === ',') {
                delay = 200; // Minor pause for punctuation
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Manages the order of paragraphs being typed
     */
    async function jrpgRunTypeSequence() {
        jrpgSequenceStarted = true;

        // Remove "FOUC" hide state for all blocks immediately
        jrpgTextElements.forEach(el => {
            el.style.setProperty('opacity', '1', 'important');
        });

        for (let i = 0; i < jrpgTextElements.length; i++) {
            if (jrpgIsSkipped) break;
            
            await jrpgTypeParagraph(jrpgTextElements[i]);
            
            // Pause between <p> blocks
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    /**
     * Force reveals all hidden content immediately
     */
    function jrpgRevealAllText() {
        jrpgTextElements.forEach(el => {
            el.style.setProperty('opacity', '1', 'important');
            el.classList.add('jrpg-typewriter-active');
            el.querySelectorAll('.jrpg-typewriter-char').forEach(c => c.classList.add('jrpg-typewriter-visible'));
        });
    }

    const jrpgIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !jrpgSequenceStarted) {
            jrpgRunTypeSequence();
            jrpgIntersectionObserver.disconnect();
        }
    }, { threshold: 0.1 });

    if (jrpgTextElements.length > 0) {
        jrpgIntersectionObserver.observe(jrpgTextElements[0]);
    }

    if (jrpgSkipBtn) {
        jrpgSkipBtn.addEventListener('click', () => {
            jrpgIsSkipped = true;
            jrpgRevealAllText();
        });
    }
});
