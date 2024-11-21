import { useCallback } from "react";
import { useApp } from "../AppContext";
import { createToastConfig } from "../utils/Constants";

export default function useNotifications() {
	const { toaster } = useApp();

	const RaiseClientNotificaiton = useCallback(
		(description = "", type = "info", duration = 3000, manualToast = null) => {
			const toastConfig = createToastConfig(description, type, duration);
			if (toaster) return toaster.create(toastConfig);
			else if (manualToast) return manualToast(toastConfig);
		},
		[toaster]
	);

	return {
		toaster,
		RaiseClientNotificaiton,
	};
}
