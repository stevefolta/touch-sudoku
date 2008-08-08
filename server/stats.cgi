#!/usr/bin/env python

# An example of a stats script.  It accepts stats for a complete puzzle from
# the client, updates the stats, and returns the stats.  JSON is used to
# communicate with the client, and to store the stats (in flat files).

# Requirements: simplejson

# Configuration.
levelDir = "levels"
logFilePath = "stats-errors.log"

import simplejson, sys, os.path, fcntl

defaultStats = { "plays": 0, "totalSeconds": 0, "totalMistakes": 0 }


def log(message):
	errorLog = open(logFilePath, "a")
	print >> errorLog, message
	errorLog.close


def update_stats_file(path, seconds, mistakes):
	stats = defaultStats.copy()
	statsFile = None
	statsFileExisted = False
	if os.path.exists(path):
		statsFile = open(path, "r+")
		statsFileExisted = True
	else:
		statsFile = open(path, "w+")
	try:
		# We lock the file, so two requests don't try to update it at once.
		fcntl.lockf(statsFile, fcntl.LOCK_EX)

		# Read old stats (if they existed).
		if statsFileExisted:
			try:
				stats.update(simplejson.load(statsFile))
			except:
				pass

		# Update the stats.
		stats["plays"] += 1
		stats["totalSeconds"] += seconds
		stats["totalMistakes"] += mistakes

		# Write the stats file.
		statsFile.seek(0)
		simplejson.dump(stats, statsFile)
		statsFile.truncate()
	finally:
		fcntl.lockf(statsFile, fcntl.LOCK_UN)
		statsFile.close()

	return stats
	

try:
	# Read the new stat.
	statsIn = simplejson.load(sys.stdin)
	level = statsIn['level']
	seconds = statsIn['seconds']
	mistakes = statsIn.get('mistakes', 0)

	# Start collecting stats to output.
	statsOut = { "levelAverageTime": 0, "levelAverageMistakes": 0 }

	# Update the stats file for this level.
	levelStats = update_stats_file(levelDir + "/" + level, seconds, mistakes)
	if levelStats['plays'] > 0:
		plays = levelStats['plays']
		statsOut['levelAverageTime'] = levelStats['totalSeconds'] / plays
		statsOut['levelAverageMistakes'] = levelStats['totalMistakes'] / plays
	
	# Output the stats.
	print "Content-type: text/json"
	print
	simplejson.dump(statsOut, sys.stdout)
	print

except:
	# Do nothing.  We should somehow signal an error thru HTTP... but the client
	# wouldn't do anything with it anyway.
	errorLog = open(logFilePath, "a")
	print >> errorLog, sys.exc_type, sys.exc_value
	errorLog.close

