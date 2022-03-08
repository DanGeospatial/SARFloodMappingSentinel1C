# SARFloodMappingSentinel1C
Uses Sentinel 1C SAR data to identify flooded areas.

This script is designed for the Google Earth Engine (GEE) javascript editor. 
It is designed to create an unsupervised classification for multiple years at a given location to track the progress of flooding extent.
This classification uses Sentinel 1C VV polarized SAR rasters as input and the classes of the resultant unsupervised image are used to calculate flooded area.
THe easiest method to calculate flooded area is by merging classes that represent water area in ArcGIS Pro or another GIS software.

The original usage for this script was a project to track the flooding created by the reservoir filling of the Grand Renaissance Dam in Ethiopia. 
With the correct edits this program can be adapted to other projects.

TODO
- Expand settings and clean up clustering output
- Make program more automated 
