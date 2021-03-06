var text = require('users/gena/packages:text');

// Delineate fields 

var Field1 = /* color: #3cffd5 */ee.Geometry.Polygon([ 
  [[-122.37158060073853,38.458125582533334],
    [-122.3727822303772, 38.45752068253876],
  [-122.37192392349243,38.45646209534339],
  [-122.37063646316528,38.457033398298925],
  [-122.37158060073853,38.458125582533334]]
  ]);
var Field1_F  = ee.Feature(Field1,{id: 1});

var Field2= /* color: #999900 */ee.Geometry.Polygon([
    [[-122.37115144729614,38.45536988592448],
    [-122.369863986969, 38.4560084103617],
    [-122.3706579208374,38.456966186421305],
    [-122.37196683883667,38.45636127670514],
    [-122.37115144729614,38.45536988592448]]])

var Field2_F  = ee.Feature(Field2,{id: 2});
var Fields_FC = ee.FeatureCollection([Field1_F,Field2_F]);

// visu:
Map.centerObject(Fields_FC, 17)
Map.addLayer(Fields_FC)

// this gives me 1): whether (and which) polygon the pixel falls in
var fieldsRaster = Fields_FC.reduceToImage(['id'], ee.Reducer.firstNonNull()).select(['first'], ['field_id'])

print(Fields_FC, "Fields_FC")
print(fieldsRaster.projection(), "fieldsRaster scale")
print(fieldsRaster.projection().nominalScale(), "fieldsRaster scale")

print(fieldsRaster, "fieldsRaster")

// how can I obtain 2): how much of the cell is covered by the polygon?

var scale = 60
var projection = ee.Projection('EPSG:3857').atScale(scale)

// for every image cell compute fraction of it's area covered by the polygon
var fraction = ee.Image.pixelArea().clip(Fields_FC).reproject(projection).mask().clip(Fields_FC)
Map.addLayer(fraction, {min: 0, max: 1, palette:['e5f5e0', 'a1d99b', '31a354']}, 'cell area fraction')


var cellInfo = ee.Image.pixelLonLat().reproject(projection)
  .addBands(fraction.unmask())
  .reduceRegion(ee.Reducer.toList(), Fields_FC.geometry().buffer(scale/2), scale)

var centers = ee.List(cellInfo.get('longitude')).zip(cellInfo.get('latitude')).zip(cellInfo.get('area'))
  .map(function(o) {
    o = ee.List(o)
    var xy = o.get(0)
    var area = o.get(1)
    return ee.Feature(ee.Algorithms.GeometryConstructors.Point(xy), {area: area})
  })

centers = ee.FeatureCollection(centers)

Map.addLayer(centers, {}, 'cell centers')

var areaRatioText = ee.ImageCollection(centers.map(function(i) {
  return text.draw(ee.Number(i.get('area')).format('%.3f'), i.geometry(), Map.getScale(), {
    fontSize:14, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.6
  })
})).mosaic()

Map.addLayer(areaRatioText, {}, 'ratio')

