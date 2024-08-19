import { useCallback } from "react";
import { useApp } from "../AppContext";

function createToastConfig(description, status = "info", duration = 3000) {
    return {
        position: "top",
        variant: "solid",
        title: "Client Notification",
        description: description,
        status: status,
        duration: duration,
        isClosable: true,
    };
}

export default function useNotifications() {
	const { toast } = useApp();

	const RaiseClientNotificaiton = useCallback((description = "", status = "info", duration = 3000, manualToast=null) => {
		const toastConfig = createToastConfig(description, status, duration);
		if (toast) return toast(toastConfig);
		else if (manualToast) return manualToast(toastConfig);
	}, [toast]);

	return {
		toast,
		RaiseClientNotificaiton
	}
}