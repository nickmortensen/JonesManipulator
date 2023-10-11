/**
 * NOTE: IF THIS FILE DOES NOT WORK - REVERT BACK TO popup_05022023.js
 */
window.onload = function startup() {
	// Enable to clear the storage.
	// chrome.storage.sync.clear();
	// chrome.storage.local.clear();
	// localStorage.clear()
	// Create the navigation.
	new Navigation();
}

// ---------------------------- last update 202.-01-03 General functions ----------------------------


// Inserts code into the current site.
function insert( todo, code, position, mode, filename ) {
	// todo should be > changeHTML, changeCSS or changeJS
	chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
		chrome.tabs.sendMessage( tabs[0].id, { todo: todo, code: code, position: position, mode: mode, filename: filename } );
	} );
}

// shows msg on the screen
function showMessage( msg ) {
	let messageText           = document.getElementById( 'message-text' );
	messageText.textContent   = msg;
	messageText.style.opacity = 1;
	window.setTimeout( () => { messageText.style.opacity = 0, 1000 } );
}

// Returns the filetype of the specified filename in the 'FILEEXTENSION' format.
function filenameToKind( filename ) {
	return ( filename.substring( filename.lastIndexOf( '.' ) + 1, filename.length ) ).toUpperCase();
}

// Converts name of the language based on the file extension.
function kindToLanguage( kind ) {
	let rtn = kind === 'JS' ? 'JavaScript' : kind;
	return rtn;
}

// Get string length of a javascript object.
function getFileSize( fileObject ) {
	let stringification = JSON.stringify( fileObject );
	return stringification.length;
}

/**
 * Function that checks if communication between the the front and backend code is possible.
 * It will run the onFail function if communication is not possible.
 * This function will be running recursively until communication is possible.
 *
 * @param {function} onFail
 * @param {function} onSuccess
 * @param {integer} retryTimeMiliSeconds  -- How long we wait in millseconds to try the function again after fail
 */
function communicationTest( onFail, onSuccess, retryTimeMiliSeconds = 500 ) {
	chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
		chrome.tabs.sendMessage( tabs[0].id, { todo:'comTest'}, response => {
			// The extension is opened on a page that it can't manipulate.
			if ( chrome.runtime.lastError ) {
				if ( chrome.runtime.lastError.message === 'Could not establish connection. Receiving end does not exist.' ) {
					onFail();
					setTimeout( () => communicationTest( onFail, onSuccess, retryTimeMiliSeconds ), retryTimeMiliSeconds );
				}
				else {
					onSuccess();
				}
			}
			else {
				onSuccess();
			}
		} );
	} );
}

/** ***************************************************************
 * ******* Class responsible for controlling the editor. ******
 */

const allMenuTypes = [ 'MAIN', 'JS', 'CSS', 'HTML', 'EDITOR', 'NEW', 'ERROR' ]
// Array that contains [filename, editor session object] combinations.
let files                  = [];
let maxOpenFiles           = 6;
let activeFile             = 'none';
let previousFile           = 'none';
let navigator               = navigator;
let maxSyncedFilesizeChars  = 8000;
const editorElement         = document.getElementById( 'editor' );
editorElement.style.display = 'none';
let allOpenFilenames = [];

/**
 * Opens  a new editor if there is no file with the name yet
 */
function openFile( filename, text ) {
	let allOpenFilenames = [];
	for ( let element of files ) {
		allOpenFilenames.push( element[0] );
	}
	// check if the file isn't already open.
	if ( allOpenFilenames.includes( filename ) ) {
		this.activateFileByName( filename );
	}
	else {
		// Check if the maximum amount of open files ( 6 ) isn't already reached.
		if ( this.files.length < this.maxOpenFiles ) {
			this.createWindow( filename, text );
			this.createFileButton( filename );
			this.activateFileByName( filename );
		}
		else {
			alert( 'Close some files first.' );
		}
	}
}

class Editor {
	constructor( navigator ) {
		// Array that contains [filename, editor session object] combinations.
		this.files                  = [];
		this.maxOpenFiles           = 6;
		this.activeFile             = 'none';
		this.previousFile           = 'none';
		this.navigator              = navigator;
		this.maxSyncedFilesizeChars = 8000;

		// this.editor                 = ace.edit( 'editor' );
		// this.editor.getSession().setMode( 'ace/mode/javascript' );
		// this.editor.setTheme( 'ace/theme/terminal' );
		// this.EditSession                 = require( 'ace/edit_session' ).EditSession;
		// this.editorElement               = document.getElementById( 'editor' );
		// this.editorElement.style.display = 'none';
	}

	// Opens a new editor window if the file doesn't exist yet.
	// and opens the file if it aleady exists.
	// checks to ensure there aren't more than 6 items already opened
	openFile( filename, text ) {
		let allOpenFilenames = [];
		for ( let element of this.files ) {
			allOpenFilenames.push( element[0] );
		}
		// check if the file isn't already open.
		if ( allOpenFilenames.includes( filename ) ) {
			this.activateFileByName( filename );
		}
		else {
			// Check if the maximum amount of open files ( 6 ) isn't already reached.
			if ( this.files.length < this.maxOpenFiles ) {
				this.createWindow( filename, text );
				this.createFileButton( filename );
				this.activateFileByName( filename );
			}
			else {
				alert( 'Close some files first.' );
			}
		}
	}

	// Opens the editor window of the file with the specified filename.
	activateFileByName( filename ) {
		this.activeFile = filename;
		for ( let element of this.files ) {
			if ( element[0] === filename ) {
				let index                           = this.navigator.getNavItemIndexByFilename( filename );
				this.navigator.navItems[index].open = true;
				this.editor.setSession( element[1] );
				this.editorElement.style.display = 'block';
				// Focus on the textarea after opening a file.
				document.getElementsByClassName( 'ace_text-input' )[0].focus();
				break;
			}
		}
		// Make the button that corresponds with the current file active.
		// essentialy this will make the tab a bit brighter
		this.makeButtonActive( filename );
	}

