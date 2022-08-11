window.onload = function statup() {
	// Enable to clear the storage.
	// chrome.storage.sync.clear();
	// chrome.storage.local.clear();
	// localStorage.clear()
	// Create the navigation.
	new Navigation();
}

// ---------------------------- General functions ----------------------------


// Inserts code into the current site.
function insert( todo, code, position, mode, filename )
// todo shoud be > changeHTML, changeCSS or changeJS {
	chrome.tabs.query({active:true, currentWindow:true}, function( tabs ) {
		chrome.tabs.sendMessage( tabs[0].id, {todo: todo, code: code, position:position, mode:mode, filename:filename});
	});
}

// shows msg on the screen
function showMessage( msg ) {
	let messageText = document.getElementById( "message-text" );
	messageText.textContent = msg;
	messageText.style.opacity = 1;
	window.setTimeout(
		function() {
			messageText.style.opacity = 0;
		}, 1000 );
}

// Returns the filetype of the specified filename in the "FILEEXTENSION" format.
function filenameToKind( filename ) {
	return ( filename.substring( filename.lastIndexOf( "." ) + 1, filename.length ) ).toUpperCase();
}

// Converts name of the language based on the file extension.
function kind_to_language( kind ) {
	if ( kind === "JS" ) {
		return "JavaScript";
	}
	else {
		return kind;
	}
}

// Get string lenght of a javascript object.
function getFileSize( file_object ) {
	let stringification = JSON.stringify( file_object );
	return stringification.length;
}

// Function that checks if communication between the the front and backend code is possible.
// It will run the onFail function if communication is not possible.
// This function will be running recursively until communication is possible.
function communication_test( onFail, onSuccess, retryTimeMiliSeconds = 500 ) {
	chrome.tabs.query({active:true, currentWindow:true}, function( tabs ) {
		chrome.tabs.sendMessage( tabs[0].id, {todo:"comTest"}, function( response ) {
			// The extension is opened on a page that it can't manipulate.
			if ( chrome.runtime.lastError ) {
				if ( chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist." ) {
					onFail();
					setTimeout( function() {communication_test( onFail, onSuccess, retryTimeMiliSeconds )}, retryTimeMiliSeconds );
				}
				else {
					onSuccess();
				}
			}
			else {
				onSuccess();
			}

		});
	});
}

// ------------------------------------------------------------------------

// Class responsible for controlling the editor.
class Editor {
	constructor( navigator ) {
		// Array that contains [filename, editor session object] combinations.
		this.files                  = [];
		this.maxOpenFiles           = 6;
		this.activeFile             = "none";
		this.previousFile           = "none";
		this.navigator              = navigator;
		this.maxSyncedFilesizeChars = 8000;

		this.editor                 = ace.edit( "editor" );
		this.editor.getSession().setMode( "ace/mode/javascript" );
		this.editor.setTheme( "ace/theme/terminal" );
		this.EditSession                 = require( "ace/edit_session" ).EditSession;
		this.editorElement               = document.getElementById( "editor" );
		this.editorElement.style.display = "none";
	}

	// Opens a new editor window if the file doesn't exist yet.
	// and opens the file if it aleady exists.
	// checks to ensure there aren't more than 6 items already opened
	openFile( filename, text ) {
		let allOpenFilenames = [];
		for ( let element of this.files )
		{
			allOpenFilenames.push( element[0] );
		}
		// check if the file isn't already open.
		if ( allOpenFilenames.includes( filename ) )
		{
			this.activateFileByName( filename );
		}
		else
		{
			// Check if the maximum amount of open files (6) isn't already reached.
			if ( this.files.length < this.maxOpenFiles )
			{
				this.createWindow( filename, text );
				this.createFileButton( filename );
				this.activateFileByName( filename );
			}
			else
			{
				alert( "Close some files first." );
			}
		}
	}

	// Opens the editor window of the file with the specified filename.
	activateFileByName( filename ) {
		this.activeFile = filename;
		for ( let element of this.files )
		{
			if ( element[0] === filename )
			{
				let index                           = this.navigator.getNavItemIndexByFilename( filename );
				this.navigator.navItems[index].open = true;
				this.editor.setSession( element[1] );
				this.editorElement.style.display = "block";
				// Focus on the textarea after opening a file.
				document.getElementsByClassName( "ace_text-input" )[0].focus();
				break;
			}
		}
		// Make the button that corresponds with the current file active.
		// essentialy this will make the tab a bit brighter
		this.makeButtonActive( filename );
	}

