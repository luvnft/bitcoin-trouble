/** @type {import('@sveltejs/kit').ParamMatcher} */

export function match(param:string) {
    return /^(naddr1)[a-zA-Z0-9]*/.test(param);
}