	// Make the active window button look darker to make it the obvious open file.
	makeButtonActive( filename ) {
		// input.file-title-button is the 'tab'
		let allHtmlElements      = document.getElementsByClassName( 'file-title-button' );
		// a.close-button is the 'x' that we click on to close that tab & rid ourselves of that particular code editor
		let allCloseHtmlElements = document.getElementsByClassName( 'close-button' );

		// traverse the list of open 'files', highlight the one that we are currently editing and reduce the opacity of the button( tab ) of the files we are not editing
		Array.from( allHtmlElements ).forEach( function( element ) {
			// Highlight the right button.
			// The 'file' name AND type is injected into the button's value attribute
			if ( element.value === filename ) {
				element.style.opacity = 1;
				allCloseHtmlElements[Array.from( allHtmlElements ).indexOf( element )].style.opacity = 1;
			}
			// Make the other htmlElements greyed out.
			else
			{
				element.style.opacity = 0.5;
				allCloseHtmlElements[Array.from( allHtmlElements ).indexOf( element )].style.opacity = 0.5;
			}
		} );
		// Resize all open file htmlElements to fit the window.
		this.resizeOpenFileHtmlElements();
	}

	// Changes the width of the open file buttons to fit the extension window.
	resizeOpenFileHtmlElements() {
		let allHtmlElements = document.getElementsByClassName( 'file-title-button' );
		let editorWidthStr  = this.editorElement.style['min-width'];
		let buttonWidth     = Math.round( ( parseInt( editorWidthStr.substring( 0, editorWidthStr.length - 2 ) ) - 20 ) / allHtmlElements.length );
		// Also take the with of the close htmlElements into a count.
		buttonWidth = buttonWidth - ( 3 * allHtmlElements.length );
		Array.from( allHtmlElements ).forEach( function( element ) {
			element.style.width = buttonWidth + 'px';
		} );
	}

	// Hides the editor and the open files.
	hide() {
		// Hide the editor element.
		this.editorElement.style.display = 'none';
		// Hide all open files.
		// This basically closes all the files without saving.
		// So after reopening the extension, the files will be open again.
		let allOpenFiles = document.getElementsByClassName( 'open-files-list-item' );
		// close all the files.
		Array.from( this.navigator.navItems ).forEach( function( element ) {
			element.open = false;
		} );
		// Delete the file htmlElements.
		Array.from( allOpenFiles ).forEach( function( element ) {
			element.parentNode.removeChild( element );
		} );
		// Clear the files list.
		this.files = [];
	}

