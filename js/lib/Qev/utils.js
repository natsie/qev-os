export function eventDispatch(target, eventName, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const data = {};

    // Set up timeout for rejecting the promise
    data.id = setTimeout(() => {
      target.removeEventListener(eventName, data.handler);
      reject(
        new Error(`Event '${eventName}' did not fire within ${timeout}ms`),
      );
    }, timeout);

    // Event handler to resolve the promise
    data.handler = (event) => {
      clearTimeout(data.id); // Clear timeout once event is fired
      resolve(event); // Resolve with the event object
    };

    // Add event listener with { once: true } for automatic removal
    target.addEventListener(eventName, data.handler, { once: true });
  });
}

export async function loadScript(src, globalVariable, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    document.head.appendChild(script);

    let timer = setTimeout(() => {
      script.remove();
      reject(new Error(`Failed to load script: ${src} (timeout)`));
    }, timeout);

    script.src = src;
    script.onload = () => {
      clearTimeout(timer);
      const v = (script.remove(), window[globalVariable]);
      delete window[globalVariable];
      resolve(v);
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
  });
}
