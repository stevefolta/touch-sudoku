var puzzleSrc = "http://somefancy.com/touch-sudoku/puzzles/current.cgi";
var requestCrossSite = false;
var statsUrl = null;
var testPuzzle = '';


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
var preSpeculationGrid = "";
var speculationStartRow = 0;
var speculationStartCol = 0;
var digits = null;
var hilitedDigit = 0;
let whichTheme = 0;

const themes = [ "regular", "light" ];


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
				selectedCell.removeAttribute("hilited_digit");
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
		case "s":
			if (is_speculating())
				abort_speculation();
			else
				start_speculation();
			handled = true;
			break;
		case "!":	case "@":	case "#":	case "$":	case "%":
		case "^":	case "&":	case "*":	case "(":	case ")":
			if (!winTime)
				hilite_digit(")!@#$%^&*(".indexOf(key));
			handled = true;
			break;
		case "t":
			change_theme();
			handled = true;
			break;
		case "a":
			auto_fill();
			handled = true;
			break;
		}

	if (handled) {
		event.preventDefault();
		event.stopPropagation();
		}
}

function handle_key_down(event) {
	// To work around a bug in Chrome -- and now Firefox, as of 2019.2 -- where
	// the backspace key doesn't work.

	if (!event)
		event = window.event;

	if (event.ctrlKey || event.altKey || event.metaKey)
		return;

	var key = event.keyCode;
	if (key == 0)
		key = event.which;
	key = String.fromCharCode(key);
	if (key == "\b")
		handle_key(event);
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
	update_digits();
	update_hilited_digits();
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
	if (pencilled) {
		selectedCell.setAttribute("pencil", "true");
		if (contents.length > 3)
			selectedCell.setAttribute("many", "true");
		}
	else {
		selectedCell.removeAttribute("pencil");
		selectedCell.removeAttribute("many");
		}
}


function update_digits() {
	if (digits == null)
		return;

	var i = 0;
	for (i = 0; i < 9; ++i)
		digits[i].removeAttribute("active");

	var contents = selectedCell.textContent;
	for (i = 0; i < contents.length; ++i) {
		var digit = parseInt(contents.charAt(i));
		if (digit >= 1 && digit <= 9)
			digits[digit - 1].setAttribute("active", "true");
		}
	}


function selected_cell_changed() {
	if (selectedCell)
		selectedCell.removeAttribute("selected");
	selectedCell = grid[selectedRow][selectedCol];
	selectedCell.setAttribute("selected", "true");
	selectedUsedKey = false;
	update_digits();
}


function hilite_digit(digit) {
	// Allow toggling.
	if (digit == hilitedDigit)
		digit = 0;
	hilitedDigit = digit;
	update_hilited_digits()
	}


function update_hilited_digits() {
	digitString = hilitedDigit.toString();
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			var cell = grid[row][col];
			var entry = cell.textContent;
			if (entry.indexOf(digitString) >= 0)
				cell.setAttribute("hilited_digit", "true");
			else
				cell.removeAttribute("hilited_digit");
			}
		}
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
				if (answer && answer.length == 1 && cell.textContent != answer) {
					cell.setAttribute("wrong", "true");
					hadMistake = true;
					}
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
	terminate_speculation();

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
			}
		}
}


function is_speculating()
{
	return (preSpeculationGrid ? true : false);
}

function start_speculation()
{
	preSpeculationGrid = puzzle_string();
	speculationStartRow = selectedRow;
	speculationStartCol = selectedCol;
	grid[speculationStartRow][speculationStartCol].setAttribute("speculationStart", "true");
	document.getElementById("speculation").removeAttribute("hidden");
}

function terminate_speculation()
{
	grid[speculationStartRow][speculationStartCol].removeAttribute("speculationStart");
	document.getElementById("speculation").setAttribute("hidden", "true");
	preSpeculationGrid = "";
}

function abort_speculation()
{
	clear_puzzle_answers_too(false);
	install_puzzle(preSpeculationGrid);
	terminate_speculation();
}


function auto_fill() {
	for (let row = 0; row < 9; ++row) {
		for (let col = 0; col < 9; ++col) {
			let entry = grid[row][col].textContent;
			if (entry.length == 1)
				continue;
			let possibilities = (1 << 10) - 1;

			// Check this box.
			let boxRow = Math.floor(row / 3);
			let boxCol = Math.floor(col / 3);
			for (let cellRow = 0; cellRow < 3; ++cellRow) {
				for (let cellCol = 0; cellCol < 3; ++cellCol) {
					let globalRow = boxRow * 3 + cellRow;
					let globalCol = boxCol * 3 + cellCol;
					if (globalRow == row && globalCol == col)
						continue;
					let digit = digitAt(globalRow, globalCol);
					if (digit >= 0)
						possibilities &= ~(1 << digit);
					}
				}

			// Check the row.
			for (let cellCol = 0; cellCol < 9; ++cellCol) {
				if (cellCol == col)
					continue;
				let digit = digitAt(row, cellCol);
				if (digit >= 0)
					possibilities &= ~(1 << digit);
				}
			// Check the column.
			for (let cellRow = 0; cellRow < 9; ++cellRow) {
				if (cellRow == row)
					continue;
				let digit = digitAt(cellRow, col);
				if (digit >= 0)
					possibilities &= ~(1 << digit);
				}

			// Update the cell.
			let ok = true;
			if (entry.length > 1) {
				// Remove non-possibilities.
				let curPencils = 0;
				for (c of entry) {
					if (c < "1" && c > "9") {
						ok = false;
						break;
						}
					curPencils |= 1 << parseInt(c) - 1;
					}
				possibilities &= curPencils;
				}
			else {
				// Empty cell, use all the possibilities.
				}
			let newCell = "";
			for (let digit = 0; digit < 9; ++digit) {
				if ((possibilities & (1 << digit)) != 0)
					newCell += String.fromCharCode(digit + 1 + 48);
				}
			grid[row][col].textContent = newCell;
			if (newCell.length > 1) {
				grid[row][col].setAttribute("pencil", "true");
				if (newCell.length > 3)
					grid[row][col].setAttribute("many", "true");
				else
					grid[row][col].removeAttribute("many");
				}
			else {
				grid[row][col].removeAttribute("pencil");
				grid[row][col].removeAttribute("many");
				}
			}
		}
	}


