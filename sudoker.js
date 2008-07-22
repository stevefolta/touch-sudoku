var puzzle =
	"1 82     \n  6     7\n   1 6 3 \n 4  5   9\n 7 4 8 2 \n6   3  7 \n 5 8 1   \n2     8  \n     95 2";
puzzle =
	"  1    42\n4  7     \n2 5 9    \n   6    9\n 7 489 1 \n6    2   \n    3 8 5\n     8  1\n18    6  ";

var grid = null;
var selectedCell = null;
var selectedRow = 0;
var selectedCol = 0;
var selectedUsedKey = false;


function handle_key(event) {
	if (!event)
		event = window.event;

	var handled = false;

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
	selectedCell.removeAttribute("selected");
	selectedCell = grid[selectedRow][selectedCol];
	selectedCell.setAttribute("selected", "true");
	selectedUsedKey = false;
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
		if (tdClass == "cell") {
			var row = boxRow * 3 + cellRow;
			var col = boxCol * 3 + cellCol;
			grid[row][col] = td;
			if (td.getAttribute("selected")) {
				selectedRow = row;
				selectedCol = col;
				selectedCell = td;
				}
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
		if (c != " ") {
			grid[row][col].textContent = c;
			grid[row][col].setAttribute("given", "true");
			}
		col += 1;
		}

	document.onkeydown = handle_key;
}


