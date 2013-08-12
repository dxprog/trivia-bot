<?php

function isThing($line) {
	return preg_match('/([\d]+[A]?)\./', $line);
}

$file = file('http://www.cache.cow.net/~draith/sw/jedi_mas.txt');

$values = [];

for ($i = 0, $count = count($file); $i < $count; $i++) {
	$line = $file[$i];
	if (preg_match('/([\d]+[A]?)\./', $line, $match)) {
		$val = trim(str_replace($match[1] . '.', '', $line));
		if ($i + 1 < $count && !isThing($file[$i + 1])) {
			$val .= ' ' . trim($file[$i + 1]);
			$i++;
		}
		$val = str_replace('*', '', $val);
		$values[$match[1]] = $val;
	}
}

$handle = fopen('starwars.txt', 'wb');
foreach ($values as $num => $value) {
	if (strpos($num, 'A') === false && isset($values[$num . 'A'])) {
		if (strpos($values[$num . 'A'], '"') !== false || count(explode(' ', $values[$num . 'A'])) < 4) {
			fwrite($handle, $value . '*' . $values[$num . 'A'] . PHP_EOL);
		}
	}
}
fclose($handle);