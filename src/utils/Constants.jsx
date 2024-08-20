export const URL_SOCKET_CLIENT = "http://localhost:4000";

export const HEADER_HEIGHT_RAW = 40;
export const HEADER_HEIGHT = "40px";

export const TOAST_CONTAINER_STYLE = {
	marginTop: HEADER_HEIGHT,
};

export function createToastConfig(description, status = "info", duration = 3000, isServer = false) {
	return {
		position: "top",
		variant: "solid",
		title: isServer ? "Server Notification" : "Client Notification",
		description: description,
		status: status,
		duration: duration,
		isClosable: true,
		// containerStyle: TOAST_CONTAINER_STYLE
	};
}