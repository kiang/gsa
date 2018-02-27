<?php
$basePath = dirname(__DIR__);
// rename
// foreach(glob(__DIR__ . '/shp/*') AS $folder) {
//   exec("/usr/bin/rename 's/\(|\)//g' {$folder}/*");
// }

$fh = fopen($basePath . '/list.csv', 'r');
$info = array();
while($line = fgetcsv($fh, 2048)) {
  preg_match('/[a-z0-9]+/i', $line[1], $matches);
  $code = $matches[0];
  $name = trim(str_replace($code, '', $line[1]));
  $parts = explode('-', $line[1]);
  if(count($parts) > 1) {
    $code .= '-' . $parts[1];
  }

  $info[$code] = array(
    'name' => $name,
    'type' => $line[0],
    'date' => $line[2],
    'doc' => $line[3],
  );
  file_put_contents($basePath . '/info.json', json_encode($info));
}

foreach(glob($basePath . '/shp/*/*.shp') AS $shpFile) {
  $p = pathinfo($shpFile);
  $parts = explode('/', $p['dirname']);
  $part = array_pop($parts);
  $part = str_replace('SHP', '', $part);
  preg_match('/[a-z0-9]+/i', $part, $matches);
  $codeParts = explode('-', $part);
  if(!empty($codeParts[1]) && !empty($codeParts[0])) {
    $code = $matches[0] . '-' . $codeParts[1];
  } else {
    $code = $matches[0];
  }
  $jsonFile = $basePath . '/json/' . $code . '.json';
  $topoFile = $basePath . '/topo/' . $code . '.json';
  if(file_exists($jsonFile)) {
    unlink($jsonFile);
  }
  if(file_exists($topoFile)) {
    unlink($topoFile);
  }
  error_log("converting {$code}");
  exec("/usr/bin/ogr2ogr -t_srs EPSG:4326 -s_srs EPSG:3826 -mapFieldType String -dim 2 -lco SIGNIFICANT_FIGURES=11 -f geojson {$jsonFile} {$shpFile}");
  exec("mapshaper -i {$jsonFile} -o format=topojson {$topoFile}");
}
