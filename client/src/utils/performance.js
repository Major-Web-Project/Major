export const measureFPS = () => {
  let lastFrame = performance.now();
  let count = 0;
  return () => {
    const now = performance.now();
    count++;
    if (now - lastFrame >= 1000) {
      console.log(`FPS: ${count}`);
      count = 0;
      lastFrame = now;
    }
  };
};
