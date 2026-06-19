import { disableTool } from "eve/tools";

// Reviewing local code needs no arbitrary URL fetching. Removing web_fetch
// shrinks the reviewer's egress surface (web_search stays available for looking
// up an API's documented contract).
export default disableTool();
