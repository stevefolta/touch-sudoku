var puzzleSrc = "http://somefancy.com/touch-sudoku/puzzles/current.cgi";
var requestCrossSite = false;
var statsUrl = null;


var grid = null;
var selectedCell = null;
var selectedRow = 0;
var selectedCol = 0;
var selectedUsedKey = false;
var cellsLeft = 0;
var mistakes = 0;
var checks = 0;
var startTime = null;
var winTime = null;


function handle_key(event) {
	if (!event)
		event = window.event;

	var handled = false;

	if (event.ctrlKey || event.altKey || event.metaKey)
		return;

	var key = event.keyCode;
	if (key == 0)
		key = event.which;
	key = String.fromCharCode(key);
	switch (key) {
		case "j":
			selectedRow = (selectedRow + 1) % 9;
			selected_cell_changed();
			handled = true;
			break;
		case "k":
			selectedRow -= 1;
			if (selectedRow < 0)
				selectedRow = 8;
			selected_cell_changed();
			handled = true;
			break;
		case "h":
			selectedCol -= 1;
			if (selectedCol < 0)
				selectedCol = 8;
			selected_cell_changed();
			handled = true;
			break;
		case "l":
			selectedCol = (selectedCol + 1) % 9;
			selected_cell_changed();
			handled = true;
			break;
		case "1":	case "2":	case "3":	case "4": case "5":
		case "6":	case "7":	case "8":	case "9":
		case "?":	case "=":
			if (!winTime)
				digit_pressed(key);
			handled = true;
			break;
		case "\b": 	// Backspace
			if (!winTime && !selectedCell.getAttribute("given"))
				selectedCell.textContent = "";
			handled = true;
			break;
		case "\r":  	// Enter
			if (!winTime)
				check_puzzle();
			update_time();
			selectedUsedKey = false;
			handled = true;
			break;
		case "r":
			clear_puzzle();
			get_puzzle();
			handled = true;
			break;
		}

	if (handled) {
		event.preventDefault();
		event.stopPropagation();
		}
}


function digit_pressed(digit) {
	if (selectedCell.getAttribute("given"))
		return;

	if (!selectedUsedKey) {
		selectedCell.textContent = digit;
		selectedUsedKey = true;
		}
	else
		selectedCell.textContent += digit;

	selectedCell.removeAttribute("wrong");
	check_pencil();
}


function check_pencil() {
	var pencilled = false;
	var contents = selectedCell.textContent;
	if (contents.length > 1)
		pencilled = true;
	else if (contents.length == 1) {
		if (contents < "1" || contents > "9")
			pencilled = true;
		}
	if (pencilled)
		selectedCell.setAttribute("pencil", "true");
	else
		selectedCell.removeAttribute("pencil");
}


function selected_cell_changed() {
	if (selectedCell)
		selectedCell.removeAttribute("selected");
	selectedCell = grid[selectedRow][selectedCol];
	selectedCell.setAttribute("selected", "true");
	selectedUsedKey = false;
}


