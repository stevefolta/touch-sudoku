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
# The "Puzzle-Level:" header ends up as part of the HTTP headers.

num_files=0
for file in *; do
	if [ "$file" == "current" -o "$file" == "current.cgi" ]; then
		continue
	fi
	files[$num_files]="$file"
	num_files=$(($num_files + 1))
done

randIndex=$((RANDOM % num_files))

# Add the Content-type header.  The file will contain additional headers
# pertaining to the puzzle.
echo Content-type: text/plain

cat ${files[$randIndex]}

