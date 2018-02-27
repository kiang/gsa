window.app = {};
var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
var clickedCoordinate, populationLayer, gPopulation;
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});
var info = {};
var layerPool = {};
var layerColor = {
  F: new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(220, 53, 69, 0.5)',
        width: 3
    })
  }),
  H: new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255, 193, 7, 1)',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 193, 7, 0.5)'
    })
  }),
  G: new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(23,162,184,1)',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(23,162,184,0.5)'
    })
  }),
  L: new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(52,58,64,1)',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(52,58,64,0.5)'
    })
  })
};

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

$.getJSON('info.json', function(c) {
  info = c;
  for(k in info) {
    if(k.substring(0, 1) === 'F') {
      layerPool[k] = new ol.layer.Vector({
          source: new ol.source.Vector({
              url: 'topo/' + k + '.json',
              format: new ol.format.TopoJSON()
          }),
          style: layerColor.F
      });
      map.addLayer(layerPool[k]);
      $('#layerList').append('<a href="#" class="list-group-item list-group-item-action layerHighlight" data-id="' + k + '">' + k + ' ' + info[k].name + '</a>');
    }
  }
  $('a.layerHighlight').click(highlightClicked);
})

var highlightClicked = function() {
  var layerId = $(this).attr('data-id');
  map.getView().fit(layerPool[layerId].getSource().getExtent());
  return false;
};

$('a.btnTopo').click(function() {
  $('#layerList').html('');
  var btnId = $(this).attr('data-id');
  for(k in info) {
    if(k.substring(0, btnId.length) === btnId) {
      if(!layerPool[k]) {
        var colorIndex = k.substring(0, 1);
        layerPool[k] = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'topo/' + k + '.json',
                format: new ol.format.TopoJSON()
            }),
            style: layerColor[colorIndex]
        });
      }
      map.addLayer(layerPool[k]);
      $('#layerList').append('<a href="#" class="list-group-item list-group-item-action layerHighlight" data-id="' + k + '">' + k + ' ' + info[k].name + '</a>');
    } else {
      if(layerPool[k]) {
        map.removeLayer(layerPool[k]);
      }
    }
  }
  $('a.layerHighlight').click(highlightClicked);
  return false;
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 10
});

var map = new ol.Map({
  layers: [new ol.layer.Tile({source: new ol.source.OSM()})],
  overlays: [popup],
  target: 'map',
  view: appView
});
map.addControl(sidebar);

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
        console.log(error.message);
      });

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
          new ol.geom.Point(coordinates) : null);
      });

      new ol.layer.Vector({
        map: map,
        source: new ol.source.Vector({
          features: [positionFeature]
        })
      });
/**
 * Add a click handler to the map to render the popup.
 */
map.on('singleclick', function(evt) {
  clickedCoordinate = evt.coordinate;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      var p = feature.getProperties();
      console.log(p);
  });
});
