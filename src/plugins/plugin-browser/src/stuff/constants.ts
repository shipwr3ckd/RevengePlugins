export default {
	proxyUrl: "https://raw.githubusercontent.com/shipwr3ckd/plugin-tests/master/",
	customLinks: {
		"revenge.nexpid.xyz": path =>
			`https://github.com/nexpid/RevengePlugins/tree/main/src/plugins/${path.join("/")}`,
		"mugman.catvibers.me": path =>
			`https://github.com/mugman174/${path[0]}/tree/master/plugins/${
				path.slice(1).join("/")
			}`,
		"plugins.obamabot.me": path =>
			`https://github.com/WolfPlugs/${path[0]}/tree/master/${
				path
					.slice(1)
					.join("/")
			}`,
	} satisfies Record<string, (path: string[]) => string>,
};
