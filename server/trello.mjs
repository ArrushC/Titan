import fetch from "node-fetch";

/**
 * Fetches the card names from Trello based on the search query.
 *
 * @param {String} key The Trello API key
 * @param {String} token The Trello token
 * @param {String} query The search query to find the card names
 * @param {Number} limit The maximum number of cards to fetch
 * @param {Object} logger Logger instance
 * @returns {Promise<Array>} An array of card objects containing the card name, last activity date, URL, board ID, checklist IDs, and checklist data.
 */
export async function getTrelloCardNames(key, token, query, limit, logger) {
    // Docs URL: https://developer.atlassian.com/cloud/trello/rest/api-group-search/#api-search-get

    try {
        // Create a new URL object
        let url = new URL("https://api.trello.com/1/search");

        // Use URLSearchParams to append query parameters
        const params = new URLSearchParams({
            query: `name:"${query}"`,
            key: key,
            token: token,
            cards_limit: String(limit),
            card_fields: "name,dateLastActivity,shortUrl,idBoard,idChecklists",
            partial: "true",
            modelTypes: "cards",
        });

        // Append the search parameters to the URL
        url.search = params.toString();

        // Fetch the data from Trello API
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
        }

        // Parse the JSON response
        const data = await res.json();

        // Sort and format the card data
        const cards = data.cards
            .sort((a, b) => new Date(b.dateLastActivity) - new Date(a.dateLastActivity))
            .map((card) => ({
                id: card.id,
                name: card.name,
                lastActivityDate: new Date(card.dateLastActivity).toLocaleString(),
                url: card.shortUrl,
                boardId: card.idBoard,
                checklistIds: card.idChecklists,
            }));

        let urls = cards.filter((card) => card.checklistIds && card.checklistIds.length > 0).map((card) => card.checklistIds.map((checklistId) => new URL(`https://api.trello.com/1/checklists/${checklistId}`)));

        // Add key and token to each of those URLs, fetch the data and parse the JSON response
        let checklistData = (await Promise.all(urls.flat().map((url) => fetch(new URL(url.toString() + `?key=${key}&token=${token}`)).then((res) => res.json())))).map((data) => ({
            id: data.id,
            name: data.name,
        }));

        // Add the checklist data to the cards
        cards.forEach((card) => {
            card.checklists = card.checklistIds.map((checklistId) => checklistData.find((checklist) => checklist.id === checklistId));
        });

        logger.debug(`Retrieved ${cards.length} cards`);
        return cards;
    } catch (error) {
        logger.error("Error fetching data from Trello:" + error);
        throw error;
    }
}

/**
 * Updates the "Commit History" checklist or creates a new one if it doesn't exist, and adds commit responses to it.
 *
 * @param {String} key The Trello API key
 * @param {String} token The Trello token
 * @param {*} trelloData  The Trello data object containing the card ID, board ID, checklist ID, and commit responses
 * @param {*} commitResponses The commit responses to add to the checklist
 * @param {String} commitMessage The commit message to add to the card
 * @param {Object} logger Logger instance
 */
export async function updateTrelloCard(key, token, trelloData, commitResponses, commitMessage, logger) {
    try {
        // Check if the "Commit History" checklist exists and if not, create a new one
        let checklistId = trelloData.checklists.find((checklist) => checklist.name === "Commit History")?.id;

        if (!checklistId) {
            const url = new URL(`https://api.trello.com/1/checklists`);
            const params = new URLSearchParams({
                key: key,
                token: token,
                idCard: trelloData.id,
                name: "Commit History",
                pos: "bottom",
            });

            url.search = params.toString();

            const res = await fetch(url, { method: "POST" });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
            }

            const data = await res.json();
            checklistId = data.id;
        }

        const url = new URL(`https://api.trello.com/1/checklists/${checklistId}/checkItems`);

        // Add the commit message to the "Commit History" checklist
        let params = new URLSearchParams({
            key: key,
            token: token,
            name: commitMessage,
            pos: "bottom",
        });
        url.search = params.toString();

        let res = await fetch(url, { method: "POST" });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
        }

        const data = await res.json();
        logger.debug(`Added commit message to Trello card: ${data.name}`);

        // Add the commit responses to the "Commit History" checklist
        for (let responseItem of commitResponses) {
            params = new URLSearchParams({
                key: key,
                token: token,
                name: responseItem,
                pos: "bottom",
            });

            url.search = params.toString();

            res = await fetch(url, { method: "POST" });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
            }

            const data = await res.json();
            logger.debug(`Added commit response to Trello card: ${data.name}`);
        }

        logger.debug(`Updated Trello card with commit responses`);
        return true;
    } catch (error) {
        logger.error(`Error updating Trello card with commit responses: ${error}`);
        throw error;
    }
}