	// Closes the editor of the file with the specified filename.
	closeFile( filename ) {
		let allOpenFiles = document.getElementsByClassName( 'open-files-list-item' );
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
			this.editorElement.style.display = 'none';
			this.navigator.disableAllMenus();
			this.navigator.enableMenuOfKind( 'MAIN' );
		} else {
			let fileToBeSavedAfterClosing = this.files[0][0];
			// Open the currently open file if the closed file is not the open file.
			if ( this.activeFile != filename ) {
				fileToBeSavedAfterClosing = this.activeFile;
			}
			// Open an other file thats open.
			this.activateFileByName( fileToBeSavedAfterClosing );
			this.navigator.disableAllMenus();
			this.navigator.enableMenuOfKind( 'EDITOR' );
			this.saveCurrentFile();
		}
	}

	// Creates a file button for a file with the specified name.
	createFileButton( filename ) {
		let ul                = document.getElementById( 'open-files-list' );
		let li                = document.createElement( 'li' );
		let fileButton        = document.createElement( 'input' );
		let closeButton       = document.createElement( 'a' );
		li.className          = 'open-files-list-item';
		closeButton.innerText = 'x';
		closeButton.className = 'close-button'
		closeButton.onclick   = function() {
			this.closeFile( filename );
		}.bind( this );
		fileButton.type      = 'submit';
		fileButton.className = 'file-title-button';
		fileButton.value     = filename;
		fileButton.onclick   = function() {
			// First save the old file.
			this.saveCurrentFile();
			this.activateFileByName( filename );
			this.navigator.enableMenuOfKind( 'EDITOR' );
			// Save the new file.
			this.saveCurrentFile();
		}.bind( this );
		li.appendChild( fileButton );
		li.appendChild( closeButton );
		ul.appendChild( li );
		this.makeButtonActive( filename );
		return li;
	}

	// Creates an editor window for the file with the specified name and text.
	createWindow( filename, text ) {
		let newSession = new this.EditSession( text );

		// Disable the info text on the left of the editor if it is an HTML file.
		if ( 'HTML' === filenameToKind( filename ) ) {
			newSession.setUseWorker( false );
		}
		// Set the editor to the correct language.
		if ( filename.endsWith( '.js' ) ) {
			newSession.setMode( 'ace/mode/javascript' );
		} else if ( filename.endsWith( '.css' ) ) {
			newSession.setMode( 'ace/mode/css' );
		}
		else if ( filename.endsWith( '.html' ) ) {
			newSession.setMode( 'ace/mode/html' );
		}

		// Bind the saveCurrentFile function to changes in the editor.
		newSession.on( 'change', function( delta ) {
			this.saveCurrentFile();
			if ( 'EDITOR' !== this.navigator.currentMenu ) {
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

	// Returns the the filetype in 'FILEEXTENSION' format.
	// 'JS' for javascript.
	// 'CSS' for Cascading Style Sheets.
	// 'HTML' for HyperText Markup Language.
	getCurrentFiletype() {
		if ( this.activeFile.endsWith( '.js' ) ) {
			return 'JS';
		} else if ( this.activeFile.endsWith( '.css' ) ) {
			return 'CSS';
		} else if ( this.activeFile.endsWith( '.html' ) ) {
			return 'HTML';
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
		for ( const [i, file] of this.files.entries() ) {
			if ( file[0] === oldFilename ) {
				this.files[i][0] = newFilename;
				this.activeFile  = newFilename;
				break;
			}
		}
		// Change the filename in the navigator.
		for ( let i = 0; i < this.navigator.navItems.length; i++ ) {
			if ( this.navigator.navItems[i].filename === oldFilename ) {
				this.navigator.navItems[i].filename = newFilename;
				break;
			}
		}

		let allHtmlElements = document.getElementsByClassName( 'file-title-button' );

		// Put the new filebutton in the position of the old one and remove the old one.
		for ( const element of Array.from( allHtmlElements ) )
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
		chrome.storage.sync.remove( oldFilename, function() {} );
		chrome.storage.local.remove( oldFilename, function() {} );

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
			chrome.storage.sync.remove( filename, function() {} );
			chrome.storage.local.set( allNewData, function() {
				showMessage( 'Saved!' );
			} );
		}
		else {
			chrome.storage.local.remove( filename, function() {} );
			chrome.storage.sync.set( allNewData, function() {
				showMessage( 'Saved!' );
			} );
		}
	}

	// Saves the current file and it's properties to storage.
	saveCurrentFile() {
		let currentFileName = this.activeFile;
		let currentText     = this.getCurrentText();
		let checked         = this.navigator.activeCheckbox.checked;
		let reloadOnremove  = this.navigator.reloadOnremoveCheckbox.checked;
		let activeWebsites  = this.navigator.enabledSitesTextArea.value;
		let position        = this.navigator.positionSelection.options[this.navigator.positionSelection.selectedIndex].value;
		let mode            = this.navigator.modeSelection.options[this.navigator.modeSelection.selectedIndex].value;
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
			chrome.storage.sync.remove( currentFileName, function() {} );
			chrome.storage.local.set( allNewData, function() {
				showMessage( 'Saved!' );
			} );
		}
		else {
			chrome.storage.local.remove( currentFileName, function() {} );
			chrome.storage.sync.set( allNewData, function() {
				showMessage( 'Saved!' );
			} );
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
		for ( let element of this.files ) {
			this.saveFileByName( element[0] );
		}
	}
} /* ******** END DEFINITION OF THE EDITOR CLASS ******/


// Object that represents a saved file.
class File {
	constructor( input, filename, text, activeWebsites, position, mode, active, reloadOnRemove, open, last ) {
		this.filename       = filename;
		this.text           = text; // Contains the content of the file.
		this.navigator      = navigator; // Contains the navigation.
		this.activeWebsites = activeWebsites // Contains all pages that the could should run on.
		this.position       = position; // Determines the position where the injection should take place.
		this.mode           = mode; // Determines if the script should be run only on the exact specified page ( exact ) or also on sub-pages ( recursive ).
		this.element        = input; // The button of the file.
		this.active         = active; // Determines if the file should be run when the specified pages are loaded.
		this.reloadOnRemove = reloadOnRemove === undefined ? false : reloadOnRemove; // Determines if the page should reload after removing the manipulation.
		this.open           = open; // Determines is open or not.
		this.last           = last; // Determines if this is the file that was last open.
		this.kind           = filenameToKind( filename ); // Determines the filetype.
	}
} // END THE DEFINITION OF THE FILE CLASS

/* ***************************************************************************
 * CLASS DEFINITION FOR NAVIGATION - Controls the navigation through the menus.
 ***************************************************************************
**/
class Navigation {
	constructor() {
		// Get all the html elements.
		// General elements.
		this.navbar                      = document.getElementById( 'navbar' );
		this.backDiv                     = document.getElementById( 'back-div' );
		// htmlElements
		this.backButton                  = document.getElementById( 'back-button' );
		this.reloadButton                = document.getElementById( 'reload-button' );
		this.newButton                   = document.getElementById( 'new-button' );
		this.jsButton                    = document.getElementById( 'JS-button' );
		this.cssButton                   = document.getElementById( 'CSS-button' );
		this.htmlButton                  = document.getElementById( 'HTML-button' );
		this.infoButton                  = document.getElementById( 'info-button' );
		this.bugReportButton             = document.getElementById( 'bug-report-button' );
		this.donateButton                = document.getElementById( 'donate-button' );
		this.tryButton                   = document.getElementById( 'try-button' );
		this.removeTryButton             = document.getElementById( 'remove-try-button' );
		this.makeButton                  = document.getElementById( 'make-button' );
		this.deleteButton                = document.getElementById( 'delete-button' );
		// Dropdowns
		this.positionSelection           = document.getElementById( 'position-selection' );
		this.modeSelection               = document.getElementById( 'mode-selection' );
		// Textfields
		this.filenameTextfield           = document.getElementById( 'filename-textfield' );
		this.enabledSitesTextArea        = document.getElementById( 'enabled-sites-text-area' );
		// Checkboxes
		this.activeCheckbox              = document.getElementById( 'active-checkbox' );
		this.reloadOnRemoveCheckbox      = document.getElementById( 'reload-on-remove-checkbox' );
		// Texts
		this.infoText                    = document.getElementById( 'info-text' );
		this.errorText                   = document.getElementById( 'error-text' );
		// Labels
		this.activeLabel                 = document.getElementById( 'active-label' );
		this.activeWebsitesLabel         = document.getElementById( 'active-websites-label' );
		this.matchingPagesLabel          = document.getElementById( 'matching-pages-label' );
		this.positionLabel               = document.getElementById( 'position-label' );
		this.filenameInputLabel          = document.getElementById( 'filename-input-label' );
		this.languageSelectionLabel      = document.getElementById( 'language-selection-label' );
		this.menuTitleLabel              = document.getElementById( 'menu-title-label' );
		this.extraInfoLabel              = document.getElementById( 'extra-info-label' );
		this.projectSupportLabel         = document.getElementById( 'project-support-label' );

		// Filename editing items before editing.
		this.filenameLabel               = document.getElementById( 'filename-label' );
		this.changeFilenameNotEditingDiv = document.getElementById( 'change-filename-not-editing-div' );
		this.changeFilenameLabel         = document.getElementById( 'change-filename-label' );
		this.changeFilenameButton        = document.getElementById( 'change-filename-button' );

		// Filename editing items while editing.
		this.changeFilenameEditingDiv    = document.getElementById( 'change-filename-editing-div' );
		this.changeFilenameTextfield     = document.getElementById( 'change-filename-textfield' );
		this.changeFilenameButtonDiv     = document.getElementById( 'change-filename-button-div' );
		this.cancelFilenameChangeButton  = document.getElementById( 'cancel-filename-change-button' );
		this.saveFilenameChangeButton    = document.getElementById( 'save-filename-change-button' );

		// Zoom factor elements.
		this.zoomOutButton               = document.getElementById( 'zoom-out-button' );
		this.zoomPercentageLabel         = document.getElementById( 'zoom-percentage-label' );
		this.zoomInButton                = document.getElementById( 'zoom-in-button' );

		// Dividers
		this.menuTitleDivider            = document.getElementById( 'menu-title-divider' );
		this.mainMenuDivisionLines       = document.getElementsByClassName( 'main-menu-division-line' );
		this.editorMenuDivisionLines     = document.getElementsByClassName( 'editor-menu-division-line' );

		// The navigation creates the editor.
		this.editor      = new Editor( this );
		this.currentMenu = 'MAIN';

		this.currentZoomLevel = 0;
		// Use the saved zoom level at startup if there is one.
		if ( localStorage['currentZoomLevel'] ) {
			this.setZoomFactor( parseInt( localStorage['currentZoomLevel'] ) );
		} else {
			this.setZoomFactor( 200 ); // Use default zoom level of 300% instead.
		}

		// Arrays that contain the items that are always present on that menu.
		this.mainNavItems = [
			this.jsButton,
			this.cssButton,
			this.htmlButton,
			this.infoText,
			this.infoButton,
			this.bugReportButton,
			this.languageSelectionLabel,
			this.donateButton,
			this.extraInfoLabel,
			this.projectSupportLabel
		].concat( Array.from( this.mainMenuDivisionLines ) );

		this.editorMenuItems = [
			this.backDiv,
			this.tryButton,
			this.activeWebsitesLabel,
			this.enabledSitesTextArea,
			this.matchingPagesLabel,
			this.modeSelection,
			this.deleteButton,
			this.filenameLabel,
			this.changeFilenameNotEditingDiv,
			this.changeFilenameEditingDiv
		].concat( Array.from( this.editorMenuDivisionLines ) );

		this.newMenuItems = [
			this.makeButton,
			this.filenameTextfield,
			this.backDiv,
			this.filenameInputLabel,
			this.infoText
		];

		this.allMenuTypes = [ 'MAIN', 'JS', 'CSS', 'HTML', 'EDITOR', 'NEW', 'ERROR' ];

		// Array that contains all files present in the Navigator.
		// All elements should be of type 'File'.
		this.navItems = [];

		// Bind the right function to every html element.
		this.bindHtmlElements();

		// Test if communication with the backend is possible.
		// Enable the 'ERROR' menu if this isn't the case.
		communicationTest(
			() => { this.enableMenuOfKind( 'ERROR' ) }, //onFail
			() => {
				this.enableMenuOfKind( 'MAIN' );
				this.loadOpenFiles();
			}
		); //onSuccess
		setTimeout( () => {
			this.loadOpenFiles();
		}, 100 );
	}

	// binds the correct functions to the htmlElements.
	// This method should only be run once from inside of the constructor.
	bindHtmlElements() {
		// Bind the button that changes the name of the current file.
		this.changeFilenameButton.onclick = () => {
			this.changeFilenameNotEditingDiv.style.display = 'none';
			this.changeFilenameEditingDiv.style.display    = 'block';
			this.changeFilenameTextfield.focus();

		};

		// Bind the button that cancels editing the filename.
		this.cancelFilenameChangeButton.onclick = () => {
			this.changeFilenameNotEditingDiv.style.display = 'block';
			this.changeFilenameEditingDiv.style.display    = 'none';
		};

		// Bind the button that saves the new filename.
		this.saveFilenameChangeButton.onclick = () => {
			let newFilename   = this.changeFilenameTextfield.value;
			let splitParts    = this.editor.activeFile.split( '.' );
			let fileExtension = splitParts[splitParts.length - 1];

			// Check if a file with the new filename already exists.
			if ( this.fileExists( newFilename ) ) {
				alert( 'There already is a file with this name, Try a different one.' );
			} else {
				// Add the correct file extension if there isn't one already.
				if ( ! newFilename.endsWith( '.' + fileExtension ) ) {
					newFilename += '.' + fileExtension;
				}
				// Change the filename of the current file.
				this.editor.changeCurrentFileName( newFilename );
				this.enableMenuOfKind( 'EDITOR' );
			}
		};

		// Bind the info button on the main menu.
		// this.infoButton.onclick = () => window.open( 'https://github.com/Ruud14/Page-Manipulator', '_blank' ).focus();

		// Bind the bug report button on the main menu.
		// this.bugReportButton.onclick = () => window.open( 'https://github.com/Ruud14/Page-Manipulator/issues', '_blank' ).focus();

		// Bind the 'active' checkbox.
		this.activeCheckbox.onchange = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index = this.navItems.indexOf( element );
					// Only allow the active checkbox to be checked when there are active websites specified.
					if ( this.navItems[index].activeWebsites.replaceAll(/\s/g, '' ) === '' && this.activeCheckbox.checked === true ) {
						alert( 'You must first specify the active websites in the "active websites" textarea. If you want this manipulation to be active on all webistes, put "all" into the "active websites" textarea.' );
						this.activeCheckbox.checked = false;
					} else {
						this.navItems[index].active = this.activeCheckbox.checked;
						this.editor.saveCurrentFile();
					}
					break;
				}
			}
		};

		// Function for autosaving when changing the position of the injected code. ( HTML only )
		let positionChangeFunction = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index                     = this.navItems.indexOf( element );
					this.navItems[index].position = this.positionSelection.options[this.positionSelection.selectedIndex].value;
					this.editor.saveCurrentFile();
					break;
				}
			}
		};

		// Autosave when changing the position of the injected code. ( HTML only )
		this.positionSelection.onkeyup  = positionChangeFunction;
		this.positionSelection.onchange = positionChangeFunction;

		// Function for autosaving when changing the mode. ( Exact or Recursive )
		let modeChangeFunction = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index                 = this.navItems.indexOf( element );
					this.navItems[index].mode = this.modeSelection.options[this.modeSelection.selectedIndex].value;
					this.editor.saveCurrentFile();
					break;
				}
			}
		};

		// Autosave when changing the mode.
		this.modeSelection.onkeyup  = modeChangeFunction;
		this.modeSelection.onchange = modeChangeFunction;

		// Function for autosaving when changing the 'active sites' textarea.
		let activeSitesTextareaChangeFunction = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index                           = this.navItems.indexOf( element );
					this.navItems[index].activeWebsites = this.enabledSitesTextArea.value;
					this.editor.saveCurrentFile();
					break;
				}
			}
		};

		// Function for autosaving when leaving the 'active sites' textarea.
		let activeSitesTextareaLeaveFunction = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index                           = this.navItems.indexOf( element );
					this.navItems[index].activeWebsites = this.enabledSitesTextArea.value;
					if ( this.enabledSitesTextArea.value.replaceAll(/\s/g, '' ) === '' && this.activeCheckbox.checked === true ) {
						this.navItems[index].active = false;
						this.activeCheckbox.checked = false;
					}
					this.editor.saveCurrentFile();
					break;
				}
			}
		};

		// Autosave when changing the 'active sites' textarea.
		this.enabledSitesTextArea.onkeyup  = activeSitesTextareaChangeFunction;
		this.enabledSitesTextArea.onchange = activeSitesTextareaLeaveFunction;

		// Bind that button that navigates to the JavaScript page.
		this.jsButton.onclick = () => {
			this.enableMenuOfKind( 'JS' );
		};

		// Bind that button that navigates to the CSS page.
		this.cssButton.onclick = () => {
			this.enableMenuOfKind( 'CSS' );
		};

		// Bind that button that navigates to the HTML page.
		this.htmlButton.onclick = () => {
			this.enableMenuOfKind( 'HTML' );
		};

		// Bind the button that reloads the page.
		this.reloadButton.onclick = () => {
			let filename = this.editor.activeFile;
			chrome.tabs.query( { active: true, currentWindow: true }, tabs => {
				this.editor.saveCurrentFile();
				let kind = filenameToKind( filename );
				// Remove the manipulation first.
				chrome.tabs.sendMessage( tabs[0].id, { todo: 'remove' + kind, value: filename } );
				if ( ! this.activeCheckbox.checked ) {
					this.removeTryButton.style.display = 'none';
					this.tryButton.value               = 'Manipulate';
				}
				 // Reload the page.
				chrome.tabs.update( tabs[0].id, { url: tabs[0].url } );
			} );
		};

		// Bind the back button.
		this.backButton.onclick = () => {
			this.disableAllMenus();
			this.enableMenuOfKind( 'MAIN' );
		};

		// Bind the button that creates a new file.
		// this.newButton.onclick = () => {
		// 	//open the editor.
		// 	this.disableAllMenus();
		// 	this.enableMenuOfKind( 'NEW' );
		// 	this.filenameTextfield.focus();
		// };
		this.newButton.addEventListener( 'click', () => {
			() => {
				//open the editor.
				this.disableAllMenus();
				this.enableMenuOfKind( 'NEW' );
				this.filenameTextfield.focus();
		})

		// Bind the 'manipulate'/'update manipulation' button.
		this.tryButton.onclick = () => {
			//get the text of the current file and send it to insert.
			let currentFileName                = this.editor.activeFile;
			let currentText                    = this.editor.getCurrentText();
			let position                       = this.positionSelection.options[this.positionSelection.selectedIndex].value;
			let todo                           = 'change' + this.editor.getCurrentFiletype();
			let mode                           = this.modeSelection.options[this.modeSelection.selectedIndex].value;
			this.removeTryButton.style.display = 'block';
			this.tryButton.value               = 'Update Manip.';
			showMessage( 'Page Manipulated' );
			insert( todo, currentText, position, mode, currentFileName );
		};

		// Bind the button that removes the manipulation from the web-page.
		this.removeTryButton.onclick = function( e ) {
			// Don't remove the manipulation when the reloadOnRemoveCheckbox is clicked.
			if ( e.target !== this.removeTryButton )
				return;

			// Change the buttons.
			this.removeTryButton.style.display = 'none';
			this.tryButton.value               ='Manipulate';

			// Send remove message to backend.
			chrome.tabs.query( { active: true, currentWindow: true }, tabs => {
				let kind = filenameToKind( this.editor.activeFile );
				chrome.tabs.sendMessage( tabs[0].id, { todo:'remove' + kind, value: this.editor.activeFile } );
			} );

			this.editor.saveCurrentFile();

			// Reload the page when the reloadOnRemoveCheckbox is checked.
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index = this.navItems.indexOf( element );
					if ( this.navItems[index].reloadOnRemove === true ) {
						this.activeCheckbox.checked = false;
						this.navItems[index].active = false;
						this.editor.saveCurrentFile();
						chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
							chrome.tabs.update( tabs[0].id, { url: tabs[0].url } );
						} );
						break;
					}
					break;
				}
			}

			showMessage( 'Removed Manipulation' );
		}.bind( this );

		// Bind the checkbox that determines if the page should be reloaded after removing a manipulation.
		this.reloadOnRemoveCheckbox.onchange = () => {
			for ( let element of this.navItems ) {
				if ( element.filename === this.editor.activeFile ) {
					let index                           = this.navItems.indexOf( element );
					this.navItems[index].reloadOnRemove = this.reloadOnRemoveCheckbox.checked;
					this.editor.saveCurrentFile();
					break;
				}
			}
		};

		// Bind the button that removes the current file from storage.
		this.deleteButton.onclick = () => {
			// Make sure the user didn't press 'delete' by accident.
			if ( confirm( 'Are you sure you want to delete ' + this.editor.activeFile + '?' ) ) {
				chrome.tabs.query( { active: true, currentWindow: true }, tabs => {
					// Remove the manipulation.
					let kind = filenameToKind( this.editor.activeFile );
					chrome.tabs.sendMessage( tabs[0].id, { todo:'remove' + kind, value: this.editor.activeFile } );

					let index = this.getNavItemIndexByFilename( this.editor.activeFile );
					// Remove the file from the editor.
					this.editor.deleteCurrentFile();
					// Removes the file form the navItems array.
					if ( this.navItems.length === 1 ) {
						this.navItems = [];
					} else {
						this.navItems.slice( index, 1 );
					}
					// Enable the right menu after deleting.
					if ( this.editor.files.length >= 1 ) {
						this.enableMenuOfKind( 'EDITOR' );
					} else {
						this.enableMenuOfKind( 'MAIN' );
					}
					showMessage( 'File Deleted!' );
				} );
			}
		};

		// Bind the button that confirms the creation of a new file.
		this.makeButton.onclick = () => {
			let filename = this.filenameTextfield.value;
			// Make sure there isn't already a file with the same name.
			if ( this.fileExists( filename ) ) {
				alert( 'a file with this name already exists -- try a different name' );
			} else {
				// if ( this.currentMenu === 'JS' || this.currentMenu === 'CSS' || this.currentMenu === 'HTML' ) {
				if ( ['JS', 'CSS', 'HTML'].includes( this.currentMenu ) ) {
					// Add the correct file extension if there isn't one already.
					if ( !filename.endsWith( '.' + this.currentMenu.toLowerCase() ) ) {
						filename += '.' + this.currentMenu.toLowerCase();
					}
					// Create a navigation button for the new file.
					let input = this.addNavButton( filename );
					// Add functionallity to the button.
					input.onclick = () => {
						this.editor.openFile( filename, '' );
						this.enableMenuOfKind( 'EDITOR' );
					};
					let newNavItem = new File( input, filename, '', '', 'top', true, false, true, true );
					this.navItems.push( newNavItem );

					this.editor.openFile( filename, '' );
					this.enabledSitesTextArea.value = '';
					this.editor.saveCurrentFile();
					this.enableMenuOfKind( 'EDITOR' );
				}
			}
		};

		// Bind the button that makes the extension window smaller.
		this.zoomOutButton.onclick = () => {
			if ( this.currentZoomLevel > 0 ) {
				this.setZoomFactor( this.currentZoomLevel - 50 );
			}
		};

		// Bind the button that makes the extension window bigger.
		this.zoomInButton.onclick = () => {
			if ( this.currentZoomLevel < 250 ) {
				this.setZoomFactor( this.currentZoomLevel + 50 );
			}
		};
	}

	// Check if a a file with the specified filename exists.
	fileExists( filename ) {
		let fileExtension = '.' + this.currentMenu.toLowerCase();
		// Check if the filename already contains the right file extension.
		if ( filename.endsWith( fileExtension ) ) {
			// Check if there alreay is a file with the same name.
			if ( this.getNavItemIndexByFilename( filename ) == null ) {
				return false;
			} else {
				return true;
			}
		} else {
			// Check if there alreay is a file with the same name.
			if ( this.getNavItemIndexByFilename( filename + fileExtension ) == null ) {
				return false;
			} else {
				return true;
			}
		}
	}

	// Changes the size of everything inside the extension when the zoom level is changed.
	// The factor is the percentage-100 so 300% would be factor 200.
	setZoomFactor( factor ) {
		if ( factor >= 0 ) {
			this.currentZoomLevel                         = factor;
			localStorage['currentZoomLevel']              = factor;
			let bodyWidth                                 = Math.round( 600 + this.currentZoomLevel * ( 2/3 ) );
			let bodyHeight                                = Math.round( 300 + this.currentZoomLevel );
			let editorWidth                               = Math.round( 420 + this.currentZoomLevel * ( 2/3 ) );
			let editorHeight                              = Math.round( 230 + this.currentZoomLevel );
			let navBarHeight                              = Math.round( 250 + this.currentZoomLevel );
			document.body.style['min-width']              = bodyWidth.toString() + 'px';
			document.body.style['min-height']             = bodyHeight.toString() + 'px';
			this.editor.editorElement.style['min-width']  = editorWidth.toString() + 'px';
			this.editor.editorElement.style['min-height'] = editorHeight.toString() + 'px';
			this.editor.editor.resize();
			this.navbar.style['min-height']    = navBarHeight.toString() + 'px';
			this.zoomPercentageLabel.innerText = ( this.currentZoomLevel+100 ).toString() + ' %';
		}
		// Resize the htmlElements of all open files to fit the size of the extension window.
		this.editor.resizeOpenFileHtmlElements();
	}

	// Creates a new navigation button for the specified filename.
	addNavButton( filename ) {
		let kind = filenameToKind( filename );
		// make the html element for the File object.
		// if ( kind === 'JS' || kind === 'CSS' || kind === 'HTML' ) {
		if ( ['JS', 'CSS', 'HTML'].includes( kind ) ) {
			let input       = document.createElement( 'input' );
			input.type      = 'submit';
			input.value     = filename;
			input.className = document.getElementsByClassName( `nav-button saved-${kind.toLowerCase()}-nav-button` );
			return input;
		}
	}

	// Gets the saved files from storage.
	getSavedNavItems() {
		// First get the synced storage.
		chrome.storage.sync.get( null, data => {
			// Clear the array.
			this.navItems = [];
			// Populate navItems.
			let filenames = Array.from( Object.keys( data ) );
			let filedatas = Array.from( Object.values( data ) );

			for ( let i = 0; i < filenames.length; i++ ) {
				let fileData       = filedatas[i];
				let activeWebsites = fileData['activeWebsites'];
				let filename       = fileData['filename'];
				let filetext       = fileData['text'];
				let position       = fileData['position'];
				let mode           = fileData['mode'];
				let active         = fileData['active'];
				let reloadOnRemove = fileData['reloadOnRemove'];
				let open           = fileData['open'];
				let last           = fileData['last'];
				let input          = this.addNavButton( filename );

				// Add functionality to the navigation button.
				input.onclick = () => {
					this.editor.openFile( filename, filetext );
					this.editor.saveCurrentFile();
					this.disableAllMenus();
					this.enableMenuOfKind( 'EDITOR' );
				};

				let navItem = new File( input, filename, filetext, activeWebsites, position, mode, active, reloadOnRemove, open, last );
				this.navItems.push( navItem );
			} // end for...

			// Also get the local storage.
			chrome.storage.local.get( null, data => {

				// Populate navItems
				let filenames = Array.from( Object.keys( data ) );
				let filedatas = Array.from( Object.values( data ) );
				for ( let i = 0; i < filenames.length; i++ ) {
					let fileData       = filedatas[i];
					let activeWebsites = fileData['activeWebsites'];
					let filename       = fileData['filename'];
					let filetext       = fileData['text'];
					let position       = fileData['position'];
					let mode           = fileData['mode'];
					let active         = fileData['active'];
					let reloadOnRemove = fileData['reloadOnRemove'];
					let open           = fileData['open'];
					let last           = fileData['last'];
					let input          = this.addNavButton( filename );

					// Add functionallity to the navigation button.
					input.onclick = () => {
						this.editor.openFile( filename, filetext );
						this.editor.saveCurrentFile();
						this.disableAllMenus();
						this.enableMenuOfKind( 'EDITOR' );
					};

					let navItem = new File( input, filename, filetext, activeWebsites, position, mode, active, reloadOnRemove, open, last );
					this.navItems.push( navItem );
				}
			} );
		} );
	}

	// Get the index of a file in 'this.navItems'.
	getNavItemIndexByFilename( filename ) {
		for ( let i = 0; i < this.navItems.length; i++ ) {
			if ( this.navItems[i].filename === filename ) {
				return i;
			}
		}


	}

	// Clears the navbar, and populates it again.
	// This way the opacity of the file buttons is set to the right value.
	reloadNavButtons() {
		// Clear the ul's.
		let allJsFileHtmlElements   = [...document.getElementsByClassName( 'saved-js-nav-button' )]
		let allCssFileHtmlElements  = [...document.getElementsByClassName( 'saved-css-nav-button' )]
		let allHtmlFileHtmlElements = [...document.getElementsByClassName( 'saved-html-nav-button' )]
		// let allFileHtmlElements = allJsFileHtmlElements.concat( allCssFileHtmlElements ).concat( allHtmlFileHtmlElements );
		let allFileHtmlElements = [ ...allCssFileHtmlElements, ...allHtmlFileHtmlElements ]
		if ( allFileHtmlElements ) {
			allFileHtmlElements.forEach( function( element ) {
				element.parentNode.parentNode.removeChild( element.parentNode );
			} )
		}

		// Populate the navbar again.
		this.navItems.forEach( element => {
			let li = document.createElement( 'li' );
			// Make the button greyed out when the file.active is set to false.
			if ( element.active ) {
				element.element.style.opacity = 1;
			} else {
				element.element.style.opacity = 0.5;
			}
			li.appendChild( element.element );
			this.navbar.appendChild( li );
		} )
	};

	// This method opens the files at startup.
	loadOpenFiles() {
		let lastOpenFile = null;
		for ( let element of this.navItems ) {
			// Open all files that were open before.
			if ( element.open && ( this.editor.files.length < this.editor.maxOpenFiles ) ) {
				this.editor.openFile( element.filename, element.text );
				this.enableMenuOfKind( 'EDITOR' );
				if ( element.last ) {
					lastOpenFile = element.filename;
				}
			}
		}
		// Open the file that was up front last time, and put it up front again.
		if ( lastOpenFile ) {
			this.editor.activateFileByName( lastOpenFile );
			this.enableMenuOfKind( 'EDITOR' );
		}
	}

	// Enables the specified menu.
	// options: 'JS', 'CSS', 'HTML', 'MAIN', 'ERROR', 'EDITOR', 'NEW'.
	enableMenuOfKind( kind ) {
		this.getSavedNavItems(); // Get all files from storage.
		this.reloadNavButtons(); // Reload the navigation buttons based on the new data from storage.
		this.disableAllMenus(); // Disable all menus.

		// Activate the right menu.
		switch( kind ) {
			case 'JS':
			case 'CSS':
			case 'HTML':
				this.backDiv.style.display = 'block';
				let allElements            = document.getElementsByClassName( `saved-${kind.toLowerCase()}-nav-button` );
				[...allElements].forEach( element => element.style.display = 'block' )
				this.newButton.style.display = 'block';
				this.infoText.style.display  = 'block';
				// Change the menu tile label.
				this.menuTitleLabel.innerText = kindToLanguage( kind );
				break;
			case 'MAIN':
				this.menuTitleLabel.innerText = 'Main Menu';
				this.mainNavItems.forEach( element => element.style.display = 'block' )
				break;
			// This menu is shown whenever the extension is opened on a page that can't be manipulated.
			case 'ERROR':
				this.editor.hide();
				this.menuTitleLabel.innerText       = '';
				this.errorText.style.display        = 'block';
				this.menuTitleDivider.style.display = 'none';
				break;
			case 'EDITOR':
				// Show the name of the language in the navigation bar.
				this.menuTitleLabel.innerText     = kindToLanguage( filenameToKind( this.editor.activeFile ) );
				this.activeCheckbox.style.display = 'inline';
				this.activeLabel.style.display    = 'inline-block';
				this.editorMenuItems.forEach( element => element.style.display = 'block' )
				// Set the state of the filename editing to not editing.
				this.changeFilenameEditingDiv.style.display    = 'none';
				this.changeFilenameNotEditingDiv.style.display = 'block';
				this.changeFilenameLabel.innerText             = this.editor.activeFile;
				this.changeFilenameTextfield.value             = this.editor.activeFile;

				chrome.tabs.query( { active: true, currentWindow: true }, tabs => {
					// Check if the current page has been manipulated.
					chrome.tabs.sendMessage( tabs[0].id, { todo:'getStatus', value: this.editor.activeFile }, ( response ) => {
						if ( response != null ) {
							// If the current page has been manipulated, change the 'manipulate' button to 'Update manip.'
							if ( response.response === true ) {
								this.removeTryButton.style.display = 'block';
								this.tryButton.value               = 'Update Manip.';
							}
						}
						else {
							// The extension is opened on a page that it can't manipulate.
							if ( chrome.runtime.lastError ) {
								if ( chrome.runtime.lastError.message === 'Could not establish connection. Receiving end does not exist.' ) {
									communicationTest(
										() => this.enableMenuOfKind( 'ERROR' ), //onFail
										() => {
											this.enableMenuOfKind( 'MAIN' );
											this.loadOpenFiles();
										}
									); //onSuccess
									return;
								}
							}
						}
					} );
				} );

				// Only display the position option when html.
				if ( this.editor.activeFile.endsWith( '.html' ) ) {
					this.positionSelection.style.display = 'block';
					this.positionLabel.style.display     = 'block';
				}

				// Add the active websites to the enabledSitesTextArea.
				let index = this.getNavItemIndexByFilename( this.editor.activeFile );
				// Change the settings to the correct settings for the current file.
				this.activeCheckbox.checked         = this.navItems[index].active;
				this.reloadOnRemoveCheckbox.checked = this.navItems[index].reloadOnRemove;
				this.enabledSitesTextArea.value     = this.navItems[index].activeWebsites;
				let positionOptions                 = this.positionSelection.options;
				for ( let i = 0; i < positionOptions.length; i++ ) {
					if ( positionOptions[i].value === String( this.navItems[index].position ).toLowerCase() ) {
						this.positionSelection.selectedIndex = i;
						break;
					}
				}
				let modeOptions = this.modeSelection.options;
				for ( let i = 0; i < modeOptions.length; i++ ) {
					if ( this.navItems[index].mode != null ) {
						if ( modeOptions[i].value === String( this.navItems[index].mode ).toLowerCase() ) {
							this.modeSelection.selectedIndex = i;
							break;
						}
					}
				}
				break;
			case 'NEW':
				this.menuTitleLabel.innerText = 'New File';
				this.newMenuItems.forEach( function( element ) {
				} )
					element.style.display = 'block';
				break;
		}
		// Only change the current menu whenever the current menu isn't the new file menu.
		if ( kind != 'NEW' ) {
			this.currentMenu = kind;
		}
	}

	// Disables the specified menu.
	// options: 'JS', 'CSS', 'HTML', 'MAIN', 'ERROR', 'EDITOR', 'NEW'.
	disableMenuOfKind( kind ) {
		switch( kind ) {
			case 'JS':
			case 'CSS':
			case 'HTML':
				this.backDiv.style.display = 'none';
				let allElements            = document.getElementsByClassName( `saved-${kind.toLowerCase()}-nav-button` );

				[...allElements].forEach( element => element.style.display = 'none' )
				this.newButton.style.display = 'none';
				break;
			case 'MAIN':
				this.mainNavItems.forEach( element => element.style.display = 'none' )
				break;
			case 'ERROR':
				this.errorText.style.display        = 'none';
				this.menuTitleDivider.style.display = 'block';
				break;
			case 'EDITOR':
				this.editorMenuItems.forEach( element => element.style.display = 'none' )
				// These items aren't in the 'editorMenuItems' array because they aren't always there,
				// so they must be dissabled manually
				this.activeCheckbox.style.display    = 'none';
				this.activeLabel.style.display       = 'none';
				this.positionSelection.style.display = 'none';
				this.positionLabel.style.display     = 'none';
				this.removeTryButton.style.display   = 'none';
				this.tryButton.value                 = 'Manipulate';
				break;
			case 'NEW':
				this.newMenuItems.forEach( element => element.style.display = 'none' )
				break;
		}
	}

	// Disables all menus.
	disableAllMenus() {

		let allMenuTypes = [ 'MAIN', 'JS', 'CSS', 'HTML', 'EDITOR', 'NEW', 'ERROR' ]
		// this.disableMenuOfKind( 'MAIN' );
		// this.disableMenuOfKind( 'JS' );
		// this.disableMenuOfKind( 'CSS' );
		// this.disableMenuOfKind( 'HTML' );
		// this.disableMenuOfKind( 'EDITOR' );
		// this.disableMenuOfKind( 'NEW' );
		// this.disableMenuOfKind( 'ERROR' );

		allMenuTypes.forEach( menuType => this.disableMenuOfKind( menuType ) )
	}
}

/**
 * Disables All Menus
 */
function 	disableAllMenus() {
	let allMenuTypes = [ 'MAIN', 'JS', 'CSS', 'HTML', 'EDITOR', 'NEW', 'ERROR' ]
	allMenuTypes.forEach( menuType => this.disableMenuOfKind( menuType ) )
}
