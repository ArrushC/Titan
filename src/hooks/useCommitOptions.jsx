import { useApp } from "../AppContext";

export default function useCommitOptions() {
	const { config } = useApp();

	return config && config.commitOptions ? config.commitOptions : null;
}
