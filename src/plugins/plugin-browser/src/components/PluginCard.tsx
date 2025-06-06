import { clipboard, React, ReactNative as RN, url } from "@vendetta/metro/common";
import { installPlugin, plugins, removePlugin } from "@vendetta/plugins";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import TextBadge from "$/components/TextBadge";

import { lang } from "..";
import constants from "../stuff/constants";
import { matchGithubLink, properLink } from "../stuff/util";
import type { FullPlugin } from "../types";
import Card from "./Card";

export default function PluginCard({
	item,
	changes,
}: {
	item: FullPlugin;
	changes: string[];
}) {
	const { usableLink, githubLink } = React.useMemo(() => {
		const id = item.vendetta.original;
		const usableLink = `https://${
			id.replace(/^vendetta\.nexpid\.xyz\//, "revenge.nexpid.xyz/")
		}`;
		return {
			usableLink,
			githubLink: matchGithubLink(item.vendetta.original),
		};
	}, [item]);

	const isNew = React.useMemo(
		() => changes.includes(properLink(item.vendetta.original)),
		[changes, item],
	);

	const [status, setStatus] = React.useState<{
		hasPlugin: boolean;
		pending: boolean;
	}>({
		hasPlugin: !!plugins[usableLink],
		pending: false,
	});

	React.useEffect(() => {
		setStatus({
			hasPlugin: !!plugins[usableLink],
			pending: false,
		});
	}, [item, usableLink]);

	const installFunction = () => {
		if (status.pending) return;
		const shouldRemove = !!plugins[usableLink];

		const doInstall = async () => {
			setStatus((prev) => ({ ...prev, pending: true }));

			try {
				if (shouldRemove) removePlugin(usableLink);
				else await installPlugin(usableLink);
			} catch (_e) {
				showToast(
					lang.format(
						shouldRemove ? "toast.plugin.delete.fail" : "toast.plugin.install.fail",
						{ plugin: item.name },
					),
					getAssetIDByName("CircleXIcon-primary"),
				);
			}

			showToast(
				lang.format(
					shouldRemove ? "toast.plugin.delete.success" : "toast.plugin.install.success",
					{ plugin: item.name },
				),
				getAssetIDByName(shouldRemove ? "TrashIcon" : "DownloadIcon"),
			);

			setStatus({
				hasPlugin: !!plugins[usableLink],
				pending: false,
			});
		};

		if (!shouldRemove && item.bunny?.broken) {
			return showConfirmationAlert({
				title: "Are you sure?",
				content: "This plugin is marked as broken and may break Discord completely.",
				confirmText: "Install anyway",
				cancelText: "Cancel",
				onConfirm: doInstall,
			});
		}

		if (!shouldRemove && item.bunny?.warning) {
			return showConfirmationAlert({
				title: "Are you sure?",
				content: "This plugin might cause crashes or is already implemented natively.",
				confirmText: "Install anyway",
				cancelText: "Cancel",
				onConfirm: doInstall,
			});
		}

		void doInstall();
	};

	return (
		<Card
			headerLabel={item.name}
			headerSuffix={
				<>
					{isNew && (
						<TextBadge variant="primary" style={{ marginLeft: 4 }} shiny>
							{lang.format("browser.plugin.new", {})}
						</TextBadge>
					)}
					{item.bunny?.broken && (
						<TextBadge variant="danger" style={{ marginLeft: 4 }}>
							Broken
						</TextBadge>
					)}
					{item.bunny?.warning && !item.bunny?.broken && (
						<TextBadge variant="danger" style={{ marginLeft: 4 }}>
							Warning
						</TextBadge>
					)}
				</>
			}
			headerSublabel={item.authors?.length
				? `by ${item.authors.map((x) => x.name).join(", ")}`
				: undefined}
			headerIcon={getAssetIDByName(item.vendetta.icon ?? "")}
			descriptionLabel={item.description}
			overflowTitle={item.name}
			actions={[
				{
					icon: status.hasPlugin ? "TrashIcon" : "DownloadIcon",
					loading: status.pending,
					isDestructive: status.hasPlugin,
					onPress: installFunction,
				},
			]}
			overflowActions={[
				{
					label: lang.format(
						status.hasPlugin ? "sheet.plugin.uninstall" : "sheet.plugin.install",
						{},
					),
					icon: status.hasPlugin ? "TrashIcon" : "DownloadIcon",
					isDestructive: status.hasPlugin,
					onPress: installFunction,
				},
				{
					label: lang.format("sheet.plugin.copy_plugin_link", {}),
					icon: "CopyIcon",
					onPress: () => {
						showToast(lang.format("toast.copy_link", {}), getAssetIDByName("CopyIcon"));
						clipboard.setString(usableLink);
					},
				},
				...(githubLink
					? [
						{
							label: lang.format("sheet.plugin.open_github", {}),
							icon: "img_account_sync_github_white",
							onPress: async () => {
								showToast(
									lang.format("toast.open_link", {}),
									getAssetIDByName("LinkExternalSmallIcon"),
								);
								try {
									if (await RN.Linking.canOpenURL("https://github.com")) {
										const response = await fetch(githubLink, {
											redirect: "follow",
										});
										RN.Linking.openURL(response.url);
									} else url.openURL(githubLink);
								} catch {
									url.openURL(githubLink);
								}
							},
						},
					]
					: []),
			]}
		/>
	);
}
