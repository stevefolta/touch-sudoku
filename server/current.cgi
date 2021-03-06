#!/bin/bash

# An example of a CGI script to serve up puzzles.  This assumes that all the
# files in the current directory (except this script) are puzzles, in the
# following format:
#
# 	Puzzle-Level: Whatever
#
# 	..1..2..7
# 	8.7.1...5
# 	5.36.....
# 	..5..4...
# 	.3.....8.
# 	...3..1..
# 	.....86.9
# 	7...6.4.1
# 	4..7..8..
#
# It will pick a puzzle at random.


num_files=0
for file in *; do
	if [ "$file" == "current" -o "$file" == "current.cgi" ]; then
		continue
	fi
	files[$num_files]="$file"
	num_files=$(($num_files + 1))
done

randIndex=$((RANDOM % num_files))

# Add the Content-type header.
echo Content-type: text/plain
echo

cat ${files[$randIndex]}

