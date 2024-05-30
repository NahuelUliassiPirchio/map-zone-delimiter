# Map Zone Delimiter

## Description
**Map Zone Delimiter** is an interactive tool that allows you to create and manage different types of geospatial zones on a map using the Leaflet library. This project was developed to facilitate the assignment of values in different geographic areas, providing options to create zones by radius, polyline areas, and abstract areas using Voronoi diagrams.

## Features
- **Radius Zones**: Allows creating adjustable radius circles on the map.
- **Polyline Areas**: Facilitates the creation of polygons based on selected points.
- **Abstract Areas (Voronoi)**: Generates Voronoi diagrams to segment the map into abstract zones.
- **CSV Import and Export**: Supports importing and exporting geospatial data in CSV format.
- **Group Management**: Points on the map can be easily grouped and managed.

## Installation
1. Clone the repository:
# Map Zone Delimiter

## Description
**Map Zone Delimiter** is an interactive tool that allows you to create and manage different types of geospatial zones on a map using the Leaflet library. This project was developed to facilitate the assignment of values in different geographic areas, providing options to create zones by radius, polyline areas, and abstract areas using Voronoi diagrams.

## Features
- **Radius Zones**: Allows creating adjustable radius circles on the map.
- **Polyline Areas**: Facilitates the creation of polygons based on selected points.
- **Abstract Areas (Voronoi)**: Generates Voronoi diagrams to segment the map into abstract zones.
- **CSV Import and Export**: Supports importing and exporting geospatial data in CSV format.
- **Group Management**: Points on the map can be easily grouped and managed.

## Installation
1. Clone the repository:
```bash
	git clone https://github.com/yourusername/map-zone-delimiter.git
	cd map-zone-delimiter
```
2. Open the `index.html` file in your browser.
3. Alternatively, you can run the application directly on the web from the following link: [Map Zone Delimiter](https://nahueluliassipirchio.github.io/map-zone-delimiter/)
## Usage

1. **Select the Zone Type**:
    
    - Use the dropdown menu to choose between radius, polyline area, or abstract area.
2. **Add Points**:
    
    - Click on the map to add points. The points will be added to the active group and visualized according to the selected zone type.
3. **Manage Groups**:
    
    - Use the "New Group" button to create a new group.
    - Groups can be activated by clicking on them and edited using the edit button.
4. **Import and Export CSV**:
    
    - Use the "Export as CSV" button to download the points data in CSV format.
    - Use the "Import CSV" button to load points from a CSV file.

## Example Usage with Python

### Installing Dependencies
```bash
pip install pandas numpy shapely
```
### Example Code

Below is an example of how to use the exported CSV to assign data to geospatial points using pandas and shapely in Python, distinguishing between radius, polylines, and the nearest point:
```bash
import pandas as pd
import numpy as np
from shapely.geometry import Point, Polygon
from scipy.spatial import distance

# Load data from CSV
data = pd.read_csv('my_data.csv')

# Create geospatial points
data['geometry'] = data.apply(lambda row: Point(row['Longitude'], row['Latitude']), axis=1)

# Function to assign data within a radius
def assign_within_radius(data, center, radius):
    center_point = Point(center)
    data['within_radius'] = data['geometry'].apply(lambda point: center_point.distance(point) <= radius)
    return data[data['within_radius']]

# Function to assign data within a polygon
def assign_within_polygon(data, polygon_points):
    polygon = Polygon(polygon_points)
    data['within_polygon'] = data['geometry'].apply(lambda point: polygon.contains(point))
    return data[data['within_polygon']]

# Function to assign data to the nearest point if not in radius or polygon
def assign_nearest_point(data, voronoi_points):
    voronoi_data = pd.DataFrame(voronoi_points, columns=['Latitude', 'Longitude'])
    voronoi_data['geometry'] = voronoi_data.apply(lambda row: Point(row['Longitude'], row['Latitude']), axis=1)

    def find_nearest(point, points):
        distances = points.apply(lambda p: point.distance(p))
        return points.iloc[distances.idxmin()]

    # Filter points not in radius or polygon
    data['assigned_point'] = data.apply(
        lambda row: find_nearest(row['geometry'], voronoi_data['geometry']) 
        if not row['within_radius'] and not row['within_polygon'] else None, axis=1
    )
    return data

# Example usage:
# Assign data within a radius of 0.01 degrees around the point (lon, lat)
assigned_radius = assign_within_radius(data, (-58.496659, -34.626056), 0.01)
print("Data within radius:\n", assigned_radius)

# Assign data within a polygon defined by a list of points (lon, lat)
polygon_points = [(-58.497, -34.627), (-58.495, -34.626), (-58.496, -34.625), (-58.497, -34.626)]
assigned_polygon = assign_within_polygon(data, polygon_points)
print("Data within polygon:\n", assigned_polygon)

# Assign data to the nearest point if not in radius or polygon
voronoi_points = [(-58.496, -34.626), (-58.495, -34.627), (-58.497, -34.625)]
assigned_nearest = assign_nearest_point(data, voronoi_points)
print("Data assigned to nearest point:\n", assigned_nearest)
```

### Explanation of the Example Python Code

1. **Loading Data**: Load the exported CSV using pandas.
2. **Creating Geospatial Points**: Create geospatial point objects using `shapely`.
3. **Assigning within a Radius**: Define a function to check if points are within a specific radius from a center.
4. **Assigning within a Polygon**: Define a function to check if points are within a polygon defined by a list of points.
5. **Assigning to the Nearest Point**: If a point is not within a radius or polygon, it is assigned to the nearest point using Euclidean distance.

## Project Structure

- **index.html**: Contains the basic structure of the web application.
- **css/styles.css**: Styles for the visual presentation of the application.
- **js/main.js**: Main logic for creating and managing points and zones on the map.
- **js/mainPolygons.js**: Specific functions for creating polyline areas.
- **js/mainRadius.js**: Specific functions for creating radius zones.

## Contributions

Contributions are welcome. If you want to improve this project, please fork the repository and submit a pull request with your changes.

## License

This project is under the MIT License.

## Author

Developed by [Nahuel Uliassi Pirchio](https://github.com/NahuelUliassiPirchio).
