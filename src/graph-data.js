import FuzzySet from 'https://cdn.jsdelivr.net/npm/fuzzyset@1.0.7/dist/fuzzyset.esm.js';
// caches for data and search
let dataCache = null;
let nameSearchSet = null;
let nameToIdMap = new Map();

//loads all the data and then builds a search function

export async function loadData(params) {
    if (dataCache) return; // we let it pass

    try {
        const response = await fetch("../sample-data/all_academics_merged_backup.json")
        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`)
        }

        dataCache = await response.json() //we load everything

        // search indexing method

        const nameList = [];
        for (const key in dataCache) {
            const academic = dataCache[key]?.MGP_academic;
            if (academic && academic.mrauth_id) {
                const fullName = `${academic.given_name} ${academic.family_name}`;
                nameList.push(fullName);
                nameToIdMap.set(fullName.toLowerCase(), academic.mrauth_id);
            }
        }

        nameSearchSet = FuzzySet(nameList); //points towards fuzzyset in the global library
        console.log("Data is loaded with search index");
    } catch(e) {
        console.error("Failed to fetch/parse JSON data: ", e);
    }
}

// id finder method, takes the query and should output the specific id

export function findIdByName(queryName) {

    //relies on the nameSearchSet to look through for the id
    if (!nameSearchSet) {
        console.error("Search index does not yet exist.");
        return null;
    }

    //leverage fuzzysets to approximate the right result
    const results = nameSearchSet.get(queryName);
    if (!results || results.length == 0) {
        console.warn(`No match found: ${queryName}`);
        return null; //no match
    }

    // we take the BEST result, but it could be expanded upon to give a list of options as well.
    const closestResult = results[0][1];

    return nameToIdMap.get(closestResult.toLowerCase());
}



// helper function to parse the right data from json
function getAcademicData(allData, id) {
    if (!allData || !allData[id] || !allData[id].MGP_academic) {
        return null;
    }
    return allData[id].MGP_academic;
}

// helper function to extract node details
function addNodeToMap(map, dataCache, id) {
    //if the node already has the ID then we are done
    if (map.has(id)) {
        return;
    }
    //get data from full cache
    const academic = getAcademicData(dataCache, id);
    if (!academic) {
        console.warn(`No data found in cache for ID: ${id}`);
        return;
    }

    // const adviseeList = academic["student_data"]["descendants"]["advisees"] || [];
    // const edges = adviseeList.filter(id => id && id.length > 0);
    
    // // we have to deal with both masters and phd degrees fml
    // const allDegrees = academic["student_data"]["degrees"] || [];
    // const phdDegree = allDegrees.find(degree => degree.degree_type === "Ph.D.");    
    //  //use the phd when available
    // const degreeData = phdDegree || null;
    
    // const inputs = degreeData ? Object.keys(degreeData["advised by"] || {}) : [];

    // // make sure the variable names match
    // // const yearAward = degreeData ? degreeData["degree_year"] : "N/A";
    // let year = "2000";
    // const degrees = academic?.student_data?.degrees;

//     if (degrees && degrees.length > 0) {
//     // 1. Try to find a Ph.D. degree first
//     const phdDegree = degrees.find(d => d.degree_type === "Ph.D.");
    
//     if (phdDegree && phdDegree.degree_year) {
//       year = phdDegree.degree_year;
//     } else {
//       // 2. If no Ph.D., fall back to the last degree in the list
//       const lastDegree = degrees[degrees.length - 1];
//       if (lastDegree && lastDegree.degree_year) {
//         year = lastDegree.degree_year;
//       }
//     }
//   }

// Gemini slop: Safely get the degrees array, or an empty one
  let year = "N/A"; // Default year
  
  // Safely get the degrees array, or an empty one
  const degrees = academic?.student_data?.degrees || [];

  if (degrees.length > 0) {
      // 1. Try to find a Ph.D. degree
      const phdDegree = degrees.find(d => d.degree_type === "Ph.D.");
      
      if (phdDegree && phdDegree.degree_year) {
          year = phdDegree.degree_year;
      } else {
          // 2. If no Ph.D., fall back to the last degree in the list
          const lastDegree = degrees[degrees.length - 1];
          year = lastDegree?.degree_year || "N/A"; // Fallback to N/A
      }
  }

    const details = {
        familyName: academic.family_name || "",
        givenName: academic.given_name || "",
        yearAwarded: year,
        mrauth_id: academic.mrauth_id,
        internal_id: id
    };

    // get advisees and filtering out empty strings
    const adviseeIds = academic.student_data.descendants.advisees
    .map(adviseeVal => {
      
        if (Array.isArray(adviseeVal)) {
            if (adviseeVal.length > 0) { //ensures it is not empty
                return String(adviseeVal[0]).trim();
            }

            return null;
        }

    })
    //.filter(id => id && id.trim() !== "");

    //extracting the advisors/parents
    const advisorIds = [];
     academic.student_data.degrees.forEach(degree => {
        if (degree["advised by"]) {
        // get all advisor IDs from this degree and add them
            Object.keys(degree["advised by"]).forEach(id => {
            if (id && id.trim() !== "") {
          advisorIds.push(id);
        }
      });
    }
  });

    map.set(id, {
        edges: adviseeIds,
        detail: details,
        advisors: advisorIds
    });
}

/*
    function: created()
    - Accepts a rootMrauthId
    - Fetches the JSON
    - Finds the matching internal ID
    - Builds a small map for that person and their children
*/
export function created(rootMrauthId) {

    //we use the dataCache to be the way the data is stored, this makes it faster
    // alternative to the asynchronous method
    if (!dataCache) {
        console.error("Data not yet loaded, will not make graph.")
        return null;
    }
    
    let myMap = new Map();
    // let allData; // This will hold our data

///////////////////////////////////////
    /*
        Old code that used the asynchronous fetch
    */
    // try {
    //     const response = await fetch("../sample-data/all_academics_merged_backup.json");
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }
        
    //     // assign the fetched data DIRECTLY to allData
    //     allData = await response.json(); 
    //     console.log("Fetched JSON data successfully.");


    // } catch(e) {
    //     console.error("Failed to fetch/parse JSON data: ", e);
    //     return null;
    // }

    // if (!allData) {
    //     console.error("Data object is empty.");
    //     return null;
    // }
///////////////////////////////

    // This loop finds the internal ID from the mrauth_id
    let rootId = null;
    for (const key in dataCache) {
        const academic = dataCache[key]?.MGP_academic;
        if (academic && academic.mrauth_id === rootMrauthId) {
            rootId = academic.ID; // e.g., "258"
            break; // We found them
        }
    }

    // catches if there is no such id
    if (!rootId) {
        console.error(`Could not find academic with mrauth_id ${rootMrauthId}`);
        return null;
    }
    console.log(`Found internal ID ${rootId} for mrauth_id ${rootMrauthId}`);
    
    // add node to the map using helper
    addNodeToMap(myMap, dataCache, rootId);

    // retrieves the edges of the root node (only the children thus far)
    const rootNode = myMap.get(rootId);
    
    if (rootNode) {
        // go DOWN, add all children (advisees)
        for (const adviseeId of rootNode.edges) {
            addNodeToMap(myMap, dataCache, adviseeId);
        }

        //
        //loop to go UP and add parents (advisors)
        //
        for (const advisorId of rootNode.advisors) {
            addNodeToMap(myMap, dataCache, advisorId);
        }

    }
    return myMap;
};