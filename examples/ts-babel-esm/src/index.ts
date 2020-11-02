
import "./dir";
import * as mod from "./dir/mod";

export * from "./dir/mod";

async function foo() {
	const foo = await import("./dir/mod");
}

for(const x of [[1, 2], 3, [4, 5]].flat())
{
	mod.foo(x);
}
