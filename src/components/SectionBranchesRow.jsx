import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Table, Text, Flex, IconButton } from "@chakra-ui/react";
import { Checkbox } from "./ui/checkbox.jsx";
import { Tooltip } from "./ui/tooltip.jsx";
import { FaFolderOpen } from "react-icons/fa6";
import { MdAutoFixHigh } from "react-icons/md";
import ButtonElectron from "./ButtonElectron.jsx";
import ButtonCustomScripts from "./ButtonCustomScripts.jsx";
import chroma from "chroma-js";
import { keyframes } from "@emotion/react";
import { useApp } from "../ContextApp.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import EditableBranchesRow from "./EditableBranchesRow.jsx";
import { useBranches } from "../ContextBranches.jsx";

const SectionBranchesRow = memo(({ branchRow, isSelected }) => {
	const socket = useApp((ctx) => ctx.socket);
	const config = useApp((ctx) => ctx.config);
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const handleBranchSelection = useApp((ctx) => ctx.handleBranchSelection);
	const updateConfig = useApp((ctx) => ctx.updateConfig);
	const customScripts = useBranches((ctx) => ctx.customScripts);
	const { emitInfoSingle } = useSocketEmits();

	const branchId = branchRow?.id;
	const branchFolder = branchRow?.["Branch Folder"];
	const branchVersion = branchRow?.["Branch Version"];
	const branchPath = branchRow?.["SVN Branch"];
	const [branchInfo, setBranchInfo] = useState(branchRow?.["Branch Info"] || "Refreshing...");
	const themedBgColor = config?.branchFolderColours[branchFolder] || "transparent";

	const paddingXValue = "0.75";
	const paddingYValue = "0.25rem";

	const gradientAnimation = keyframes`
			0% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
			100% { background-position: 0% 50%; }
		`;

	const gradientStyle = useMemo(() => {
		let gradientFrom = "";
		let gradientTo = "";
		let animation = "";
		let revisionCount = 0;

		if (branchInfo.toLowerCase().includes("🤬") || branchInfo == "Not Found" || branchInfo == "Connection Error") {
			gradientFrom = "#800080";
			gradientTo = "#FF00FF";
			animation = `${gradientAnimation} 0.5s linear infinite`;
		} else if (branchInfo.trim().toLowerCase() !== "latest") {
			const regex = /-([0-9]+) Revisions{0,1}/;
			const match = branchInfo.match(regex);

			if (match) {
				revisionCount = parseInt(match[1], 10);
				gradientFrom = "#FFFF00";

				if (revisionCount >= 4) {
					gradientFrom = "#FFA500";
				}

				const maxRevisions = 10;
				const colorScale = chroma.scale([revisionCount >= 4 ? "orange" : "yellow", "red"]).domain([0, maxRevisions]);
				gradientTo = colorScale(Math.min(revisionCount, maxRevisions)).hex();

				const duration = `${Math.max(1, maxRevisions - revisionCount)}s`;
				animation = `${gradientAnimation} ${duration} linear infinite`;
			}
		}

		return {
			backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
			backgroundSize: "200% 200%",
			backgroundPosition: "0% 50%",
			animation: animation,
			color: revisionCount == 0 || revisionCount > 10 ? "white" : "black",
		};
	}, [branchInfo, gradientAnimation]);

	const handleSelectFolder = useCallback(
		async (defaultPath) => {
			const path = await window.electron.selectFolder({ defaultPath });
			if (path) updateConfig((currentConfig) => ({ ...currentConfig, branches: configurableRowData.map((row) => ({ ...row, "SVN Branch": row.id === branchId ? path : row["SVN Branch"] })) }));
		},
		[configurableRowData, updateConfig]
	);

	const handleDataChange = useCallback(
		(branchId, dataColumn, newValue) => {
			updateConfig((currentConfig) => ({
				...currentConfig,
				branches: currentConfig.branches.map((branch) => {
					if (branch.id === branchId) {
						return { ...branch, [dataColumn]: newValue };
					}
					return branch;
				}),
			}));
		},
		[updateConfig]
	);

	const refreshRow = useCallback(() => {
		emitInfoSingle(branchId, branchPath, branchVersion, branchFolder);
	}, [emitInfoSingle, branchId, branchPath, branchVersion, branchFolder]);

	const resolveConflicts = useCallback(() => {
		window.electron.openSvnResolve({ fullPath: branchPath }).then((result) => {
			refreshRow();
		});
	}, [configurableRowData, refreshRow]);

	const executeCustomScript = useCallback((scriptType, scriptPath, branchData) => {
		window.electron.runCustomScript({ scriptType, scriptPath, branchData }).then((result) => {
			console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
		}).catch((err) => {
			console.error("Custom Script error: " + JSON.stringify(err, null, 4));
		});
	}, []);

	useEffect(() => {
		if (!branchPath) return;

		refreshRow();

		const interval = setInterval(() => {
			refreshRow();
		}, 60_000 * 2);

		return () => clearInterval(interval);
	}, [branchPath]);

	useEffect(() => {
		const socketCallback = (data) => {
			if (data.id != branchId) return;
			setBranchInfo(data.info);
		};

		socket?.on("branch-info-single", socketCallback);

		return () => socket?.off("branch-info-single", socketCallback);
	}, [socket]);

	const renderedBranchInfo = useMemo(() => {
		if (branchInfo === "Latest" || branchInfo === "Refreshing...") {
			return <Text as="span">{branchInfo}</Text>;
		}

		const regex = /(-\d+)( Revisions{0,1}.*)/;
		const match = branchInfo.match(regex);

		if (match) {
			const [_, number, text] = match;
			return (
				<Text as="span" fontWeight="normal">
					<Text as="span" fontWeight="bold" fontSize={18} me={1}>
						{number}
					</Text>
					{text}
				</Text>
			);
		}

		return <Text as="span">{branchInfo}</Text>;
	}, [branchInfo]);

	return (
		<Table.Row>
			<Table.Cell display={"flex"} alignItems={"center"} ps={3.5} pe={paddingXValue}>
				<Checkbox aria-label="Select row" variant={"subtle"} colorPalette={"yellow"} checked={isSelected} onCheckedChange={(e) => handleBranchSelection(branchPath, e.checked)} />
			</Table.Cell>
			<Table.Cell py={paddingYValue} px={paddingXValue}>
				<EditableBranchesRow branchId={branchId} dataColumn={"Branch Folder"} dataValue={branchFolder} handleDataChange={handleDataChange} bgLightColorValue={themedBgColor == "transparent" ? "transparent" : `${themedBgColor}30`} bgDarkColorValue={themedBgColor == "transparent" ? "transparent" : `${themedBgColor}80`} />
			</Table.Cell>
			<Table.Cell py={paddingYValue} px={paddingXValue}>
				<EditableBranchesRow branchId={branchId} dataColumn={"Branch Version"} dataValue={branchVersion} handleDataChange={handleDataChange} bgLightColorValue={themedBgColor == "transparent" ? "transparent" : `${themedBgColor}30`} bgDarkColorValue={themedBgColor == "transparent" ? "transparent" : `${themedBgColor}80`}/>
			</Table.Cell>
			<Table.Cell py={paddingYValue} px={paddingXValue}>
				<Flex gapX={3} alignItems={"center"} onDoubleClick={() => handleSelectFolder(branchPath)}>
					<Tooltip content={window.electron ? "Select folder" : "Feature must be used in desktop application"} showArrow>
						<IconButton colorPalette={"yellow"} variant={"subtle"} size={"xs"} onClick={() => handleSelectFolder()} disabled={!window.electron}>
							<FaFolderOpen />
						</IconButton>
					</Tooltip>
					<Text>{branchPath}</Text>
				</Flex>
			</Table.Cell>
			<Table.Cell {...gradientStyle} bgColor={"green.focusRing"} textAlign={"center"} py={paddingYValue} px={paddingXValue}>
				{renderedBranchInfo}
			</Table.Cell>
			<Table.Cell py={paddingYValue} ps={3.5}>
				<Flex columnGap={1}>
					{branchInfo.toLowerCase().includes("🤬") && <ButtonElectron icon={<MdAutoFixHigh />} onClick={() => resolveConflicts()} colorPalette={"yellow"} variant={"subtle"} label="Resolve Conflicts" size="xs" />}
					{customScripts.map((script, i) => (
						<ButtonCustomScripts key={i} onClick={() => executeCustomScript(script.type, script.path, branchRow)} colorPalette={"yellow"} label={script.fileName} size="xs" disabled={branchInfo === "Not Found"} />
					))}
				</Flex>
			</Table.Cell>
		</Table.Row>
	);
});

SectionBranchesRow.displayName = "SectionBranchesRow";

export default SectionBranchesRow;
