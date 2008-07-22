var puzzle =
	"1 82     \n  6     7\n   1 6 3 \n 4  5   9\n 7 4 8 2 \n6   3  7 \n 5 8 1   \n2     8  \n     95 2";

var selectedCell = null;
var grid = null;
var selectedRow = 0;
var selectedCol = 0;


function handle_key(event) {
	if (!event)
		event = window.event;

	var handled = false;

	var key = event.keyCode;
	if (key == 88) { 	// 'X'
		alert("X key.");
		handled = true;
		}

	else if (key == 74) { 	// 'J'
		selectedRow = (selectedRow + 1) % 9;
		selected_cell_changed();
		handled = true;
		}
	else if (key == 75) { 	// 'K'
		selectedRow -= 1;
		if (selectedRow < 0)
			selectedRow = 8;
		selected_cell_changed();
		handled = true;
		}
	else if (key == 72) { 	// 'H'
		selectedCol -= 1;
		if (selectedCol < 0)
			selectedCol = 8;
		selected_cell_changed();
		handled = true;
		}
	else if (key == 76) { 	// 'L'
		selectedCol = (selectedCol + 1) % 9;
		selected_cell_changed();
		handled = true;
		}

	if (handled) {
		event.preventDefault();
		event.stopPropagation();
		}
}


function selected_cell_changed() {
	selectedCell.setAttribute("class", "cell");
	selectedCell = grid[selectedRow][selectedCol];
	selectedCell.setAttribute("class", "selected-cell");
}


function sudoker_start() {

	// Create the grid.
	grid = new Array(9);
	for (row = 0; row < 9; ++row) {
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
		if (tdClass == "cell" || tdClass == "selected-cell") {
			var row = boxRow * 3 + cellRow;
			var col = boxCol * 3 + cellCol;
			if (tdClass == "selected-cell") {
				selectedCell = td;
				selectedRow = row;
				selectedCol = col;
				}
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
		if (c != " ")
			grid[row][col].textContent = c;
		col += 1;
		}

	document.onkeydown = handle_key;
}


