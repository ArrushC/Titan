import { Box, Table, Tbody, Td, Th, Thead, Tooltip, Tr, Text } from "@chakra-ui/react";
import React from "react";

export default function PanelUpdates({fileUpdates}) {
	return (
		<Box>
			{Object.keys(fileUpdates).length > 0 ? (
				<Box>
					<Text mb={4}>Below are the list of files which have been changed on your machine but there exists a newer version of them in the repository:</Text>
					<Box maxHeight="200px" overflowY="auto">
						<Table>
							<Thead>
								<Tr>
									<Th>Branch</Th>
									<Th>Path</Th>
									<Th>
										<Tooltip label="Working Copy" showArrow>
											Local Status
										</Tooltip>
									</Th>
									<Th>
										<Tooltip label="Repository" showArrow>
											Remote Status
										</Tooltip>
									</Th>
								</Tr>
							</Thead>
							<Tbody>
								{Object.keys(fileUpdates).map((branch) => (
									<React.Fragment key={branch}>
										{fileUpdates[branch].map((fileRow, index) => (
											<Tr key={index}>
												<Td>{branch}</Td>
												<Td>{fileRow.pathDisplay}</Td>
												<Td>{fileRow.wcStatus}</Td>
												<Td>{fileRow.reposStatus}</Td>
											</Tr>
										))}
									</React.Fragment>
								))}
							</Tbody>
						</Table>
					</Box>
					<Text mt={4}>If you wish to commit these files, please update the associated branches!</Text>
				</Box>
			) : (
				<Box>
					<Text>Your selected branches do not contain any changed files for which a newer version exists in the repository.</Text>
				</Box>
			)}
		</Box>
	);
}