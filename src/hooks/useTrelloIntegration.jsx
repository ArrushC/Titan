import { useApp } from "../AppContext";
import useSocketEmits from "./useSocketEmits";

export default function useTrelloIntegration() {
	const { config } = useApp();
	const { emitTrelloCardNamesSearch, emitTrelloCardUpdate } = useSocketEmits();

	const configTrelloIntegration = config?.trelloIntegration;
	const key = configTrelloIntegration?.key || null;
	const token = configTrelloIntegration?.token || null;
	const isTrelloIntegrationEnabled = key && token && key.trim() !== "" && token.trim() !== "" && key.toUpperCase() !== "TRELLO_API_KEY" && token.toUpperCase !== "TRELLO_TOKEN";

	return {
		key,
		token,
		isTrelloIntegrationEnabled,
		emitTrelloCardNamesSearch,
		emitTrelloCardUpdate,
	};
}
