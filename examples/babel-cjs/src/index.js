require("./dir");
const mod = require("./dir/mod");

for(const x of [[1, 2], 3, [4, 5]].flat())
{
	mod.foo(x);
}
