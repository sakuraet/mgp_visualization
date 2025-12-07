# Change Log with Dates

## 10/18 
Created branch and input sample-data from another repo that has done something similar to us. Data was scraped from the site, courtesy of [j2kun](https://github.com/j2kun/math-genealogy-scraper/blob/main/data.json). Note, the data is old and is only to 2019-06-17. This is just a way to help me work on the actual content faster.

## 11/8
Made some basic code for the graph datastructure from json and the visualization into html. It kind of is balancing on a bunch of tooth picks, still has a lot of problems, but it is at least a first visual of what is going on in the data.

## 11/30
Updated hover feature, now need to do click feature to re-focus and draw the graph. The filter feature and full-graph rendering comes next. Preferably the full-graph rendering, so the filter is useful.

# Tasks
1. Figure out edge to node situation, possibly create class in order to include more details for the nodes
2. Figure out how to retrieve the year, I don't know how it's this hard
3. Figure out how to get the inputs (advisors) in the graph, possibly adding it to the existing edges code.