	// Make the active window button look darker to make it the obvious open file.
	makeButtonActive( filename ) {
		// input.file-title-button is the "tab"
		let allHtmlElements      = document.getElementsByClassName( "file-title-button" );
		// a.close-button is the 'x' that we click on to close that tab & rid ourselves of that particular code editor
		let allCloseHtmlElements = document.getElementsByClassName( "close-button" );

		// traverse the list of open 'files', highlight the one that we are currently editing and reduce the opacity of the button(tab) of the files we are not editing
		Array.from( allHtmlElements ).forEach( function( element )
		{
			// Highlight the right button.
			// The 'file' name AND type is injected into the button's value attribute
			if ( element.value === filename )
			{
				element.style.opacity = 1;
				allCloseHtmlElements[Array.from( allHtmlElements ).indexOf( element )].style.opacity = 1;
			}
			// Make the other htmlElements greyed out.
			else
			{
				element.style.opacity = 0.5;
				allCloseHtmlElements[Array.from( allHtmlElements ).indexOf( element )].style.opacity = 0.5;
			}
		});
		// Resize all open file htmlElements to fit the window.
		this.resizeOpenFileHtmlElements();
	}

	// Changes the width of the open file buttons to fit the extension window.
	resizeOpenFileHtmlElements() {
		let allHtmlElements = document.getElementsByClassName( "file-title-button" );
		let editorWidthStr  = this.editorElement.style["min-width"];
		let buttonWidth     = Math.round( ( parseInt( editorWidthStr.substring( 0, editorWidthStr.length - 2 ) ) - 20 ) / allHtmlElements.length );
		// Also take the with of the close htmlElements into a count.
		buttonWidth = buttonWidth - ( 3 * allHtmlElements.length );
		Array.from( allHtmlElements ).forEach( function( element ) {
			element.style.width = buttonWidth + "px";
		});
	}

	// Hides the editor and the open files.
	hide() {
		// Hide the editor element.
		this.editorElement.style.display = "none";
		// Hide all open files.
		// This basically closes all the files without saving.
		// So after reopening the extension, the files will be open again.
		let allOpenFiles = document.getElementsByClassName( "open-files-list-item" );
		// close all the files.
		Array.from( this.navigator.navItems ).forEach( function( element ) {
			element.open = false;
		});
		//Delete the file htmlElements.
		Array.from( allOpenFiles ).forEach( function( element ) {
			element.parentNode.removeChild( element );
		});
		// Clear the files list.
		this.files = [];
	}

	// Closes the editor of the file with the specified filename.
	closeFile( filename ) {
		let allOpenFiles = document.getElementsByClassName( "open-files-list-item" );
		// Set the file to being closed
		let index        = this.navigator.getNavItemIndexByFilename( filename );
		this.navigator.navItems[index].open = false;

		this.saveFileByName( filename );
		// Delete the file button.
		for ( const element of Array.from( allOpenFiles ) ) {
			if ( element.childNodes[0].value === filename ) {
				element.parentNode.removeChild( element );
				break;
			}
		}

		// Remove the file from this.files.
		for ( let i = 0; i < this.files.length; i++ ) {
			if ( this.files[i][0] === filename ) {
				this.files.splice( i, 1 );
				break;
			}
		}
		// If you close the last open file, the editmenu will go away and be replaced with the main menu.
		if ( 0 === this.files.length ) {
			this.editorElement.style.display = "none";
			this.navigator.disableAllMenus();
			this.navigator.enableMenuOfKind( "MAIN" );
		} else {
			let file_to_be_saved_after_closing = this.files[0][0];
			// Open the currently open file if the closed file is not the open file.
			if ( this.activeFile != filename ) {
				file_to_be_saved_after_closing = this.activeFile;
			}
			// Open an other file thats open.
			this.activateFileByName( file_to_be_saved_after_closing );
			this.navigator.disableAllMenus();
			this.navigator.enableMenuOfKind( "EDITOR" );
			this.saveCurrentFile();
		}
	}

