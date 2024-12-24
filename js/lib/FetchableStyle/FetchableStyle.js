class FetchableStyle extends HTMLStyleElement {
  static get observedAttributes() {
    return ["src"];
  }

  constructor() {
    super();
    this.controller = null;
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    this.setAttribute("src", value);
  }

  fetchStyle() {
    if (!this.src) {
      console.warn("No src attribute provided. Skipping stylesheet fetch.");
      return;
    }

    this.controller?.abort(
      new DOMException("Fetch aborted: src attribute updated", "AbortError"),
    );
    const { signal } = (this.controller = new AbortController());

    fetch(this.src, { signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `Failed to fetch stylesheet: ${res.status} ${res.statusText}`,
          );
        return res.text();
      })
      .then((text) => {
        // Handle Vite-specific CSS output
        if (text.includes('const __vite__css = "')) {
          const viteLine = text
            .split("\n")
            .find((l) => l.includes('const __vite__css = "'));
          if (viteLine) {
            text = viteLine
              .replace('const __vite__css = "', "")
              .slice(0, -1)
              .replace(/\\n/g, "\n")
              .replace(/\\r/g, "")
              .replace(/\\/g, "");
          }
        }

        this.innerHTML = text; // Update the <style> element's content
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Error while fetching stylesheet.", err);
        }
      });
  }

  attributeChangedCallback(name) {
    if (name === "src") {
      this.fetchStyle();
    }
  }
}

customElements.define("fetchable-style", FetchableStyle, { extends: "style" });
export { FetchableStyle, FetchableStyle as default };
