# MGP Visualization

A React-based web application for visualizing Mathematics Genealogy Project (MGP) data through interactive node-link diagrams.

## Overview

This project creates an interactive visualization of academic genealogy networks, showing advisor-student relationships between mathematicians. Data is retrieved using `mgp_query.py` from the MGP API.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

## Project Structure

```
mgp_visualization/
├── src/
│   ├── components/
│   │   ├── Homepage.jsx          # Main page with visualization placeholder
│   │   └── Homepage.css          # Homepage styles
│   ├── App.jsx                   # Main App component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles
├── mgp_query.py                  # Python script to query MGP API
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies
```

## Data Flow

1. Use `mgp_query.py` to retrieve data from the MGP API
2. Process and structure the data for visualization
3. Import the data into your React application
4. Create your node-link diagram in the placeholder area

## Features

- Clean, modern UI with gradient design
- Large placeholder area for node-link diagram (500px height, expandable)
- Responsive layout for different screen sizes
- Ready-to-use structure for adding D3.js, vis.js, or other visualization libraries

## Next Steps

1. Query data using `mgp_query.py`
2. Choose a visualization library (D3.js, vis.js, react-force-graph, etc.)
3. Replace the placeholder with your node-link diagram component
4. Add interactivity (zoom, pan, node selection, tooltips)
5. Style nodes and edges based on your data

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling with gradients and animations

## Development

The project uses Vite for fast development with Hot Module Replacement (HMR).

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```
