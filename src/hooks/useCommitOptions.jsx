import { useApp } from "../ContextApp.jsx";

export default function useCommitOptions() {
	const config = useApp((ctx) => ctx.config);
	return config && config.commitOptions ? config.commitOptions : null;
}