function check_puzzle() {
	var used = new Array(9);
	function clear_used() {
		for (var i = 0; i < 9; ++i)
			used[i] = false;
		}
	var hadMistake = false;

	// Clear existing errors.
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			grid[row][col].removeAttribute("error");
			grid[row][col].removeAttribute("wrong");
			}
		}

	// Check the boxes.
	for (var boxRow = 0; boxRow < 3; ++boxRow) {
		for (var boxCol = 0; boxCol < 3; ++boxCol) {
			var boxError = false;
			clear_used();

			// Check this box.
			for (var cellRow = 0; cellRow < 3; ++cellRow) {
				for (var cellCol = 0; cellCol < 3; ++cellCol) {
					var digit = digitAt(boxRow * 3 + cellRow, boxCol * 3 + cellCol);
					if (digit < 0)
						continue;
					if (used[digit]) {
						boxError = true;
						break;
						}
					used[digit] = true;
					}
				if (boxError)
					break;
				}

			// Mark this box if there was an error.
			if (boxError) {
				hadMistake = true;
				for (var cellRow = 0; cellRow < 3; ++cellRow) {
					for (var cellCol = 0; cellCol < 3; ++cellCol)
						markErrorCell(boxRow * 3 + cellRow, boxCol * 3 + cellCol);
					}
				}
			}
		}

	// Check the rows.
	for (var row = 0; row < 9; ++row) {
		var rowError = false;
		clear_used();

		// Check this row.
		for (var col = 0; col < 9; ++col) {
			var digit = digitAt(row, col);
			if (digit < 0)
				continue;
			if (used[digit]) {
				rowError = true;
				break;
				}
			used[digit] = true;
			}

		// Mark this row if there was an error.
		if (rowError) {
			hadMistake = true;
			for (var col = 0; col < 9; ++col)
				markErrorCell(row, col);
			}
		}

	// Check the columns.
	for (var col = 0; col < 9; ++col) {
		var colError = false;
		clear_used();

		// Check this column.
		for (var row = 0; row < 9; ++row) {
			var digit = digitAt(row, col);
			if (digit < 0)
				continue;
			if (used[digit]) {
				colError = true;
				break;
				}
			used[digit] = true;
			}

		// Mark this column if there is an error.
		if (colError) {
			hadMistake = true;
			for (var row = 0; row < 9; ++row)
				markErrorCell(row, col);
			}
		}

	// Cell-by-cell checks (answers, cells left).
	cellsLeft = 0;
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			var digit = digitAt(row, col);
			if (digit < 0)
				cellsLeft += 1;
			else {
				var cell = grid[row][col];
				var answer = cell.getAttribute("answer");
				if (answer && answer.length == 1 && cell.textContent != answer)
					cell.setAttribute("wrong", "true");
				}
			}
		}
	if (cellsLeft == 0 && !hadMistake)
		won();

	// Update status.
	if (hadMistake) {
		mistakes += 1;
		update_mistakes();
		}
	checked();
}


function digitAt(row, col) {
	var entry = grid[row][col].textContent;
	if (entry.length != 1 || entry < "1" || entry > "9")
		return -1;
	return parseInt(entry) - 1;
}

function markErrorCell(row, col) {
	var cell = grid[row][col];
	cell.setAttribute("error", "true");
}


function won() {
	winTime = new Date();

	var winRow = "WINWINWIN";
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			grid[row][col].textContent = winRow.charAt(col);
			}
		}

	set_status("Won");
	update_time();

	// Send stats to the server, if configured to do so.
	if (statsUrl) {
		try {
			if (requestCrossSite) {
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					}
				catch (e) {
					alert("Permission UniversalBrowserRead denied.");
					}
				}

			var levelElement = document.getElementById("level");
			var seconds = Math.floor((winTime - startTime) / 1000);
			var statsObj = {
				"level": levelElement.textContent,
				"seconds": seconds
				};

			var request = new XMLHttpRequest();
			request.open("POST", statsUrl, true);
			request.onreadystatechange = function () {
				if (request.readyState == 4) {
					if (request.status == 200 && request.responseText)
						got_stats(request.responseText);
					}
				}
			request.send(JSON.stringify(statsObj));
			}
		catch (error) {
			// Do nothing.
			alert("Couldn't send to stats: " + error);
			}
		}
}


