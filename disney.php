<?php

$file = file_get_contents('disney.html');

$out = [];

$handle = fopen('disney.txt', 'wb');
if (preg_match_all('/class="mainfont"\>([^\<]+)\<\/td\>[^\>]+\>([^\<]+)\<\/td\>[\s]+\<td/i', $file, $matches)) {
	//print_r($matches);
	for ($i = 0, $count = count($matches[0]); $i < $count; $i++) {
		if (count(explode(' ', $matches[2][$i])) < 5) {
fwrite($handle, trim($matches[1][$i]) . '*' . trim($matches[2][$i]) . PHP_EOL);
	}
}
}

fclose($handle);
