// setTimeout is universal (Node/Bun/browser) but not in the ES2022 lib. Declared
// minimally here to avoid pulling DOM/node typings into a framework-agnostic pkg.
declare function setTimeout(handler: () => void, timeout?: number): unknown;
