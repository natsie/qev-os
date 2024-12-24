function prop(mergeObj) {
  if (typeof mergeObj !== "object") return this;
  for (const [key, value] of Object.entries(mergeObj)) {
    this[key] = value;
  }
  return this;
}

export function QChain(obj) {
  if (typeof obj !== "object" || obj.__qchained) return obj;
  if (!obj.hasOwnProperty("prop")) obj.prop = prop;

  for (const prop in obj) {
    const _obj = obj; // make jshint happy
    if (typeof obj[prop] !== "function") continue;

    const func = obj[prop];
    obj[prop] = function () {
      const returnValue = func.call(this, ...arguments);
      return returnValue === undefined ? _obj : returnValue;
    };
  }
  obj.__qchained = true;
  return obj;
}
