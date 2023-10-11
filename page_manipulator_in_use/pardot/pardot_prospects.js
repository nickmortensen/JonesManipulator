/**
 * Page Manipulator browser extension script for use with Pardot Prospect Review pages.
 * Last Updated on 2023_09_19
 * Script is active recursively on pages with this url: https://pi.pardot.com/prospect/read/id
 *
 * @link https://chrome.google.com/webstore/detail/page-manipulator/mdhellggnoabbnnchkeniomkpghbekko?hl=en#:~:text=-%20%27Bottom%27%20%3E%20The%20HTML%20will%20be%20added,code%20into%20the%20page%20or%20updates%20the%20injection.
 */

/**
 * Check to ensure the item has been defined.
 * Ensures there was some data entered into the fields in the New Prospect Review.
 *
 * @param {string} x The item we are checking to ensure is defined.
 * @returns true if the parametpage_manipulator_broswer_extensioner type is NOT 'undefined'
 */
const hasContent = x => typeof x !== "undefined";
/**
 * Format a 10 digit phone number that is all digits.
 *
 * @param {string} phone The unformatted phone number.
 * @returns {string}     Properly formatted phone number  with area code. Example: '(920) 490-4190'
 */
const phoneFormat = phone => phone.replace( /\D/g, '' ).slice(-10).match( /^(\d{3})(\d{3})(\d{4})$/ );




/**
 * Builds the HTML email in table form, must still run it through Typinator by using the npc key combination -- "New Prospect Card".

 * @param {object} dataObject An object containing the relevantdata -- in this case the object is built using the getDataObject() function.
 * @returns string of Table HTML for formatting through typinator as 'formatted text' and pasting into a gmail.
 */
function emailHTML( dataObject ) {
	let formTitle;
	let titleColor = '#0273b9';
	let { name, link, email, companyName, jobTitle, phone, formOrigin, disposition, message } = dataObject;

	// Subcontractor inquiries should be send to vendorinfo@jonessign.com
	switch( disposition ) {
		case 'Service Request':
			formTitle = 'Service Inquiry';
			break;
		case 'Subcontractor Partnership Inquiry':
			formTitle = 'Subcontractor Inquiry';
			break;
		default:
			formTitle = 'Inbound Inquiry';
	}
	if ( 'NMD' === formOrigin.toUpperCase() ) {
		formTitle  = 'NMD Inquiry';
		titleColor = '#daa520';
	}



let output = `
<style>

table {
	margin: 16px auto;
	background: #fcfcfc;
	border: 1px solid #efefef;
	border-top: none;
	border-left: none;
	box-shadow: 1px 4px 12px 1px #eff0fc;
	font-family: 'Lucida Sans Unicode', monospace, sans-serif;
	color: #737478;
}

h3 {
	font-size: 34px;
	font-style: italic;
	font-weight: 900;
	text-align: center;
	text-shadow: 1px 1px 1px #515153;
	text-transform: uppercase;
	letter-spacing: 2px;
	line-height: 1.24;
}

tr {
	line-height: 1.35;
	padding: 12px;
}

td {
	line-height: 1.45;
	font-size: 18px;
	border-bottom: 1px solid rgba(100,149,237,0.5);
	text-align: left;

}
td.inputted {
	max-width: 820px;
	padding-left: 18px;
	padding-right: 10px;
	margin-left: 8px;
}

.inputted,
.before,
.label {
	border-bottom: 1px solid rgba(100,149,237,0.5);
}

td.before { width: 28px; }

div.dot {
	background: unset;
	border: 2px solid #efefef;
	border-radius: 50%;
	margin-left: 4px;
	max-width: 15px;
	min-height: 15px;
	vertical-align: middle;
}

.label {
	border-right: 1px solid #ff9d9d;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 1.5px;
	padding-left: 8px;
	padding-right: 4px;
	text-align: right;
}

.vertical {
	border-bottom: none;
	line-height: 1.37;
	vertical-align: top;
}

.message,
.message td {
	border-bottom: none;
}

td#theProspectMessage {
	border-bottom: none;
	font-size: 20px;
	font-style: italic;
	line-height: 1.27;
	max-width: 820px;
	padding-right: 10px;
	text-align: left;
}
</style>
<table id="theTable">
	<tbody id="theTableBody">
		<tr class="initial-row" colspan="3">
			<td colspan="3">
				<h3 id="theFormTitle" style="color: ${titleColor};">${formTitle}</h3>
			</td>
		</tr>
		<tr>
			<td class="before" > <div class="dot"></div> </td>
			<td class="label">Name:</td>
			<td id="theProspectName" class="inputted"> ${name}</td>
		</tr>
		<tr>
			<td class="before"> <div class="dot"></div> </td>
			<td class="label">Company:</td>
			<td id="theCompanyName" class="inputted"><a id="theCompanyLink" href="${link}">${companyName}</a></td>
		</tr>
		<tr>
			<td class="before"> <div class="dot"></div> </td>
			<td class="label">Position:</td>
			<td id="theProspectTitle" class="inputted"> ${jobTitle}</td>
		</tr>
		<tr>
			<td class="before" > <div class="dot"></div> </td>
			<td class="label">Email:</td>
			<td id="theProspectEmail" class="inputted"> <a href="mailto:${email}">${email}</a></td>
		</tr>
		<tr>
			<td class="before"> <div class="dot"></div> </td>
			<td class="label">Telephone:</td>
			<td id="theProspectPhoneNumber" class="inputted"><a href="tel:+1${phone[0]}">(${phone[1]}) ${phone[2]}-${phone[3]}</a></td>
		</tr>
		<tr class="message">
			<td class="before"> <div class="dot"></div></td>
			<td class="label vertical">Message:</td>
			<td id="theProspectMessage" class="inputted"> <em style="font-style: italic;"> ${message}</em> </td>
		</tr>
	</tbody>
</table>`;

return output.replace(/(\r\n|\n|\r|\t)/gm, "")
}

