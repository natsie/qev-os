// jshint -W030
import * as chai from "./lib/chai/chai.js";
import { eventDispatch } from "./utils.js";
await eventDispatch(document, "mocha-ready");

describe("test initialisation", () => {
  it("mocha is setup correctly", () => {
    chai.expect(window).to.have.property("mocha");
    chai.expect(window).to.have.property("Mocha");
    chai.expect(typeof window.describe).to.be.equal("function");
    chai.expect(typeof window.it).to.be.equal("function");
  });

  it("chai is setup correctly", () => {
    chai.expect(chai).not.to.be.undefined;
    chai.expect(typeof chai.assert).to.be.equal("function");
    chai.expect(typeof chai.expect).to.be.equal("function");
  });
});
mocha.run();
