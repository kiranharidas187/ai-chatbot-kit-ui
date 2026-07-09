type PlainObject = Record<string, unknown>;

/**
 * Only plain objects are merged recursively. Anything else — arrays, class
 * instances (e.g. adapter objects), functions, primitives — replaces the base
 * value wholesale.
 */
function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function looksLikeAdapter(value: PlainObject): boolean {
  return Object.values(value).some((v) => typeof v === 'function');
}

export function deepMerge<T extends object>(base: T, override: unknown): T {
  if (!isPlainObject(override)) return base;
  const result: PlainObject = { ...(base as PlainObject) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = result[key];
    result[key] =
      isPlainObject(baseValue) &&
      isPlainObject(value) &&
      !looksLikeAdapter(value)
        ? deepMerge(baseValue, value)
        : value;
  }
  return result as T;
}