/**
 * Place an HTML button that when clicked will give me the html table for the email I wish to create based on the relevant data within the page.
 * @returns a string of html that can be pasted as formatted text into a gmail.
 */
function createCopyButton() {
	let copyButton         = document.createElement( 'button' );
	copyButton.id          = 'copyThis';
	copyButton.textContent = 'GET';
	copyButton.style.backgroundColor = '#0273b9'
	copyButton.style.minHeight = '80px'
	copyButton.style.minWidth = '80px'
	copyButton.style.outline = '4px solid white'
	copyButton.style.color = '#ffffff'
	copyButton.style.fontSize = '20px'
	copyButton.style.boxShadow = '4px 4px 6px #515153, -4px 4px 6px #515153'
	copyButton.style.padding = '1.25em'
	copyButton.style.borderRadius = '50%'
	copyButton.style.transition = 'all 0.4s cubic-bezier(.17,.67,.8,1.26)'
	copyButton.style.position = 'absolute'
	copyButton.style.top = '20vh'
	copyButton.style.right = '4vw'
	return copyButton;
}
// place the copy button into the DOM
// document.querySelector( '#jigsaw-modal' ).append( createCopyButton() );


/**
 * Change status of the do not email field to "true"
 */
function setDoNotEmail() {
	// change status of the do not email field to "true"
	let doNotEmailSelect = document.querySelector('#default_field_11879');
	let valueTrue = doNotEmailSelect.querySelector('[value="1"]')
	let valueFalse = doNotEmailSelect.querySelector('[value="0"]')
	valueTrue.setAttribute('selected', 'selected')
	valueFalse.removeAttribute('selected')
	console.log( 'status of do not email dropdown is now \'true\'')
}


function prepareForDeletion() {
	let editButton = document.querySelector('[accesskey="e"]') // edit button for prospect
	editButton.click();
	const mailFieldsToggle = document.querySelector(`#toggle-mailable-inputs-${prospectID}`)
	// wait half a second before toggling the mailfields
	setTimeout( () => {
		mailFieldsToggle.click()
	}, 1250)
	// change status of the do not email field to "true"
	setTimeout( () => {
		setDoNotEmail();
	}, 2500 )
	setTimeout( () => {
		mailFieldsToggle.click()
	}, 3500)
}

