import { ReactNative } from "@vendetta/metro/common";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { createMMKVBackend } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { showToast } from "@vendetta/ui/toasts";
import Text from "./components/Text";
import { RNFileModule } from "./deps";
import { Stack } from "./lib/redesign";

const { Image } = ReactNative;

interface InvalidDomain {
	match: RegExp;
	label: string;
}

const specialChange = {
	usrpfp: "userpfp",
} satisfies Record<string, string>;

const invalidDomains: InvalidDomain[] = [{
	match: /vendetta\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "vendetta.nexpid.xyz",
}, {
	match: /dev\.bunny\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "dev.bunny.nexpid.xyz",
}, {
	match: /bunny\.nexpid\.xyz\/(?<plugin>.+)\/$/i,
	label: "bunny.nexpid.xyz",
}];

const migrationLockFilePath = "nexpid/revengemigration.txt";

// thanks to the shim, this only gets run once even if multiple plugins are installed
export async function runMigration() {
	if (
		await RNFileModule.fileExists(
			`${RNFileModule.DocumentsDirPath}/${migrationLockFilePath}`,
		)
	) return;

	const isOutdated = new Set<string>();
	for (const plugin of Object.keys(plugins)) {
		const match = invalidDomains.find(x => x.match.test(plugin));
		if (match) isOutdated.add(match.label);
		if (match && plugin.includes("bn-plugins.github.io/vd-proxy")) {
			isOutdated.add("proxied plugin links");
		}
	}

	if (isOutdated.size) {
		showConfirmationAlert({
			// @ts-expect-error Missing from typings
			children: (
				<Stack direction="vertical" spacing={8}>
					<Stack
						direction="horizontal"
						spacing={14}
						style={{ justifyContent: "center", alignItems: "center", marginBottom: 18 }}
					>
						<Image
							source={{
								uri:
									"https://cdn.discordapp.com/avatars/853550207039832084/0f03d6ee1ac3acca0dfefcb556b734ec.png?size=128",
								width: 128,
								height: 128,
							}}
							style={{ borderRadius: 35, width: 70, height: 70 }}
						/>
						<Text
							variant="heading-xxl/extrabold"
							color="TEXT_NORMAL"
						>
							Hey, it's me, nexpid!
						</Text>
					</Stack>
					<Text
						variant="text-md/medium"
						color="TEXT_NORMAL"
					>
						Some of my plugins which you have installed use these domains:
					</Text>
					<Text
						variant="text-md/bold"
						color="TEXT_NORMAL"
						style={{ marginHorizontal: 10 }}
					>
						{[...isOutdated.values()].map(label => `• ${label}`).join("\n")}
					</Text>
					<Text
						variant="text-md/medium"
						color="TEXT_NORMAL"
					>
						These domains are being deprecated and plugins on them won't receive any new
						updates. Please use the new domain instead:
					</Text>
					<Text
						variant="text-lg/bold"
						color="TEXT_NORMAL"
						style={{ textDecorationLine: "underline" }}
						align="center"
					>
						revenge.nexpid.xyz
					</Text>
				</Stack>
			),
			confirmText: "Migrate now",
			async onConfirm() {
				// TODO
				// take all plugins that are bad & make good :blush:
				for (const plugin of Object.keys(plugins)) {
					const parser = invalidDomains.find(x => x.match.test(plugin));
					const newId = parser && plugin.match(parser.match)?.groups?.plugin;
					if (newId) {
						const newPlugin = `https://revenge.nexpid.xyz/${
							specialChange[newId] ?? newId
						}/`;
						console.log(
							"FROM",
							plugin,
							"TO",
							newPlugin,
						);

						await createMMKVBackend(newPlugin).set(await createMMKVBackend(plugin).get());
						await installPlugin(newPlugin);
						// returns a promise (bug in types)
						await removePlugin(plugin);
					}
				}

				showToast("Migrated successfully! Please reload your client to apply changes");
			},
			cancelText: "Remind me later",
			secondaryConfirmText: "I understand (don't show again)",
			onConfirmSecondary() {
				RNFileModule.writeFile("documents", migrationLockFilePath, "revenged", "utf8");
			},
		});
	}
}
