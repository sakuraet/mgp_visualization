//KEVIN: remove 'fuzzyset.js' through npm because of conflict, idk if this error shows up for everyone else

import FuzzySet from 'fuzzyset' 
// const FuzzySet = require('fuzzyset.js'); keep just in case

// caches for data and search
let dataCache = null;
let nameSearchSet = null;
let nameToIdMap = new Map();
let universitySearchSet = null;

//loads all the data and then builds a search function

export async function loadData(params) {
    if (dataCache) return; // we let it pass

    try {
        const response = await fetch("/sample-data/everything.json")
        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`)
        }

        dataCache = await response.json() //we load everything

        // search indexing method

        const nameList = [];
        const universitySet = new Set();

        for (const key in dataCache) {
            const academic = dataCache[key]?.MGP_academic;
            if (academic && academic.mrauth_id) {
                const fullName = `${academic.given_name} ${academic.family_name}`;
                nameList.push(fullName);
                nameToIdMap.set(fullName.toLowerCase(), academic.mrauth_id);


                academic.student_data.degrees.forEach(degree => {
                    if (degree.schools && Array.isArray(degree.schools)) {
                        degree.schools.forEach(school => {
                            if (school && school.trim() !== '') {
                                universitySet.add(school.trim());
                            }
                        });
                    }
                });
            }
        }

        //points towards fuzzyset in the global library
        nameSearchSet = FuzzySet(nameList); 
        universitySearchSet = FuzzySet(Array.from(universitySet)); 

        console.log("Data is loaded with search index");
    } catch(e) {
        console.error("Failed to fetch/parse JSON data: ", e);
    }
}

//KEVIN : reduced findIdByName to just retrieving the ID
export function findIdByName(queryName) {
    return nameToIdMap.get(queryName.toLowerCase());
}

//KEVIN: getSuggestions to calculate the nearest query results using FuzzySet
export function getSuggestions(queryName) {
    if (!nameSearchSet || !queryName) return [];

    // get() returns [[score, match], ....] sorted by score in desc order
    const results = nameSearchSet.get(queryName);

    if (!results) return [];
    
    //return map of name with score and id
    return results.map(([score, name]) => ({
        name: name,
        id: nameToIdMap.get(name.toLowerCase()),
        score: score
    }));
}

//KEVIN: get university query suggestions
export function getUniversitySuggestions(queryName) {
    if (!universitySearchSet || !queryName) return [];

    // get() returns [[score, match], ....] sorted by score in desc order
    const results = universitySearchSet.get(queryName);

    if (!results) return [];
    
    // return array of suggested university names
    return results.map(([score, name]) => ({
        name: name,
        score: score
    }));
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
    // 4. FINDING DESCENDANT COUNT
    let trueDescCount = "N/A";
    const descendants = academic?.student_data?.descendants;

    if (descendants && descendants.descendant_count !== undefined) {    
        trueDescCount = descendants.descendant_count || "0";
    }
    /*
        KEVIN: More Details to pre-existing details
        1. schools
        2. thesis_title
        3. descendant count (true, includes the count from MGP which can go beyond our graphData)

    */
    const details = {
        familyName: academic.family_name || "",
        givenName: academic.given_name || "",
        yearAwarded: year,
        mrauth_id: academic.mrauth_id,
        internal_id: id,
        true_desc_count: trueDescCount,
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

// anne: find cohort peers from cached data (people with same advisor)
function findCohortPeers(rootInternalId, dataCache) {
    const rootAcademic = getAcademicData(dataCache, rootInternalId);
    if (!rootAcademic) return [];
    
    // get root's advisors from degrees
    const rootAdvisorIds = [];
    rootAcademic.student_data.degrees.forEach(degree => {
        if (degree["advised by"]) {
            Object.keys(degree["advised by"]).forEach(advisorId => {
                if (advisorId && advisorId.trim() !== "") {
                    rootAdvisorIds.push(advisorId);
                }
            });
        }
    });
    
    if (rootAdvisorIds.length === 0) {
        console.log("Root has no advisors, cannot find cohort peers");
        return [];
    }
    
    // Get root's students (to exclude them from cohort peers)
    const rootStudentIds = rootAcademic.student_data.descendants.advisees
        .map(adviseeVal => {
            if (Array.isArray(adviseeVal) && adviseeVal.length > 0) {
                return String(adviseeVal[0]).trim();
            }
            return null;
        })
        .filter(id => id !== null && id.trim() !== "");
    
    console.log(`Finding cohort peers: people who share advisor(s) with root (${rootAdvisorIds.length} advisors), excluding ${rootStudentIds.length} direct students`);
    
    const cohortPeers = [];
    
    // loop through all academics in cache
    for (const key in dataCache) {
        // skip the root node itself
        if (key === rootInternalId) continue;
        
        // IMPORTANT: skip root's direct students - they are not peers!
        if (rootStudentIds.includes(key)) {
            console.log(`Skipping ${key} - is a direct student of root, not a cohort peer`);
            continue;
        }
        
        const academic = dataCache[key]?.MGP_academic;
        if (!academic) continue;
        
        // get peer's advisors from degrees
        const peerAdvisorIds = [];
        academic.student_data.degrees.forEach(degree => {
            if (degree["advised by"]) {
                Object.keys(degree["advised by"]).forEach(advisorId => {
                    if (advisorId && advisorId.trim() !== "") {
                        peerAdvisorIds.push(advisorId);
                    }
                });
            }
        });
        
        if (peerAdvisorIds.length === 0) continue;
        
        // check if they share at least one advisor with root
        const sharedAdvisors = rootAdvisorIds.filter(advisorId => 
            peerAdvisorIds.includes(advisorId)
        );
        
        if (sharedAdvisors.length > 0) {
            cohortPeers.push(academic.ID); // use internal ID
            console.log(`Found cohort peer: ${academic.given_name} ${academic.family_name} (shares ${sharedAdvisors.length} advisor(s))`);
        }
    }
    
    console.log(`Found ${cohortPeers.length} cohort peers (same advisor)`);
    return cohortPeers;
}

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

    console.log(`[created] Called with filters:`, { university, yearMin, yearMax, showAdvisors, showCohortPeers, showStudents });

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
            const allSchools = degrees.flatMap(d => d.schools || []);
            const universityLower = university.toLowerCase();
            const matchesUniversity = degrees.some(degree => 
                degree.schools && degree.schools.some(school => {
                    const schoolLower = school.toLowerCase();
                    // Check both directions: if school contains filter OR filter contains school
                    return schoolLower.includes(universityLower) || universityLower.includes(schoolLower);
                })
            );
            if (!matchesUniversity) {
                console.log(`[Filter] Filtered out ${academic.given_name} ${academic.family_name}: university "${university}" not found in schools:`, allSchools);
                return false;
            } else {
                console.log(`[Filter] Passed ${academic.given_name} ${academic.family_name}: university "${university}" matched in schools:`, allSchools);
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
    
    // anne: always add root node to the map (don't filter the root)
    addNodeToMap(myMap, dataCache, rootId);

    // retrieves the edges of the root node
    const rootNode = myMap.get(rootId);
    
    const cohortPeerIds = new Set();
    
    if (showCohortPeers) {
        const cohortPeers = findCohortPeers(rootId, dataCache);
        
        for (const peerId of cohortPeers) {
            if (passesFilters(peerId)) {
                cohortPeerIds.add(peerId); // Add to cohort set FIRST
                addNodeToMap(myMap, dataCache, peerId); // Add cohort peer to the graph
                console.log(`Added cohort peer: ${peerId}`);
            }
        }
    }
    
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
            
            // SAKURA: Only add cohort peers' advisors if cohort peers filter is OFF
            // When both filters are on, only show the root's advisors
            if (!showCohortPeers) {
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
    
    // SAKURA: checks if the focus node is filtered out
    let rootFilteredOut = false;

    if (!passesFilters(rootId)) {
        rootFilteredOut = true;
    }

    return { 
        graphData: myMap, 
        rootInternalId: rootId,
        cohortPeerIds: cohortPeerIds,
        rootFilteredOut
    };
}
