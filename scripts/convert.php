<?php
$basePath = dirname(__DIR__);
// rename
// foreach(glob(__DIR__ . '/shp/*') AS $folder) {
//   exec("/usr/bin/rename 's/\(|\)//g' {$folder}/*");
// }

$fh = fopen($basePath . '/list.csv', 'r');
$info = [];
while($line = fgetcsv($fh, 2048)) {
  preg_match('/[a-z0-9]+/i', $line[0], $matches);
  $code = $matches[0];
  $clean = str_replace([$code, ' ', "\n"], '', $line[0]);
  $clean = str_replace(['）', '（'], [')', '('], $clean);
  $parts = preg_split('/[\\(\\)]/', $clean);
  $doc = explode("\n", $line[1]);

  $nameParts = explode('-', $parts[1]);
  if(isset($nameParts[1])) {
    $code .= '-' . $nameParts[1];
  }
  if($code === 'F0011') {
    continue;
  }

  $info[$code] = array(
    'name' => $parts[1],
    'type' => $parts[0],
    'date' => $doc[0],
    'doc' => $doc[1],
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
    $code = substr($code, 0, -1);
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
  $shpFile = str_replace(['(', ')', ' '], ['\\(', '\\)', '\\ '], $shpFile);
  exec("/usr/bin/ogr2ogr -t_srs EPSG:4326 -s_srs EPSG:3826 -mapFieldType String -dim 2 -lco SIGNIFICANT_FIGURES=11 -f geojson {$jsonFile} {$shpFile}");
  exec("mapshaper -i {$jsonFile} -o format=topojson {$topoFile}");
}
