// Lets Node resolve extensionless TS imports: './foo' -> './foo.ts' or './foo/index.ts'.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (!specifier.startsWith('.')) throw err;
    for (const suffix of ['.ts', '/index.ts']) {
      try {
        return await next(specifier + suffix, context);
      } catch {
        // try the next candidate
      }
    }
    throw err;
  }
}
