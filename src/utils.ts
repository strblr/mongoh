export function isFunction(value: unknown) {
  return typeof value === "function";
}

export function isArray(value: unknown) {
  return Array.isArray(value);
}

export function isPlainObject(value: unknown): value is object {
  if (
    typeof value !== "object" ||
    value === null ||
    Object.prototype.toString.call(value) !== "[object Object]"
  ) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof Ctor == "function" &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) ==
      Function.prototype.toString.call(Object)
  );
}
