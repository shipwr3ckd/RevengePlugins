import { fetchPlugin, startPlugin, stopPlugin } from "@vendetta/plugins";
import constants from "./constants";

export function properLink(id: string): string {
	return !id.endsWith("/") ? `${id}/` : id;
}

const linkMatches = {
	origin: /^([^/]+)\/(.*)/,
	multiplePluginGitio: /^(.*?)(?=\.)\.github\.io\/(.*?)(?=\/)\/(.*)/,
	singlePluginGitio: /^(.*?)(?=\.)\.github\.io\/(.*)/,
	githubReleases: /^github\.com\/(.*?)(?=\/)\/(.*?)(?=\/)\/releases/,
	rawGithub: /^raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/, // NEW
};

export function matchGithubLink(link: string): string | undefined {
	const multi = link.match(linkMatches.multiplePluginGitio);
	if (multi?.[0]) {
		return `https://github.com/${multi[1]}/${multi[2]}/tree/master/plugins/${multi[3]}`;
	}

	const single = link.match(linkMatches.singlePluginGitio)
		?? link.match(linkMatches.githubReleases);
	if (single?.[0]) {
		return `https://github.com/${single[1]}/${single[2]}`;
	}

	const raw = link.match(linkMatches.rawGithub); // NEW
	if (raw?.[0]) {
		const [, user, repo, branch, path] = raw;
		return `https://github.com/${user}/${repo}/tree/${branch}/${path.replace(/\/$/, "")}`;
	}

	const match = link.match(linkMatches.origin);
	if (match) {
		const [, origin, path] = match;
		if (constants.customLinks[origin]) {
			return constants.customLinks[origin](path.split("/"));
		}
	}
}

export async function refetchPlugin(plugin: any) {
	const enab = plugin.enabled;
	for (let i = 0; i < 2; i++) {
		if (enab) stopPlugin(plugin.id, false);
		await fetchPlugin(plugin.id);
		if (enab) await startPlugin(plugin.id);
	}
}

export const emitterSymbol = Symbol.for("vendetta.storage.emitter");