function change_theme() {
	let gridTable = document.getElementsByClassName("grid")[0];
	whichTheme += 1;
	if (whichTheme >= themes.length)
		whichTheme = 0;
	gridTable.setAttribute("theme", themes[whichTheme]);
	localStorage.setItem("sudoku-theme", themes[whichTheme]);
	}


function install_puzzle(puzzle) {
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
			else if (c == "(") {
				var numChars = 0;
				grid[row][col].textContent = "";
				while (true) {
					c = puzzle.charAt(++ci);
					if (c == ")" || c == "")
						break;
					grid[row][col].textContent += c;
					numChars += 1;
					}
				grid[row][col].removeAttribute("given");
				if (numChars > 1) {
					grid[row][col].setAttribute("pencil", "true");
					if (numChars > 3)
						grid[row][col].setAttribute("many", "true");
					}
				else {
					grid[row][col].removeAttribute("pencil");
					grid[row][col].removeAttribute("many");
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
		else if (headerName == "Date") {
			var date_element = document.getElementById('puzzle-date');
			if (date_element) {
				// Convert from "2016-06-10" to "2016.6.10".
				var date_parts = read_rest_of_line().split('-');
				var date = '';
				if (date_parts.length == 3) {
					date = date_parts[0] + '.';
					var part = date_parts[1];
					if (part[0] == '0')
						part = part.substr(1);
					date += part + '.';
					part = date_parts[2];
					if (part[0] == '0')
						part = part.substr(1);
					date += part;
					}
				else
					date = date_parts.join('-');
				date_element.textContent = date;
				}
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
		else if (c == "." || (c >= "1" && c <= "9") || c == "(") {
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
}


function load_puzzle(puzzle)
{
	install_puzzle(puzzle);

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

	if (testPuzzle.length > 0) {
		load_puzzle(testPuzzle);
		return;
		}

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

function clear_puzzle_answers_too(answers_too)
{
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			grid[row][col].textContent = "";
			grid[row][col].removeAttribute("given");
			grid[row][col].removeAttribute("error");
			grid[row][col].removeAttribute("pencil");
			grid[row][col].removeAttribute("many");
			if (answers_too)
				grid[row][col].removeAttribute("answer");
			}
		}
	hilitedDigit = 0;
	update_hilited_digits();
}

function clear_puzzle()
{
	clear_puzzle_answers_too(true);
}


function puzzle_string()
{
	var result = "";
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			var cell = grid[row][col];
			var cellContent = cell.textContent;
			if (cellContent == "") {
				result += ".";
				continue;
				}
			if (!cell.getAttribute("given"))
				result += "(";
			result += cellContent;
			if (!cell.getAttribute("given"))
				result += ")";
			}
		}
	return result;
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


function digit_click() {
	if (winTime)
		return;
	if (selectedCell.getAttribute("given"))
		return;

	digit = this.getAttribute("whichDigit");
	if (this.getAttribute("active")) {
		// Remove the digit.
		var str = selectedCell.textContent;
		var index = str.indexOf(digit);
		if (index >= 0)
			selectedCell.textContent = str.slice(0, index) + str.slice(index + 1);
		this.removeAttribute("active");
		}
	else {
		// Add the digit, sorted.
		var str = selectedCell.textContent;
		var i = 0;
		var addedDigit = false;
		for (i = 0; i < str.length; ++i) {
			if (str.charAt(i) > digit) {
				str = str.slice(0, i) + digit + str.slice(i);
				addedDigit = true;
				break;
				}
			}
		if (!addedDigit)
			str += digit;
		selectedCell.textContent = str;
		this.setAttribute("active", "true");
		}

	selectedCell.removeAttribute("wrong");
	check_pencil();
	}


function got_stats(json) {
	try {
		var result = JSON.parse(json);
		if (result.levelAverageTime) {
			document.getElementById("avg-time").textContent =
				elapsedTimeToString(result.levelAverageTime);
			document.getElementById("avg-time-row").removeAttribute("hidden");
			}
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
	var nextDigit = 1;
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
		else if (tdClass == "digit") {
			// Set up the digit.
			td.setAttribute("whichDigit", nextDigit);
			td.onclick = digit_click;

			if (digits == null)
				digits = [];
			digits[nextDigit - 1] = td;

			nextDigit += 1;
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
	document.onkeydown = handle_key_down;
	tick();

	// Restore the user's last theme.
	let lastTheme = localStorage.getItem("sudoku-theme");
	if (lastTheme) {
		let index = themes.indexOf(lastTheme);
		if (index >= 0) {
			whichTheme = index;
			let gridTable = document.getElementsByClassName("grid")[0];
			gridTable.setAttribute("theme", themes[whichTheme]);
			}
		}

	get_puzzle();
}