// let doNotEmailSelect = document.querySelector('#default_field_11879');
// let saveProspectButton = document.querySelector( '#saveProspectButton')
// let editButton = document.querySelector('[accesskey="e"]')
// let nonProspect = document.querySelector('[id$="_chzn_o_8"')
// let list = document.querySelector('.chzn-results')
// let nonProspectOption = listOptions.filter( i => i.outerText === 'Non-prospects')
// remove non prospect option from list

/*
{ <li class="selected-list hidden " data-name="Non-prospects" data-id="46258" style="display: list-item;">
<a class="remove-selected-list text-error" href="#" onclick="$j(this).parent().parent().parent().parent().parent().chosenMultiSelect(&quot;removeSelectedList&quot;, this); return false;"><i class="icon-remove-sign"></i></a> Non-prospects</li>


new Ajax.Updater('pr_status38186439', '/prospect/editAjax/id/38186439/prefix/pr', {
	asynchronous:true,
	evalScripts:true,
	onComplete:function(request, json){
		$j("#indicator").fadeOut(); //spinner
		toggleDisplay('pr_status38186439', true); // show editable fields
		new Effect.Highlight('pr_status38186439', {duration:2});}, onLoading:function(request, json){$j("#indicator").show();}, parameters:'_csrf_token=6efdd581832c85570dee721bac39e79b3f81d6b3ae317e82489e6837e82d582d9c62a83a88971765e76a37930bbc75b2'});; return false; }
*/

/**
 * Place an HTML button that when clicked will give me the html table for the email I wish to create based on the relevant data within the page.
 * @returns a string of html that can be pasted as formatted text into a gmail.
 */
// function createSetDoNotEmailButton() {
// 	let button         = document.createElement( 'button' );
// 	button.id          = 'setToDoNotEmail';
// 	button.textContent = 'STOP';
// 	button.style.minHeight = '80px'
// 	button.style.minWidth = '80px'
// 	button.borderRadius = 50%
// 	return button
// }
// place the copy button into the DOM
// document.querySelector( '#jigsaw-modal' ).append( createSetDoNotEmailButton() );
// let jigSawModal = document.querySelector( '#jigsaw-modal' )
// jigSawModal.style.position = 'fixed'
// jigSawModal.style.padding = '14px'
// jigSawModal.style.top = '40vh'
// jigSawModal.style.right = '15px'
// jigSawModal.style.display = 'flex'
// jigSawModal.style.flexFlow = 'column nowrap'
// jigSawModal.style.justifyContent = 'center'
// jigSawModal.style



// let theSetDoNotEmailButton = document.querySelector( '#jigsaw-modal > button#setToDoNotEmail' )
// theSetDoNotEmailButton.addEventListener( 'click', function() {
// 	prepareForDeletion();
// 	this.classList.add( 'do-not-email-clicked' );
// })

/* utility function to highlight the fields on a pardot prospect page */
function highlightBorder( index ) {
	let outputBox = document.querySelectorAll( '.value.breakword' );
	outputBox[index].style.border = '2px solid red'
}


// Your CSS as text
var styles = ''
var styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)


/* Wait until the window loads to execute these */

/**
 * Grab the relevant detail from the Pardot Prospect page to export to an email.
 * @returns object containing relevant details from the pardot prospect page: email, name, company name, link, phone, message, jobTitle
 */
