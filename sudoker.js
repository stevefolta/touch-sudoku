var puzzleSrc = "http://somefancy.com/steve/puzzles/current";
var requestCrossSite = true;


var grid = null;
var selectedCell = null;
var selectedRow = 0;
var selectedCol = 0;
var selectedUsedKey = false;
var cellsLeft = 0;


function handle_key(event) {
	if (!event)
		event = window.event;

	var handled = false;

	if (event.ctrlKey || event.altKey || event.metaKey)
		return;

	var key = event.keyCode;
	switch (key) {
		case 74: 	// 'J'
			selectedRow = (selectedRow + 1) % 9;
			selected_cell_changed();
			handled = true;
			break;
		case 75: 	// 'K'
			selectedRow -= 1;
			if (selectedRow < 0)
				selectedRow = 8;
			selected_cell_changed();
			handled = true;
			break;
		case 72: 	// 'H'
			selectedCol -= 1;
			if (selectedCol < 0)
				selectedCol = 8;
			selected_cell_changed();
			handled = true;
			break;
		case 76: 	// 'L'
			selectedCol = (selectedCol + 1) % 9;
			selected_cell_changed();
			handled = true;
			break;
		case 48:  case 49:  case 50:  case 51:  case 52:
		case 53:  case 54:  case 55:  case 56:  case 57:
			digit_pressed(key - 48);
			handled = true;
			break;
		case 8: 	// Backspace
			if (!selectedCell.getAttribute("given"))
				selectedCell.textContent = "";
			handled = true;
			break;
		case 13:  	// Enter
		case 191: 	// '?' (Really!)
			check_puzzle();
			selectedUsedKey = false;
			handled = true;
			break;
		case 82: 	// 'R'
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

	var str = (digit + 48).toString(16);
	if (str.length == 1)
		str = "0" + str;
	str = unescape("%" + str);
	if (!selectedUsedKey) {
		selectedCell.textContent = str;
		selectedUsedKey = true;
		}
	else
		selectedCell.textContent += str;

	check_pencil();
}


function check_pencil() {
	if (selectedCell.textContent.length > 1)
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

	// Clear existing errors.
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col)
			grid[row][col].removeAttribute("error");
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
			for (var row = 0; row < 9; ++row)
				markErrorCell(row, col);
			}
		}

	// How many cells left?
	cellsLeft = 0;
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			var digit = digitAt(row, col);
			if (digit < 0)
				cellsLeft += 1;
			}
		}
	if (cellsLeft == 0)
		won();
}


function digitAt(row, col) {
	var entry = grid[row][col].textContent;
	if (entry.length != 1)
		return -1;
	return parseInt(entry) - 1;
}

function markErrorCell(row, col) {
	var cell = grid[row][col];
	cell.setAttribute("error", "true");
}


function won() {
	var winRow = "WINWINWIN";
	for (var row = 0; row < 9; ++row) {
		for (var col = 0; col < 9; ++col) {
			grid[row][col].textContent = winRow.charAt(col);
			}
		}
}


function load_puzzle(puzzle) {
	// Fill in the grid with the puzzle.
	row = 0;
	col = 0;
	for (ci = 0; ci < puzzle.length; ++ci) {
		c = puzzle.charAt(ci);
		if (c == "\n") {
			row += 1;
			col = 0;
			continue;
			}
		if (c != " " && c != ".") {
			grid[row][col].textContent = c;
			grid[row][col].setAttribute("given", "true");
			}
		col += 1;
		}

	// Initial selected cell.
	selectedRow = 0;
	selectedCol = 0;
	selected_cell_changed();
}


function get_puzzle()
{
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
					load_puzzle(request.responseText);
					}
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
			}
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
			var row = boxRow * 3 + cellRow;
			var col = boxCol * 3 + cellCol;
			grid[row][col] = td;
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

	document.onkeydown = handle_key;

	get_puzzle();
}


