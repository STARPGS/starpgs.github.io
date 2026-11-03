(() => {
  if (window.bgAnimationRestoreInstalled) return;
  window.bgAnimationRestoreInstalled = true;

  const savedTimes = new WeakMap();
  const getNodes = root => [root, ...root.querySelectorAll("*")];

  document.addEventListener("turbo:before-render", () => {
    const root = document.getElementById("global-bg");
    if (!root) return;

    getNodes(root).forEach(el => {
      const animations = el.getAnimations();
      if (animations.length) {
        savedTimes.set(el, animations.map(animation => animation.currentTime));
      }
    });
  });

  document.addEventListener("turbo:render", () => {
    requestAnimationFrame(() => {
      const root = document.getElementById("global-bg");
      if (!root) return;

      getNodes(root).forEach(el => {
        const times = savedTimes.get(el);
        if (!times) return;

        el.getAnimations().forEach((animation, i) => {
          if (times[i] != null) animation.currentTime = times[i];
        });
      });
    });
  });
})();
