// jshint -W030
import Sandbox from "../../lib/nyariv-sandboxjs/Sandbox.js";
import DOMPurify from "../../lib/cure53-dompurify/purify.es.mjs";
import { QChain } from "../../lib/QChain/QChain.js";

class AppWindow extends HTMLElement {
  static get SandboxProperties() {
    return {
      prototypeWhitelist: [
        ...Sandbox.SAFE_PROTOTYPES,
        [DocumentFragment, new Set()],
        [Element, new Set()],
        [Node, new Set(["textContent"])],
      ],
    };
  }
  static get defaultScope() {
    return {
      dom: {
        append: (parent, ...children) => parent.append(...children),
        appendChild: (parent, child) => parent.appendChild(child),
        createElement: (el, options) => document.createElement(el, options),
        query: (parent, selector) => parent.querySelector(selector),
      },
      math: {
        ...Object.getOwnPropertyNames(Math).reduce(
          (a, c) => ((a[c] = Math[c]), a),
          {},
        ),
        clamp(value, min = -Infinity, max = Infinity) {
          const _value = Number(value);
          const _min = typeof min !== "number" ? Number(min) : min;
          const _max = typeof max !== "number" ? Number(max) : max;
          for (const [v, n] of [
            [_value, "value"],
            [_min, "min"],
            [_max, "max"],
          ]) {
            if (!isNaN(v)) continue;
            throw new TypeError(
              `Invalid data type for the \`${n}\` argument of \`math.clamp\`: expected \`number\`.`,
            );
          }

          if (_value < _min) return min;
          if (_value > _max) return max;
          return value;
        },
        factorial(num) {
          if (typeof num !== "number" || isNaN(num)) {
            throw new TypeError(
              `\`math.factorial\` expected argument of type \`number\`, got \`${typeof num}\`.`,
            );
          }
          if (!Number.isInteger(num))
            throw new TypeError("`num` must be an integer value.");

          let factorial = 1;
          if (num > 1) for (let i = 0; i < num; i++) factorial *= i + 1;
          return factorial;
        },
      },
    };
  }
  static mutationHandler() {
    this.innerHTML = DOMPurify.sanitize(this.innerHTML);
  }
  constructor({ code = {}, scopes = [] } = {}) {
    super();
    const self = this;

    this.shadow = this.attachShadow({ mode: "closed" });
    this.sandbox = new Sandbox(AppWindow.SandboxProperties);
    this.scopes = [...scopes, { view: this.shadow }];
    this.mutationHandler = AppWindow.mutationHandler.bind(this);
    this.data = {
      controller: null,
      mutationObserver: QChain(
        new MutationObserver(this.mutationHandler),
      ).observe(this.shadow, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      }),
      code: {
        markup: "",
        scripts: [""],
      },
      compiled: { markup: null, scripts: null },
    };
    Object.entries(code).forEach(([key, value]) => (this.code[key] = value));
  }
  get code() {
    const self = this;
    return {
      get markup() {
        return self.data.code.markup;
      },
      set markup(value) {
        self.data.code.markup = value;
        self.data.compiled.markup = DOMPurify(value);
      },
      get scripts() {
        return self.data.code.scripts;
      },
      set scripts(value) {
        self.data.code.scripts = Array.from(value);
        self.data.compiled.scripts = self.data.code.scripts.map((script) => {
          return self.sandbox.compile(script)(
            ...self.scopes,
            AppWindow.defaultScope,
          );
        });
      },
    };
  }
  runScripts() {
    this.data.controller = new AbortController();
    return new Promise((resolve, reject) => {
      this.data.controller.signal.addEventListener("abort", reject);
      for (const script of this.data.compiled.scripts) {
        if (this.data.controller.signal.aborted) break;
        script.run();
      }
      resolve();
    });
  }
  connectedCallback() {
    this.data.controller?.abort();
    this.shadow.innerHTML = DOMPurify.sanitize(this.code.markup);
    this.runScripts();
  }
}
customElements.define("app-window", AppWindow);
export { AppWindow };
