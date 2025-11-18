//everything is directed graphs (I would hope we are using arrows)

import { render } from './graph.js';
import { loadData, findIdByName, created } from './graph-data.js';

function buildRenderGraph(mrauth_id) {
  if (!mrauth_id) {
    console.error("No ID provided to render.");
    return;
  }

  console.log(`Building graph for mrauth_id: ${mrauth_id}`);

  //making subgraph data - now returns both graphData and rootInternalId
  const result = created(mrauth_id);
  
  if (!result) {
    console.error(`Failed to create graph data for ID: ${mrauth_id}`);
    return;
  }

  const { graphData: myGraphData, rootInternalId } = result;

  // FIX: Verify we have both valid data and a valid root ID
  if (!myGraphData || myGraphData.size === 0) {
    console.error(`No graph data created for ID: ${mrauth_id}`);
    return;
  }

  if (!rootInternalId) {
    console.error(`No root internal ID found for ID: ${mrauth_id}`);
    return;
  }

  console.log(`Data loaded for ${myGraphData.size} nodes. Root ID: ${rootInternalId}. Rendering...`);
  
  // FIX: Now we have the correct rootInternalId directly from the created() function
  render(myGraphData, rootInternalId);
}

// html submission for the search query
function handleSearch(event) {
  event.preventDefault(); // stops the form from reloading the page

  const input = document.getElementById("single_name_input");
  const queryName = input.value;

  if (!queryName) return; //we get nothing

  console.log(`Searching for name: ${queryName}`);

  const mrauth_id = findIdByName(queryName);
  //if the ID exists, then we should render the graph
  if (mrauth_id) {
    buildRenderGraph(mrauth_id);
  } else {
    alert(`Cannot find a match for ${queryName}`);
  }
}

async function main() {
  //load all data into memory
  console.log("Loading academic data...");
  await loadData();
  console.log("Data loaded.");

  //use the search method with the html form
  const form = document.getElementById("single_name_form");
    if (form) {
        form.addEventListener("submit", handleSearch);
    } else {
        console.error("Could not find single_name_form in HTML.");
    }

    //default render is The Dio Holl fella
    buildRenderGraph("462675");
}

main();