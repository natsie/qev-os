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
    this.controller?.abort("src attibute updated");
    const { signal } = (this.controller = new AbortController());

    fetch(this.src, { signal })
      .then((res) => {
        if (!res.ok) throw new Error("failed to fetch", res);
        return res.text();
      })
      .then((text) => {
        if (text.includes('const __vite__css = "')) {
          text = text.split("\n").find((l) => l.includes('const __vite__css = "'));
          text = text.replace('const __vite__css = "', "").slice(0, -1);
          text = text.replace(/\\n/g, "\n");
        }
        return Promise.resolve(text);
      })
      .then((text) => (this.textContent = text))
      .catch((err) => console.warn("Error while fetching stylesheet.", err));
  }
  attributeChangedCallback() {
    this.fetchStyle();
  }
}
customElements.define("fetchable-style", FetchableStyle, { extends: "style" });
export { FetchableStyle, FetchableStyle as default };
