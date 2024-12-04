import { useCallback } from "react";
import { createToastConfig } from "../utils/Constants.jsx";
import { toaster } from "../components/ui/toaster.jsx";

export default function useNotifications() {

	const RaiseClientNotificaiton = useCallback(
		(description = "", type = "info", duration = 3000, manualToast = null) => {
			const toastConfig = createToastConfig(description, type, duration);
			if (toaster) return toaster.create(toastConfig);
			else if (manualToast) return manualToast(toastConfig);
		},
		[toaster]
	);

	const RaisePromisedClientNotification = useCallback(
		({ title, totalItems, onProgress, onError = null, successMessage = (count) => `Successfully processed ${count} items`, errorMessage = (id) => `Failed to process item ${id}`, loadingMessage = (current, total) => `${current} of ${total} items processed` }) => {
			let toastId;
			let processedCount = 0;

			const updateToastProgress = (current) => {
				if (toaster && toastId) {
					toaster.update(toastId, {
						description: loadingMessage(current, totalItems),
					});
				}
			};

			const markToastSuccess = () => {
				if (toaster && toastId) {
					toaster.update(toastId, {
						description: successMessage(processedCount),
						type: "success",
						duration: 5000,
						isClosable: true,
					});
				}
			};

			const markToastError = (itemId) => {
				if (toaster && toastId) {
					toaster.update(toastId, {
						description: errorMessage(itemId),
						type: "error",
						duration: 5000,
						isClosable: true,
					});
				}
			};

			return new Promise((resolve, reject) => {
				toastId = toaster?.create({
					title,
					description: loadingMessage(0, totalItems),
					type: "loading",
				});

				const processItem = async (index) => {
					if (index >= totalItems) {
						markToastSuccess();
						resolve(processedCount);
						return;
					}

					try {
						await onProgress(index, {
							onSuccess: () => {
								processedCount++;
								updateToastProgress(processedCount);
							},
							onError: (error) => {
								markToastError(error.itemId || index);
								throw error;
							},
						});
						processItem(index + 1);
					} catch (error) {
						reject(error);
					}
				};

				processItem(0);
			});
		},
		[toaster]
	);

	return {
		toaster,
		RaiseClientNotificaiton,
		RaisePromisedClientNotification,
	};
}