function load_puzzle(puzzle) {
	var row = 0;
	var col = 0;
	var ci = 0;
	var puzzleComplete = false;
	var inAnswers = false;
	var inHeaderSection = true;

	function parse_puzzle_line() {
		for (; ci < puzzle.length; ++ci) {
			var c = puzzle.charAt(ci);
			if (c == "\n" || c == "\r") {
				ci += 1;
				break;
				}
			if (puzzleComplete)
				continue;

			var advance = false;
			if (c == ".")
				advance = true;
			else if (c >= "1" && c <= "9") {
				if (inAnswers)
					grid[row][col].setAttribute("answer", c);
				else {
					grid[row][col].textContent = c;
					grid[row][col].setAttribute("given", "true");
					}
				advance = true;
				}
			if (advance) {
				col += 1;
				if (col >= 9) {
					col = 0;
					row += 1;
					if (row >= 9)
						puzzleComplete = true;
					}
				}
			}
		}

	function read_rest_of_line() {
		var lineStart = -1;
		while (ci < puzzle.length) {
			var c = puzzle.charAt(ci);
			ci += 1;
			if (c == "\n" || c == "\r")
				break;
			if (lineStart < 0 && c != " " && c != "\t")
				lineStart = ci - 1;
			}
		if (lineStart < 0)
			return "";
		else
			return puzzle.slice(lineStart, ci - 1);
		}

	function parse_header_line() {
		// Get the header name.
		var headerStart = ci;
		var headerName = "";
		while (ci < puzzle.length) {
			var c = puzzle.charAt(ci);
			ci += 1;
			if (c == "\n" || c == "\r") {
				// Reached the end of line before the ":"; not really a header.
				return;
				}

			if (c == ":") {
				headerName = puzzle.slice(headerStart, ci - 1);
				break;
				}
			}

		if (headerName == "Answers") {
			row = 0;
			col = 0;
			puzzleComplete = 0;
			inAnswers = true;
			// The rest of the line might contain the answers.
			parse_puzzle_line();
			}
		else if (headerName == "Puzzle-Level") {
			set_level(read_rest_of_line());
			}
		else {
			// Discard the rest of the line.
			read_rest_of_line();
			}
		}

	// Read the puzzle file, line-by-line.
	while (ci < puzzle.length) {
		// What kind of line is it?  Peek at the first character to find out.
		var c = puzzle.charAt(ci);
		if (c == "\n" || c == "\r") {
			// Blank line.
			ci += 1;
			if (inHeaderSection) {
				// Header section ending; reset the puzzle.
				// This allows the answers to be in the header while the puzzle itself
				// is in the body.
				inHeaderSection = false;
				row = 0;
				col = 0;
				puzzleComplete = 0;
				inAnswers = false;
				}
			}
		else if (c == "." || (c >= "1" && c <= "9")) {
			// Part of the puzzle.
			parse_puzzle_line();
			}
		else if (c == "#") {
			// Comment line.
			read_rest_of_line();
			}
		else {
			// Treat anything else as a (potential) header line.
			parse_header_line();
			}
		}

	// Initial selected cell.
	selectedRow = 0;
	selectedCol = 0;
	selected_cell_changed();

	// Clear stats.
	mistakes = 0;
	checks = 0;
	startTime = new Date();
	winTime = null;
	update_time();
	update_mistakes();
	update_checks();
	document.getElementById("avg-time-row").setAttribute("hidden", "true");
	set_status("Playing");
}


function get_puzzle()
{
	set_status("Loading...");

	if (requestCrossSite) {
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			}
		catch (e) {
			alert("Permission UniversalBrowserRead denied.");
			}
		}

	try {
		var request = new XMLHttpRequest();
		request.open("GET", puzzleSrc, true);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				if (request.status == 200 && request.responseText) {
					level = request.getResponseHeader("Puzzle-Level");
					if (level)
						set_level(level);
					else
						set_level("Unknown");
					load_puzzle(request.responseText);
					}
				else
					set_status("Failed: " + request.status);
				}
			}
		request.send(null);
		}
	catch (error) {
		alert("Couldn't get the puzzle!");
		}
}

function clear_puzzle()
{
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			grid[row][col].textContent = "";
			grid[row][col].removeAttribute("given");
			grid[row][col].removeAttribute("error");
			grid[row][col].removeAttribute("pencil");
			grid[row][col].removeAttribute("answer");
			}
		}
}


