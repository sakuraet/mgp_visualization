# Change Log with Dates

## 10/18 
Created branch and input sample-data from another repo that has done something similar to us. Data was scraped from the site, courtesy of [j2kun](https://github.com/j2kun/math-genealogy-scraper/blob/main/data.json). Note, the data is old and is only to 2019-06-17. This is just a way to help me work on the actual content faster.

## 11/8
Made some basic code for the graph datastructure from json and the visualization into html. It kind of is balancing on a bunch of tooth picks, still has a lot of problems, but it is at least a first visual of what is going on in the data.

<<<<<<< HEAD
# Tasks
1. Figure out edge to node situation, possibly create class in order to include more details for the nodes
2. Figure out how to retrieve the year, I don't know how it's this hard
3. Figure out how to get the inputs (advisors) in the graph, possibly adding it to the existing edges code.
=======
# 11/17

We have something of a foundation to get the advisors and the advisees. Now I need to figure out a way to make it iterative so that we can construct the entire tree from top to bottom, as well as some actual features, so it can be a data visualization.

# Tasks
1. Create feature to sketch out the ENTIRE graph from top to bottom by iterating on each advisor/advisee that is available. This should be a separate method/file that does this. 
2. Change default to be David Bleecker (former prof @ UHM, author of my PDEs book lmao)
3. Add in hover features of dissertation and other facts, and a click feature that resets the graph to be centered around that individual
4. Highlight the person of interest using blue or some other color in the node.
5. Figure out edge to node situation, possibly create class in order to include more details for the nodes
>>>>>>> hoverclick-v2
