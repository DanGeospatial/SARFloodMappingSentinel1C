//SOURCES:
//Much of the code for this script has been taken from the Google Earth Engine Guides
//This code was then modified to perform the water mapping using Sentinel 1-C

//_____________________________________________________________________________
//INPUT AND PROCESS MULTISPECTRAL DATA
//_____________________________________________________________________________

function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

var dataset = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                  .filterDate('2017-07-20', '2017-08-31')
                  .filterBounds(area)
                  .map(maskL8sr);

Map.addLayer(dataset.median(), visParams);
print(dataset, 'l8');

//Compute wetness index
var mndwi = dataset.median().normalizedDifference(['B3', 'B6']).rename ('mndwi');

Map.addLayer(mndwi, {min: -1, max: 1}, 'wetness index', true);

//_____________________________________________________________________________
//PERFORM UNSUPERVISED CLASSIFICATION FOR Index
//_____________________________________________________________________________

// Define a region in which to generate a sample of the input.
var regionmndwi = area;

// Display the sample region.
//Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'region');

// Make the training dataset.
var trainingmndwi = mndwi.sample({
  region: regionmndwi,
  scale: 15,
  numPixels: 5000
});

// Instantiate the clusterer and train it.
var clusterermndwi = ee.Clusterer.wekaKMeans(15).train(trainingmndwi);

// Cluster the input using the trained clusterer.
var resultmndwi = mndwi.cluster(clusterermndwi);

// Display the clusters with random colors.
Map.addLayer(resultmndwi.randomVisualizer(), {}, 'clustersmndwi');

//_____________________________________________________________________________
//INPUT AND PROCESS SAR DATA
//_____________________________________________________________________________
var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var desc2020 = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var desc2017 = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

var spring = ee.Filter.date('2020-08-01', '2020-08-31');
var lateSpring = ee.Filter.date('2017-08-01', '2017-08-31');
//var summer = ee.Filter.date('2015-06-11', '2015-08-31');

var desc2020Change = ee.Image.cat(
        desc2020.filter(spring).mean());

var desc2017Change = ee.Image.cat(
        desc2017.filter(lateSpring).mean());
        
print(desc2020Change);

Map.addLayer(desc2017Change, {min: -25, max: 5}, 'Multi-T Mean 2017Change', true);
Map.addLayer(desc2020Change, {min: -25, max: 5}, 'Multi-T Mean 2020Change', true);

//_____________________________________________________________________________
//PERFORM UNSUPERVISED CLASSIFICATION FOR 2020
//_____________________________________________________________________________

// Define a region in which to generate a sample of the input.
var region = area;

// Display the sample region.
//Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'region');

// Make the training dataset.
var training2020 = desc2020Change.sample({
  region: region,
  scale: 15,
  numPixels: 5000
});

// Instantiate the clusterer and train it.
var clusterer = ee.Clusterer.wekaKMeans(15).train(training2020);

// Cluster the input using the trained clusterer.
var result2020 = desc2020Change.cluster(clusterer);

// Display the clusters with random colors.
Map.addLayer(result2020.randomVisualizer(), {}, 'clusters2020');

//_____________________________________________________________________________
//PERFORM UNSUPERVISED CLASSIFICATION FOR 2017
//_____________________________________________________________________________

// Define a region in which to generate a sample of the input.
var region2017 = area;

// Display the sample region.
//Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'region');

// Make the training dataset.
var training2017 = desc2017Change.sample({
  region: region2017,
  scale: 15,
  numPixels: 5000
});

// Instantiate the clusterer and train it.
var clusterer2017 = ee.Clusterer.wekaKMeans(15).train(training2017);

// Cluster the input using the trained clusterer.
var result2017 = desc2017Change.cluster(clusterer2017);

// Display the clusters with random colors.
Map.addLayer(result2017.randomVisualizer(), {}, 'clusters2017');

//_____________________________________________________________________________
//OUTPUT IMAGES
//_____________________________________________________________________________

Export.image.toDrive({
  image: desc2017Change,
  description: 'desc2017Change',
  scale: 15,
  region: area
});

Export.image.toDrive({
  image: desc2020Change,
  description: 'desc2020Change',
  scale: 15,
  region: area
});

Export.image.toDrive({
  image: resultmndwi,
  description: 'resultmndwi',
  scale: 15,
  region: area
});

