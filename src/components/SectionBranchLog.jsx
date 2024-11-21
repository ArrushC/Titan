import React from "react";
import { useApp } from "../AppContext";
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Box } from "@chakra-ui/react";
import FilterableTableLogs from "./FilterableTableLogs";

export default function SectionBranchLog() {
	const { showSelectedBranchesLog, setShowSelectedBranchesLog } = useApp();

	return (
		<Drawer open={showSelectedBranchesLog} onOpenChange={() => setShowSelectedBranchesLog(false)} placement="left" size="full">
			<DrawerOverlay />
			<DrawerContent>
				<DrawerCloseButton size="lg" />
				<DrawerHeader>Selected Branches: SVN Log</DrawerHeader>
				<DrawerBody>
					<Box height={"100%"}>
						<FilterableTableLogs />
					</Box>
				</DrawerBody>
			</DrawerContent>
		</Drawer>
	);
}
