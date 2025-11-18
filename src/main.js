//everything is directed graphs (I would hope we are using arrows)

import { render } from './graph.js';
import { loadData, findIdByName, created } from './graph-data.js';

function buildRenderGraph(mrauth_id) {
  if (!mrauth_id) {
    console.error("No ID provided to render.");
    return;
  }

  console.log(`Building graph for mrauth_id: ${mrauth_id}`);


  //making subgraph data
  const myGraphData = created(mrauth_id);

  //rendering

  if (myGraphData && myGraphData.size > 0) {
    console.log(`Data loaded for ${myGraphData.size} nodes. Rendering...`);
    render(myGraphData);
  } else {
    console.error(`Failed to create graph data for ID: ${mrauth_id}`);
  }
}

// html submission for the search query

function handleSearch(event) {
  event.preventDefault(); // stops the form from reloading the page

  const input = document.getElementById("single_name_input");
  const queryName = input.value;

  if (!queryName) return; //we get nothing

  console.log(`Searching for name: ${queryName}`);

  const mrauth_id = findIdByName(queryName);
  //if the iD exists, then we should render the graph
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
        console.error("Could not find singe_name_form in HTML.");
    }

    //default render is The Dio Holl fella

    buildRenderGraph("462675");
}

// window.addEventListener('load', main);
main();

// async function initGraph() {
//   let rootMrauthId = "462675"; //magic number fuck my life

//   console.log("1. fetching graph data from ID: ${rootMrauthId}");

//   const myGraphData = await created(rootMrauthId);

//   if (myGraphData && myGraphData.size > 0) {
//     console.log("2. data loaded successfully, rendering graph");
//     render(myGraphData);
//   }
//   else {
//     console.error("failed to load or create graph data, graph will not be rendered")
//   }
// }

// initGraph();

// // 1. Call created() to get your data
// const myGraphData = created();

// // 2. Check if it worked
// if (myGraphData && myGraphData.size > 0) {
//     // 3. Pass the data to render()
//     render(myGraphData);
// } else {
//     console.error("Failed to load or create graph data. Graph will not be rendered.");
// }


