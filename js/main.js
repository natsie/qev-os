import "./lib/FetchableStyle/FetchableStyle.js";
import { QevOS } from "./lib/Qev/Qev.js";

const mainEl = document.querySelector("main");
const qev = (window.qev = await new QevOS({
	view: mainEl,
	debug: true,
}).init());
qev.mountView();
