import JSZip from "jszip";
import { loadScript } from "./utils.js";
import { QChain } from "./lib/QChain/QChain.js";
import { AppWindow } from "./components/web/AppWindow.js";

const virtualfs = await loadScript(
  import.meta.resolve("./lib/matrixai-virtualfs/virtualfs.js"),
  "virtualfs",
).catch((err) => {
  console.error(err);
  return null;
});

/**
 * @class QevOS
 * @classdesc A lightweight virtual OS emulation with a customizable filesystem and view.
 *
 * @param {Object} options - Options to configure QevOS.
 * @param {HTMLElement} [options.view] - The HTML element to serve as the view container.
 * @param {Object} [options.config] - Configuration options for QevOS.
 * @param {boolean} [options.debug=false] - Enable debug mode for verbose logging.
 */
class QevOS {
  static error = {
    INVALID_VIEW_TYPE: new TypeError(
      "Invalid view: Must be an instance of HTMLElement.",
    ),
  };
  static filesystemMethods = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "chownr",
    "close",
    "copyFile",
    "exists",
    "fallocate",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lseek",
    "lstat",
    "mkdir",
    "mkdirp",
    "mkdtemp",
    "mknod",
    "mmap",
    "open",
    "read",
    "readFile",
    "readdir",
    "readlink",
    "realpath",
    "rename",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "write",
    "writeFile",
  ];
  static defaultConfig = {
    fsStructure: {
      directories: [
        "/system",
        "/system/apps",
        "/system/config",
        "/user",
        "/user/documents",
        "/user/downloads",
        "/user/desktop",
      ],
    },
  };
  static AppWindow = AppWindow;
  static JSZip = JSZip;

  constructor({ view, config = {}, debug = false } = {}) {
    this.debug = debug;
    this.data = { view };
    this.view = view;
    this.config = { ...structuredClone(QevOS.defaultConfig), ...config };
    this.filesystem = new virtualfs.VirtualFS();
    this.id = crypto.randomUUID();
    this.log.start = performance.now();
  }

  get view() {
    return this.data.view;
  }

  set view(value) {
    if (!(value instanceof HTMLElement)) throw QevOS.error.INVALID_VIEW_TYPE;
    this.data.view = QChain(value);
    this.#initializeViewContent();
  }

  #initializeViewContent() {
    this.data.view.innerHTML = `<h1 style="font: normal 3rem 'Fira Code', monospace">Welcome to QevOS...=></h1>`;
  }

  log(type, ...args) {
    const elaspedTime = +(performance.now() - this.log.start).toFixed(2);
    switch (type) {
      case "info":
        console.log(
          "%c[QevOS] 🔖",
          "font-family: monospace; color: lightcyan",
          ...args,
        );
        break;
      case "warn":
        console.log(
          "%c[QevOS] ⚠",
          "font-family: monospace; color: yellow",
          ...args,
        );
        break;
      case "confirm":
        console.log(
          "%c[QevOS] ✅",
          "font-family: monospace; color: limegreen",
          ...args,
        );
        break;
      default:
        console.log(
          "%c[QevOS]",
          "font-family: monospace; color: gray",
          ...[type, ...args],
        );
        break;
    }
  }

  mountView() {
    this.debug && this.log("info", "Mounting view...");
    const body = document.body;

    if (!this.view) {
      this.debug && this.log("info", "Initialising view from DOM...");
      this.view = document.querySelector("div#qev-os");
      this.view = this.view || document.createElement("div");
    }

    !body.contains(this.view) && body.appendChild(this.view);

    this.view.id = "qev-os";
    this.debug && this.log("confirm", "Successfully mounted view.");
    return this;
  }

  bindInitialisers() {
    this.debug && this.log("info", "Binding initialisation functions...");
    for (const prop of Object.getOwnPropertyNames(this.init)) {
      if (typeof this.init[prop] !== "function") continue;
      this.init[prop] = this.init[prop].bind(this);
    }
    this.debug &&
      this.log("confirm", "Successfully bound initialisation functions.");
  }

  async init() {
    this.bindInitialisers();
    await this.init.fsPromisify(this.filesystem);
    await this.init.filesystem();
    return this;
  }
}

QevOS.prototype.init.fsPromisify = async function fsPromisify() {
  function promisify(func) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        func(...args, (...callbackArgs) => {
          const [error, ...results] = callbackArgs;
          if (error) reject(error);
          else resolve(results.length > 1 ? results : results[0]);
        });
      });
    };
  }

  const fs = this.filesystem;
  const p = (fs.promises = {});
  for (const method of QevOS.filesystemMethods) {
    p[method] = promisify(fs[method].bind(fs));
  }
};

QevOS.prototype.init.filesystem = async function filesystemInit() {
  const fs = this.filesystem.promises;
  await Promise.all(
    this.config.fsStructure.directories.map((dir) =>
      fs.mkdir(dir).catch((err) => {
        if (err.code !== "EEXIST") throw err;
        this.debug && this.log("info", `Directory already exists: ${dir}`);
      }),
    ),
  );
  this.debug && this.log("confirm", "Filesystem initialized.");
};

export { QevOS };
