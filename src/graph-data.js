import * as academics from "../sample-data/all_academics_merged_backup.json"

    /*
        function: created()
        -inputs data and reads it iteratively (god help us)
        -uses "mrauth_id" as id
        -uses descendants as edges and advisors as inputs. These are techinically both edges but it's kind of hard including both of them

        creates a map that sets the data from the json to a graph structure
    */
    export function created() {
        console.log("JSON data imported", academics);
        let myMap = new Map(); //map json to node
        const initData = academics[0].reports || academics.default;

        //to be safe
        if (!initData) {
            console.error("Cannot find initData, check JSON import");
            return null;
        }

        //may want to adjust my ["x"] for .x for styling later
        for (const item of initData) {
            const id = item["mrauth_id"];
            const edges = item["descendants"] ? item["descendants"]["advisees"].map(a => a[0]) : [];
            const inputs = item["degrees"] ? Object.keys(item["degrees"][0]["advised by"] || {}) : [];
            const yearAward = item["degrees"] && item["degrees"][3] ? item["degrees"][3]["degree_year"] : "N/A";
            
            //meta info about the node, will include thesis eventually.
            const detail = {
                familyName: item["Family Name"] || "",
                givenName: item["Given Name"] || "",
                yearAward: yearAward
            };

             myMap.set(id, {
                edges: edges,
                detail: detail,
                inputs: inputs
            });  
        }
        return myMap;
    };

    //no need?
    // export function mounted() {
    //     this.render();
    // };


    // module.exports = {
    //     created,
    //     mounted
    // }

