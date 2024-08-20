import { useCallback } from "react";
import { useApp } from "../AppContext";
import { createToastConfig } from "../utils/Constants";

export default function useNotifications() {
	const { toast } = useApp();

	const RaiseClientNotificaiton = useCallback(
		(description = "", status = "info", duration = 3000, manualToast = null) => {
			const toastConfig = createToastConfig(description, status, duration);
			if (toast) return toast(toastConfig);
			else if (manualToast) return manualToast(toastConfig);
		},
		[toast]
	);

	return {
		toast,
		RaiseClientNotificaiton,
	};
}