	// Creates a file button for a file with the specified name.
	createFileButton( filename ) {
		let ul                = document.getElementById( "open-files-list" );
		let li                = document.createElement( "li" );
		let fileButton        = document.createElement( "input" );
		let closeButton       = document.createElement( "a" );
		li.className          = "open-files-list-item";
		closeButton.innerText = "x";
		closeButton.className = "close-button"
		closeButton.onclick   = function() {
			this.closeFile( filename );
		}.bind( this );
		fileButton.type      = "submit";
		fileButton.className = "file-title-button";
		fileButton.value     = filename;
		fileButton.onclick   = function() {
			// First save the old file.
			this.saveCurrentFile();
			this.activateFileByName( filename );
			this.navigator.enableMenuOfKind( "EDITOR" );
			// Save the new file.
			this.saveCurrentFile();
		}.bind( this);
		li.appendChild( fileButton );
		li.appendChild( closeButton );
		ul.appendChild( li );
		this.makeButtonActive( filename );
		return li;
	}

	// Creates an editor window for the file with the specified name and text.
	createWindow( filename, text) {
		let newSession = new this.EditSession( text );

		// Disable the info text on the left of the editor if it is an HTML file.
		if ( 'HTML' === filenameToKind( filename ) ) {
			newSession.setUseWorker( false );
		}
		// Set the editor to the correct language.
		if ( filename.endsWith( ".js" ) ) {
			newSession.setMode( "ace/mode/javascript" );
		} else if ( filename.endsWith( ".css" ) ) {
			newSession.setMode( "ace/mode/css" );
		}
		else if ( filename.endsWith( ".html" ) ) {
			newSession.setMode( "ace/mode/html" );
		}

		// Bind the saveCurrentFile function to changes in the editor.
		newSession.on( 'change', function( delta ) {
			this.saveCurrentFile();
			if ( 'EDITOR' !== this.navigator.current_menu ) {
				this.navigator.enableMenuOfKind( 'EDITOR' );
			}
		}.bind( this ) );
		this.files.push( [filename, newSession] );
	}

	// Returns the text of the current edit menu.
	getCurrentText() {
		let currentText = this.editor.session.getValue();
		return currentText;
	}

	// Returns the the filetype in "FILEEXTENSION" format.
	// "JS" for javascript.
	// "CSS" for Cascading Style Sheets.
	// "HTML" for HyperText Markup Language.
	getCurrentFiletype() {
		if ( this.activeFile.endsWith( ".js" ) ) {
			return "JS";
		} else if ( this.activeFile.endsWith( ".css" ) ) {
			return "CSS";
		} else if ( this.activeFile.endsWith( ".html" ) ) {
			return "HTML";
		}
	}

	// Deletes the currently active file from storage.
	deleteCurrentFile() {
		let filename = this.activeFile;
		this.closeFile( filename );
		chrome.storage.sync.remove( filename, function() {} );
		chrome.storage.local.remove( filename, function() {} );
	}

	// Change the filename of the currently active file.
	changeCurrentFileName( newFilename ) {
		let oldFilename = this.activeFile;
		// Change the filename in the editor.
		for ( const [i, file] of this.files.entries() )
		{
			if ( file[0] === oldFilename)
			{
				this.files[i][0] = newFilename;
				this.activeFile = newFilename;
				break;
			}
		}
		// Change the filename in the navigator.
		for ( let i = 0; i<this.navigator.navItems.length; i++)
		{
			if ( this.navigator.navItems[i].filename === oldFilename)
			{
				this.navigator.navItems[i].filename = newFilename;
				break;
			}
		}

		let allHtmlElements = document.getElementsByClassName( "file-title-button" );

		// Put the new filebutton in the position of the old one and remove the old one.
		for ( const element of Array.from( allHtmlElements) )
		{
			if ( element.value === oldFilename )
			{
				// Create new filebutton.
				let newFileButton = this.createFileButton( newFilename );
				element.parentNode.parentNode.insertBefore( newFileButton, element.parentNode );
				element.parentNode.parentNode.removeChild( element.parentNode );
				break;
			}
		}

		// Save the file in storage with a new name.
		this.saveFileByName( newFilename );
		// Remove the old file from storage.
		chrome.storage.sync.remove( oldFilename, function() {});
		chrome.storage.local.remove( oldFilename, function() {});

		this.resizeOpenFileHtmlElements();
	}

