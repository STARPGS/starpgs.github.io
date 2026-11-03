(() => {
  if (window.bgAnimationRestoreInstalled) return;
  window.bgAnimationRestoreInstalled = true;

  const containerId = "global-bg";
  const savedTimes = new WeakMap();

  function getNodes(root) {
    return [root, ...root.querySelectorAll("*")];
  }

  document.addEventListener("turbo:before-render", () => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const capturedAt = performance.now();

    getNodes(root).forEach(el => {
      const animations = el.getAnimations();
      if (!animations.length) return;

      savedTimes.set(el, {
        capturedAt,
        animations: animations.map(animation => ({
          time: animation.currentTime,
          rate: animation.playbackRate,
          state: animation.playState
        }))
      });
    });
  });

  document.addEventListener("turbo:render", () => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const restoredAt = performance.now();

    getNodes(root).forEach(el => {
      const saved = savedTimes.get(el);
      if (!saved) return;

      const elapsed = restoredAt - saved.capturedAt;

      el.getAnimations().forEach((animation, i) => {
        const old = saved.animations[i];
        if (!old || old.time == null) return;

        const advance = old.state === "running" ? elapsed * old.rate : 0;
        animation.currentTime = old.time + advance;
      });
    });
  });
})();