function getDataObject() {
	let allData             = document.querySelectorAll( '.value.breakword' )
	let conMessage          = 'no hard bounce detected'
	let hardBounced         = false
	let jobIndex            = 18
	let contactRequestIndex = 47
	let phoneNumberIndex    = 27
	let formOriginIndex     = 45
	let dispositionIndex    = 41

	/**
	 * If the return email hard bounces
	 * Pardot inserts 2 new items: 'Bounce Date' & 'Bounce Reason'
	 * after the 12th item
	 * therefore any field index would need to + 2 in order to
	 * retrieve the needed data
	 */
	if ( allData[12].textContent.trim().startsWith('Yes') ) {
		hardBounced         = true
		jobIndex            = jobIndex + 2 //20
		contactRequestIndex = contactRequestIndex + 2 //49
		phoneNumberIndex    = phoneNumberIndex + 2 //29
		formOriginIndex     = formOriginIndex + 2 //47
		dispositionIndex    = dispositionIndex + 2 //43
		conMessage          = 'Hard bounce noted in the data, so it may be difficult to pull the right data out, be aware'
	}
	console.log( conMessage )

	let name        = hasContent( allData[0].outerText ) ? allData[0].outerText : '';
	let link        = (2 <= allData[2].childElementCount && allData[2].children[1].hasAttribute('href') ) ? allData[2].children[1].href : '#';
	let email       = hasContent( allData[1].outerText ) ? allData[1].outerText.split('\n')[0].trim() : 'no email given';
	let companyName = hasContent( allData[2].outerText ) ? allData[2].outerText : '';
	let jobTitle    = hasContent( allData[jobIndex].outerText ) ? allData[jobIndex].outerText : '';
	let message     = ( hasContent( allData[contactRequestIndex].outerText ) && 'Contact Request' === allData[contactRequestIndex].outerText ) ? allData[contactRequestIndex - 1].outerText : allData[contactRequestIndex].outerText;
	let disposition = hasContent( allData[41].outerText ) ? allData[41].outerText.trim() : '';
	// shave off any leading '1' at the beginning of a phone number, then set it up as an object
	let phone       = hasContent( allData[phoneNumberIndex].outerText ) && allData[phoneNumberIndex].outerText !== 'N/A' ? allData[phoneNumberIndex].outerText.replace( /\D/g, '' ).slice(-10).match( /^(\d{3})(\d{3})(\d{4})$/ ) : '';
	let formOrigin = ( hasContent( allData[formOriginIndex].outerText ) && 'NMD' === allData[formOriginIndex].outerText.trim() ) ? 'NMD' : 'Jones';
	return { name, link, email, companyName, jobTitle, phone, formOrigin, disposition, message };
}

/** Wait until page full loads to add the 'Go' Button */
setTimeout( () => {

	const customFieldsSection = document.querySelectorAll('.optional')[5]
	const editButton = document.querySelector('[accesskey="e"]')

	const buttonContainer = document.getElementById( 'jigsaw-modal' ).parentElement // the div that holds the jigsaw modal
	buttonContainer.classList.add('buttonContainer')
	buttonContainer.attributeStyleMap.set('position', 'relative')

	buttonContainer.insertAdjacentElement('beforeend', createCopyButton())


	let theCopyButton = document.querySelector( '#copyThis' )
	theCopyButton.addEventListener( 'click', function() {
		let existingStyle = this.getAttribute('style')
		this.setAttribute( 'style', `${existingStyle} color: white !important;`)
		const emailCopy = emailHTML( getDataObject() );
		this.classList.add( 'clicked-button' );
		// pasteboard is now the html for the email, be sure to use the abbreviation setup in Typinator to paste it into a Google Mail Message
		navigator.clipboard.writeText( emailCopy );
		// text indicator that the button has been clicked -- which means the emailHTML should be in the clipboard to use.
		if ( this.textContent.toLowerCase() === 'get' ) this.textContent = 'Go!';

		const isItReviewed = 'mark as unreviewed' !== document.querySelectorAll( '.value.breakword' )[14].querySelectorAll( 'span' )[0].children[0].outerText.toLowerCase().trim();

		if ( ! isItReviewed ) {
			console.log( 'no need to click' )
		}
		// mark prospect as 'reviewed' by clicking - but only if the text isn't 'mark as unreviewed'
		if ( isItReviewed ) {
			setTimeout( () => {
				document.querySelectorAll('.value.breakword')[14].querySelectorAll('span')[0].children[0].click()
			}, 1500)
		}

		/**
		 * Locate the Custom Fields Area in the edit page
		 */
		setTimeout(() => { editButton.click() }, 1000);
		setTimeout(() => { document.querySelectorAll('.optional')[5].click() }, 1000);


	})

}, 3500)


setTimeout( () => {
	console.log('%cpage is fully loaded', 'color: hotpink; border: 4px solid hotpink; font-size: 22px; background: cornflowerblue');
}, 4000)


/**
 * Locate the Custom Fields Area in the edit page
 */
// const customFieldsSection = document.querySelectorAll('.optional')[5]
// const editButton = document.querySelector('[accesskey="e"]')


// editButton.addEventListener('click', () => {
// 	setTimeout(() => {
// 		document.querySelectorAll('.optional')[5].click()
// 	}, 4000);
// } )
