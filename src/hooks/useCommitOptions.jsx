import { useApp } from "../ContextApp.jsx";

export default function useCommitOptions() {
	const { config } = useApp();

	return config && config.commitOptions ? config.commitOptions : null;
}
