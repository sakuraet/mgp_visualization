//KEVIN: remove 'fuzzyset.js' through npm because of conflict, idk if this error shows up for everyone else

import FuzzySet from 'fuzzyset' 
// const FuzzySet = require('fuzzyset.js'); keep just in case

// caches for data and search
let dataCache = null;
let nameSearchSet = null;
let nameToIdMap = new Map();

//loads all the data and then builds a search function

export async function loadData(params) {
    if (dataCache) return; // we let it pass

    try {
        const response = await fetch("/sample-data/all_academics_merged_complete.json")
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
// SAKURA: this is sus it takes the "best" result but it's not accurate (ex "chyba" will give Jie Du) 
// prob fix later or whatever

export function findIdByName(queryName) {

    //relies on the nameSearchSet to look through for the id
    if (!nameSearchSet) {
        console.error("Search index does not yet exist.");
        return null;
    }

    //leverage fuzzysets to approximate the right result
    const results = nameSearchSet.get(queryName);
    if (!results || results.length === 0) {
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

    // Gemini slop: Safely get the degrees array, or an empty one
    let year = "N/A"; // Default year
    let school = "N/A";
    let thesis = "N/A";
    
    // Safely get the degrees array, or an empty one
    const degrees = academic?.student_data?.degrees || [];

    if (degrees.length > 0) {

        // 1. FINDING YEAR AWARDED

        // a. try to find PhD degree
        const phdDegree = degrees.find(d => d.degree_type === "Ph.D.");
        
        if (phdDegree && phdDegree.degree_year) {
            year = phdDegree.degree_year;
        } else {
            // b. If no Ph.D., fall back to the last degree in the list
            const lastDegree = degrees[degrees.length - 1];
            year = lastDegree?.degree_year || "N/A"; // Fallback to N/A
        }

        // 2. FINDING SCHOOL
        const degreeWithSchool = degrees.find(d => d.schools);
        school = degreeWithSchool ? degreeWithSchool.schools : "";
        // 3. FINDING THESIS
        const degreeWithThesis = degrees.find(d => d.thesis_title);
        thesis = degreeWithThesis ? degreeWithThesis.thesis_title : "";
    }
    /*
        KEVIN: More Details to pre-existing details
        1. schools
        2. thesis_title

    */
    const details = {
        familyName: academic.family_name || "",
        givenName: academic.given_name || "",
        yearAwarded: year,
        mrauth_id: academic.mrauth_id,
        internal_id: id,
        school: school,
        thesis: thesis 
    };

    // SAKURA: filter out null and empty values
    // get advisees and filtering out empty strings and null values
    const adviseeIds = academic.student_data.descendants.advisees
    .map(adviseeVal => {
        if (Array.isArray(adviseeVal)) {
            if (adviseeVal.length > 0) { //ensures it is not empty
                return String(adviseeVal[0]).trim();
            }
            return null;
        }
        return null;
    })
    .filter(id => id !== null && id.trim() !== ""); // SAKURA: Filter out null and empty values

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

// SAKURA: I WILL KILL MYSELF THIS DOESNT WORK
// SAKURA: find cohort peers from cached data (EXACT same year + same institution)
function findCohortPeers(rootInternalId, dataCache) {
    const rootAcademic = getAcademicData(dataCache, rootInternalId);
    if (!rootAcademic) return [];
    
    // get root's school and year
    const degrees = rootAcademic?.student_data?.degrees || [];
    if (degrees.length === 0) return [];
    
    // find PhD degree or last degree
    const phdDegree = degrees.find(d => d.degree_type === "Ph.D.") || degrees[degrees.length - 1];
    const rootSchools = phdDegree.schools || [];
    const rootYear = parseInt(phdDegree.degree_year);
    
    if (!rootSchools.length || !rootYear) {
        console.log("Root has no school or year, cannot find cohort peers");
        return [];
    }
    
    console.log(`Finding cohort peers: school=${rootSchools[0]}, year=${rootYear} (EXACT match)`);
    
    const cohortPeers = [];
    
    // loop through all academics in cache
    for (const key in dataCache) {
        // skip the root node itself
        if (key === rootInternalId) continue;
        
        const academic = dataCache[key]?.MGP_academic;
        if (!academic) continue;
        
        const peerDegrees = academic?.student_data?.degrees || [];
        if (peerDegrees.length === 0) continue;
        
        // find PhD degree or last degree
        const peerPhdDegree = peerDegrees.find(d => d.degree_type === "Ph.D.") || peerDegrees[peerDegrees.length - 1];
        const peerSchools = peerPhdDegree.schools || [];
        const peerYear = parseInt(peerPhdDegree.degree_year);
        
        if (!peerSchools.length || !peerYear) continue;
        
        // SAKURA: check if EXACT SAME YEAR (not a range)
        if (peerYear !== rootYear) continue;
        
        // check if same school
        const sameSchool = rootSchools.some(rootSchool => 
            peerSchools.some(peerSchool => 
                peerSchool.toLowerCase().trim() === rootSchool.toLowerCase().trim()
            )
        );
        
        if (sameSchool) {
            cohortPeers.push(academic.ID); // use internal ID
            console.log(`Found cohort peer: ${academic.given_name} ${academic.family_name} (${peerYear}, ${peerSchools[0]})`);
        }
    }
    
    console.log(`Found ${cohortPeers.length} cohort peers (exact year match)`);
    return cohortPeers;
}
// SAKURA: I WILL KILL MYSELF THIS DOESNT WORK

/*
    function: created()
    - Accepts a rootMrauthId and optional filters
    - Fetches the JSON
    - Finds the matching internal ID
    - Builds a small map for that person and their children (filtered)
    - Returns both the map AND the internal ID of the root
*/
export function created(rootMrauthId, filters = {}) {
    // SAKURA: default filters if not provided
    const {
        university = '',
        yearMin = 1800,
        yearMax = 2024,
        showAdvisors = true,
        showCohortPeers = true,
        showStudents = true
    } = filters;

    if (!dataCache) {
        console.error("Data not yet loaded, will not make graph.")
        return null;
    }
    
    // SAKURA: helper function to check if a node passes filters
    function passesFilters(nodeId) {
        const academic = getAcademicData(dataCache, nodeId);
        if (!academic) return false;

        // university filter
        if (university && university.trim() !== '') {
            const degrees = academic?.student_data?.degrees || [];
            const matchesUniversity = degrees.some(degree => 
                degree.schools && degree.schools.some(school => 
                    school.toLowerCase().includes(university.toLowerCase())
                )
            );
            if (!matchesUniversity) {
                console.log(`Filtered out ${academic.given_name} ${academic.family_name}: university mismatch`);
                return false;
            }
        }

        // year filter
        const degrees = academic?.student_data?.degrees || [];
        let nodeYear = null;
        
        if (degrees.length > 0) {
            const phdDegree = degrees.find(d => d.degree_type === "Ph.D.");
            if (phdDegree && phdDegree.degree_year) {
                nodeYear = parseInt(phdDegree.degree_year);
            } else {
                const lastDegree = degrees[degrees.length - 1];
                if (lastDegree?.degree_year) {
                    nodeYear = parseInt(lastDegree.degree_year);
                }
            }
        }
        
        if (nodeYear && (nodeYear < yearMin || nodeYear > yearMax)) {
            console.log(`Filtered out ${academic.given_name} ${academic.family_name}: year ${nodeYear} outside range ${yearMin}-${yearMax}`);
            return false;
        }

        return true;
    }
    
    let myMap = new Map();

    // finds the internal ID from the mrauth_id
    let rootId = null;
    for (const key in dataCache) {
        const academic = dataCache[key]?.MGP_academic;
        if (academic && academic.mrauth_id === rootMrauthId) {
            rootId = academic.ID;
            break;
        }
    }

    if (!rootId) {
        console.error(`Could not find academic with mrauth_id ${rootMrauthId}`);
        return null;
    }
    console.log(`Found internal ID ${rootId} for mrauth_id ${rootMrauthId}`);
    
    // SAKURA: add root node to the map (always include the root)
    addNodeToMap(myMap, dataCache, rootId);

    // retrieves the edges of the root node
    const rootNode = myMap.get(rootId);
    
    // SAKURA: I WILL KILL MYSELF THIS DOESNT WORK
    const cohortPeerIds = new Set();
    
    if (showCohortPeers) {
        const cohortPeers = findCohortPeers(rootId, dataCache);
        
        for (const peerId of cohortPeers) {
            if (passesFilters(peerId)) {
                cohortPeerIds.add(peerId); // Add to cohort set FIRST
                console.log(`Identified cohort peer: ${peerId}`);
            }
        }
    }
    // SAKURA: I WILL KILL MYSELF THIS DOESNT WORK
    
    if (rootNode) {
        // SAKURA: go down & add all children (advisees) if showStudents is true
        if (showStudents) {
            for (const adviseeId of rootNode.edges) {
                // SAKURA: Skip if this student is a cohort peer (handle as cohort, not student)
                if (cohortPeerIds.has(adviseeId)) {
                    console.log(`Skipping ${adviseeId} as student - is cohort peer`);
                    continue;
                }
                if (passesFilters(adviseeId)) {
                    addNodeToMap(myMap, dataCache, adviseeId);
                }
            }
        }

        // SAKURA: go up add parents (advisors) if showAdvisors is true
        if (showAdvisors) {
            // add root's advisors
            for (const advisorId of rootNode.advisors) {
                // SAKURA: skip if this advisor is a cohort peer (handle as cohort, not advisor)
                if (cohortPeerIds.has(advisorId)) {
                    console.log(`Skipping ${advisorId} as advisor - is cohort peer`);
                    continue;
                }
                if (passesFilters(advisorId)) {
                    addNodeToMap(myMap, dataCache, advisorId);
                }
            }
            
            // SAKURA: I WILL KILL MYSELF THIS DOESNT WORK
            if (showCohortPeers) {
                for (const peerId of cohortPeerIds) {
                    const peerData = dataCache[peerId]?.MGP_academic;
                    if (!peerData) continue;
                    
                    // get advisors from peer's degrees
                    const peerAdvisors = [];
                    peerData.student_data.degrees.forEach(degree => {
                        if (degree["advised by"]) {
                            Object.keys(degree["advised by"]).forEach(advisorId => {
                                if (advisorId && advisorId.trim() !== "") {
                                    peerAdvisors.push(advisorId);
                                }
                            });
                        }
                    });
                    
                    // add each advisor (skip if they're also a cohort peer)
                    for (const advisorId of peerAdvisors) {
                        if (cohortPeerIds.has(advisorId)) {
                            console.log(`Skipping ${advisorId} as cohort peer advisor - is also cohort peer`);
                            continue;
                        }
                        if (passesFilters(advisorId) && !myMap.has(advisorId)) {
                            addNodeToMap(myMap, dataCache, advisorId);
                            console.log(`Added advisor ${advisorId} of cohort peer ${peerId}`);
                        }
                    }
                }
            }
            // SAKURA: I WILL KILL MYSELF THIS DOESNT WORK
        }

        // SAKURA: NOW add cohort peers to the map (after identifying them above)
        if (showCohortPeers) {
            for (const peerId of cohortPeerIds) {
                if (!myMap.has(peerId)) {
                    addNodeToMap(myMap, dataCache, peerId);
                    console.log(`Added cohort peer ${peerId} to graph`);
                }
            }
        }
    }
    
    console.log(`Graph created with ${myMap.size} nodes (filters applied: university="${university}", years=${yearMin}-${yearMax}, advisors=${showAdvisors}, students=${showStudents}, cohort peers=${cohortPeerIds.size})`);
    
    // SAKURA: return both the map, root internal ID, and cohort peer IDs
    return { 
        graphData: myMap, 
        rootInternalId: rootId,
        cohortPeerIds: cohortPeerIds
    };
}