	// Save a file to storage using its name.
	saveFileByName( filename ) {
		let allNewData      = {};
		let currentFileData = {};
		currentFileData.filename = filename;

		for ( let element of this.files ) {
			if ( element[0] === filename ) {
				let currentText = element[1].getValue();
				currentFileData.text = currentText;
				break;
			}
		}
		let index = this.navigator.getNavItemIndexByFilename( filename );

		currentFileData.activeWebsites = this.navigator.navItems[index].activeWebsites;
		currentFileData.position       = this.navigator.navItems[index].position;
		currentFileData.mode           = this.navigator.navItems[index].mode;
		currentFileData.active         = this.navigator.navItems[index].active;
		currentFileData.reloadOnremove = ( this.navigator.navItems[index].reloadOnremove === undefined ) ? false : this.navigator.navItems[index].reloadOnremove;
		currentFileData.open           = this.navigator.navItems[index].open;
		currentFileData.last           = ( this.activeFile === filename );

		allNewData[filename] = currentFileData;

		// Update the synced storage if the file size is small enough.
		// Update the local storage otherwise.
		if ( getFileSize( allNewData ) >= this.maxSyncedFilesizeChars )
		{
			chrome.storage.sync.remove( filename, function() {});
			chrome.storage.local.set( allNewData, function() {
				showMessage( "Saved!" );
			});
		}
		else
		{
			chrome.storage.local.remove( filename, function() {});
			chrome.storage.sync.set( allNewData, function() {
				showMessage( "Saved!" );
			});
		}
	}

	// Saves the current file and it's properties to storage.
	saveCurrentFile() {
		let currentFileName = this.activeFile;
		let currentText     = this.getCurrentText();
		let checked         = this.navigator.activeCheckbox.checked;
		let reloadOnremove  = this.navigator.reloadOnremoveCheckbox.checked;
		let activeWebsites  = this.navigator.enabled_sitesText_area.value;
		let position        = this.navigator.position_selection.options[this.navigator.position_selection.selectedIndex].value;
		let mode            = this.navigator.mode_selection.options[this.navigator.mode_selection.selectedIndex].value;
		let allNewData      = {};

		let currentFileData            = {};
		currentFileData.filename       = currentFileName;
		currentFileData.text           = currentText;
		currentFileData.activeWebsites = activeWebsites;
		currentFileData.position       = position;
		currentFileData.mode           = mode;
		currentFileData.active         = checked;
		currentFileData.reloadOnremove = ( reloadOnremove === undefined ) ? false : reloadOnremove;

		// Checks if the file was open or not.
		let index = this.navigator.getNavItemIndexByFilename( currentFileName );

		currentFileData.open = this.navigator.navItems[index].open;
		currentFileData.last = true;

		allNewData[currentFileName] = currentFileData;

		// Update the synced storage if the file size is small enough.
		// 6000 characters should cover it, but you can change it in the constructor.
		// Update the local storage otherwise.
		if ( getFileSize( allNewData ) >= this.maxSyncedFilesizeChars ) {
			chrome.storage.sync.remove( currentFileName, function() {});
			chrome.storage.local.set( allNewData, function() {
				showMessage( "Saved!" );
			});
		}
		else {
			chrome.storage.local.remove( currentFileName, function() {});
			chrome.storage.sync.set( allNewData, function() {
				showMessage( "Saved!" );
			});
		}

		// Update '.last' when you switch files.
		if ( this.previousFile != this.activeFile ) {
			this.previousFile = this.activeFile;
			this.updateLastOpenFile();
		}
	}

	// Whenever a different file is selected, the newly selected file should become the 'open' file.
	// This method set the new file to the last opened file so that this file will be opened at restart.
	updateLastOpenFile() {
		// Save all open files because '.last' can only be true on one, so the rest needs to be set to false.
		for ( let element of this.files )
		{
			this.saveFileByName( element[0] );
		}
	}
}
