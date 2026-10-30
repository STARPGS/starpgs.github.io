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
     * Preserves links, bold, italics, and treats iframes/images as single units.
     */
    function wrapTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.classList.add('jrpg-typewriter-char');
                span.setAttribute('aria-hidden', 'true'); // Hide individual letters from screen readers
                span.textContent = char;
                fragment.appendChild(span);
            });
            
            node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // These elements are treated as a single "character" unit (they pop in all at once)
            const complexBlocks = ['IFRAME', 'IMG', 'VIDEO', 'H1', 'H2', 'H3', 'PRE', 'CODE', 'BR'];
            
            if (!complexBlocks.includes(node.tagName)) {
                // If it's a simple tag (like <a>, <strong>, <em>), recurse inside it
                Array.from(node.childNodes).forEach(child => wrapTextNodes(child));
            } else {
                // If it's a complex block, just mark the whole block as a typewriter char
                node.classList.add('jrpg-typewriter-char');
            }
        }
    }

    // Initialize all elements
    jrpgTextElements.forEach(el => {
        // Accessibility: Provide the full text to screen readers immediately
        const fullText = el.textContent.trim();
        if (fullText) {
            el.setAttribute('aria-label', fullText);
        }
        
        // Process the DOM tree to add the typewriter spans
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
            
            // If the "character" is actually a video or image, pause slightly longer, and inbetween for line breaks
            const delay = chars[i].tagName === 'BR' ? 25 : (chars[i].tagName === 'IFRAME' ? 50 : 10);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Manages the order of paragraphs being typed
     */
    async function jrpgRunTypeSequence() {
        jrpgSequenceStarted = true;

        // Immediately remove the "FOUC" hide state for all blocks before starting animation
        jrpgTextElements.forEach(el => {
            el.style.setProperty('opacity', '1', 'important');
        });

        for (let i = 0; i < jrpgTextElements.length; i++) {
            if (jrpgIsSkipped) break;
            
            await jrpgTypeParagraph(jrpgTextElements[i]);
            
            // Small pause between paragraphs for readability
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

    // Trigger the sequence when the first element enters the viewport
    const jrpgIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !jrpgSequenceStarted) {
            jrpgRunTypeSequence();
            jrpgIntersectionObserver.disconnect();
        }
    }, { threshold: 0.1 });

    if (jrpgTextElements.length > 0) {
        jrpgIntersectionObserver.observe(jrpgTextElements[0]);
    }

    // Skip Button Event Listener
    if (jrpgSkipBtn) {
        jrpgSkipBtn.addEventListener('click', () => {
            jrpgIsSkipped = true;
            jrpgRevealAllText();
        });
    }
});