function set_status(status) {
	document.getElementById("status").textContent = status;
}

function set_level(level) {
	element = document.getElementById("level");
	element.textContent = level;
	if (level == "Unknown")
		element.setAttribute("unknown", "true");
	else
		element.removeAttribute("unknown");
}

function update_mistakes() {
	document.getElementById("mistakes").textContent = mistakes;
}

function update_checks() {
	document.getElementById("checks").textContent = checks;
}

function checked() {
	checks += 1;
	update_checks();
}

function elapsedTimeToString(seconds) {
	var str = "";
	var hours = Math.floor(seconds / (60 * 60));
	if (hours > 0) {
		str += hours;
		str += ":";
		}
	seconds -= hours * 60 * 60;
	var minutes = Math.floor(seconds / 60);
	if (hours > 0 && minutes < 10)
		str += "0";
	str += minutes;
	str += ":";
	seconds -= minutes * 60;
	if (seconds < 10)
		str += "0";
	str += seconds;
	return str;
}

function update_time() {
	if (!startTime)
		document.getElementById("time").textContent = "";
	else {
		var endTime = winTime;
		if (!endTime)
			endTime = new Date();
		var elapsedTime = Math.floor((endTime - startTime) / 1000);
		document.getElementById("time").textContent =
			elapsedTimeToString(elapsedTime);
		}
}

function tick() {
/***
	if (!winTime) 	// No need...
***/
		update_time();
	window.setTimeout(tick, 500);
}


function cell_click() {
	selectedRow = parseInt(this.getAttribute("row"));
	selectedCol = parseInt(this.getAttribute("col"));
	selected_cell_changed();
}


function got_stats(json) {
	try {
		var result = JSON.parse(json);
		if (result.averageTime) {
			document.getElementById("avg-time").textContent =
				elapsedTimeToString(result.averageTime);
			}

		document.getElementById("avg-time-row").removeAttribute("hidden");
		}
	catch (error) {
		// Ignore the error.
		}
}


function sudoker_start() {
	// Create the grid.
	grid = new Array(9);
	for (var row = 0; row < 9; ++row) {
		grid[row] = new Array(9);
		}
	tds = document.getElementsByTagName("td");
	var boxRow = 0;
	var boxCol = 0;
	var cellRow = 0;
	var cellCol = 0;
	for (var i = 0; i < tds.length; ++i) {
		td = tds[i];
		tdClass = td.getAttribute("class");
		if (tdClass == "cell") {
			// Set up the cell.
			var row = boxRow * 3 + cellRow;
			var col = boxCol * 3 + cellCol;
			grid[row][col] = td;
			td.setAttribute("row", row);
			td.setAttribute("col", col);
			td.onclick = cell_click;

			// Advance to the next cell.
			cellCol += 1;
			if (cellCol >= 3) {
				cellCol = 0;
				cellRow += 1;
				if (cellRow >= 3) {
					cellRow = 0;
					boxCol += 1;
					if (boxCol >= 3) {
						boxCol = 0;
						boxRow += 1;
						}
					}
				}
			}
		}

	var bodies = document.getElementsByTagName("body");
	if (bodies && bodies.length > 0) {
		var overrideSrc = bodies.item(0).getAttribute("puzzle-src");
		if (overrideSrc && overrideSrc.length > 0)
			puzzleSrc = overrideSrc;
		var overrideRequestCrossSite = bodies.item(0).getAttribute("request-cross-site");
		if (overrideRequestCrossSite && overrideRequestCrossSite.length > 0)
			requestCrossSite = overrideRequestCrossSite;
		statsUrl = bodies.item(0).getAttribute("stats-url");
		}

	// Magic to make Netscape 4 work (as if we really care).
	if (document.layers)
		document.captureEvents(Event.KEYPRESS);

	document.onkeypress = handle_key;
	tick();

	get_puzzle();
}


