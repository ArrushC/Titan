export function RaiseClientNotificaiton(toast, description,status = "info", duration = 3000) {
	return toast({
		position: "top",
		variant: "solid",
		title: "Client Notification",
		description: description,
		status: status,
		duration: duration,
		isClosable: true,
	});
}