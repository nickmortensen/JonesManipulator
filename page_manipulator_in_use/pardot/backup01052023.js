/**
 * Page Manipulator browser extension script for use with Pardot Prospect Review pages.
 * Last Updated on 2022_08_02
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
let hasContent = x => typeof x !== "undefined";
/**
 * Format a 10 digit phone number that is all digits.
 *
 * @param {string} phone The unformatted phone number.
 * @returns {string}     Properly formatted phone number  with area code. Example: '(920) 490-4190'
 */
const phoneFormat = phone => phone.replace( /\D/g, '' ).slice(-10).match( /^(\d{3})(\d{3})(\d{4})$/ );

/**
 * Grab the relevant detail from the Pardot Prospect page to export to an email.
 * @returns object containing relevant details from the pardot prospect page: email, name, company name, link, phone, message, jobTitle
 */
function getDataObject() {
	let allData     = document.querySelectorAll('.value.breakword')
	let name        = hasContent( allData[0].outerText ) ? allData[0].outerText : '';
	let link        = (2 <= allData[2].childElementCount && allData[2].children[1].hasAttribute('href') ) ? allData[2].children[1].href : '#';
	// let email       = allData[1].children[0].children[0].innerText
	let email       = hasContent( allData[1].outerText )  ? allData[1].outerText.split('\n')[0] : 'no email given';
	let companyName = hasContent( allData[2].outerText )  ? allData[2].outerText : '';
	let jobTitle    = hasContent( allData[18].outerText ) ? allData[18].outerText : '';
	let message     = ( hasContent( allData[48].outerText ) && 'Contact Request' === allData[48].outerText ) ? allData[47].outerText : allData[48].outerText;
	let disposition = hasContent( allData[41].outerText ) ? allData[41].outerText.trim() : '';
	// shave off any leading '1' at the beginning of a phone number, then set it up as an object
// let phoneIndex = 27;
let phoneIndex = 27;
	let phone       = hasContent( allData[phoneIndex].outerText ) ? allData[phoneIndex].outerText.replace( /\D/g, '' ).slice(-10).match( /^(\d{3})(\d{3})(\d{4})$/ ) : '';

	let formOrigin = ( hasContent( allData[45].outerText ) && 'NMD' === allData[45].outerText.trim() ) ? 'NMD' : 'Jones';
	return { name, link, email, companyName, jobTitle, phone, formOrigin, disposition, message };
}

/**
 * Builds the HTML email in table form, must still run it through Typinator by using the npc key combination -- "New Prospect Card".

 * @param {object} dataObject An object containing the relevantdata -- in this case the object is built using the getDataObject() function.
 * @returns string of Table HTML for formatting through typinator as 'formatted text' and pasting into a gmail.
 */
function emailHTML( dataObject ) {
	let formTitle;
	let titleColor = '#0273b9';
	let { name, link, email, companyName, jobTitle, phone, formOrigin, disposition, message } = dataObject;

console.log( phone )

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



return `<table id="theTable" style="background: white; border: 1px solid #efefef; box-shadow: 4px 4px 4px 1px #eff0fc;">
	<tbody id="theTableBody">
	<tr class="initial-row" colspan="3" style="line-height: 1.35; padding: 12px;">
		<td colspan="3" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-color: rgba(0,0,0,0.05);">
		<h3 id="theFormTitle" style="color: ${titleColor}; font-family: 'architects daughter', 'Lucida Sans Unicode', monospace, sans-serif; font-size: 34px; font-style: italic; font-weight: 900; letter-spacing: 2px; line-height: 1.6; text-align: center; text-shadow: 1px 1px 1px #515153; text-transform: uppercase;">${formTitle}</h3>
		</td>
	</tr>
	<tr style="line-height: 1.35; padding: 12px;">
		<td class="before" style="border-bottom: 1px solid rgba(100,149,237,0.5); width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; padding-left: 8px; padding-right: 5px; text-align: right;">Name:</td>
		<td id="theProspectName" style="border-bottom: 1px solid rgba(100,149,237,0.5); color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 24px; line-height: 1.45; max-width: 820px; padding-left: 18px; padding-right: 10px;">
		${name}</td>
	</tr>
	<tr style="line-height: 1.35; padding: 12px;">
		<td class="before" style="border-bottom: 1px solid rgba(100,149,237,0.5); width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; padding-left: 8px; padding-right: 5px; text-align: right;">Company:</td>
		<td id="theCompanyName" style="border-bottom: 1px solid rgba(100,149,237,0.5); color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 24px; line-height: 1.45; max-width: 820px; padding-left: 18px; padding-right: 10px;">
		<a id="theCompanyLink" href="${link}" style="text-decoration: none;">${companyName}</a></td>
	</tr>
	<tr style="line-height: 1.35; padding: 12px;">

		<td class="before" style="border-bottom: 1px solid rgba(100,149,237,0.5); width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; padding-left: 8px; padding-right: 5px; text-align: right;">Position:</td>
		<td id="theProspectTitle" style="border-bottom: 1px solid rgba(100,149,237,0.5); color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 24px; line-height: 1.45; max-width: 820px; padding-left: 18px; padding-right: 10px;">
		${jobTitle}</td>
	</tr>
	<tr style="line-height: 1.35; padding: 12px;">
		<td class="before" style="border-bottom: 1px solid rgba(100,149,237,0.5); width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; padding-left: 8px; padding-right: 5px; text-align: right;">Email:</td>
		<td id="theProspectEmail" style="border-bottom: 1px solid rgba(100,149,237,0.5); color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 24px; line-height: 1.45; max-width: 820px; padding-left: 18px; padding-right: 10px;">
		<a href="mailto:${email}" style="text-decoration: none;">${email}</a></td>
	</tr>
	<tr style="line-height: 1.35; padding: 12px;">
		<td class="before" style="border-bottom: 1px solid rgba(100,149,237,0.5); width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label" style="border-bottom: 1px solid rgba(100,149,237,0.5); border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; padding-left: 8px; padding-right: 5px; text-align: right;">Telephone:</td>
		<td id="theProspectPhoneNumber" style="border-bottom: 1px solid rgba(100,149,237,0.5); color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 24px; line-height: 1.45; max-width: 820px; padding-left: 18px; padding-right: 10px;"><a href="tel:+1${phone[0]}" style="text-decoration: none;">(${phone[1]}) ${phone[2]}-${phone[3]}</a></td>
	</tr>
	<tr class="message" style="line-height: 1.35; padding: 12px;">
		<td class="before" style="border-bottom: none; font-size: 20px; line-height: 1.7; width: 20px;">
		<div class="dot" style="background: unset; border: 2px solid #efefef; border-radius: 50%; margin-left: 4px; max-width: 15px; min-height: 15px; vertical-align: middle;"></div>
		</td>
		<td class="label vertical" style="border-bottom: none; border-right: 1px solid #ff9d9d; color: #737478; font-family: monospace, sans-serif; font-size: 20px; font-weight: 400; letter-spacing: 1.5px; line-height: 1.7; padding-left: 8px; padding-right: 5px; text-align: right; vertical-align: top;">Message:</td>
		<td id="theProspectMessage" style="border-bottom: none; color: #5a5b5e; font-family: 'architects daughter', monospace, sans-serif; font-size: 20px; font-style: italic; line-height: 1.7; max-width: 820px; padding-left: 18px; padding-right: 10px;">
		<em style="font-style: italic;"> ${message}</em>
		</td>
	</tr>
	</tbody>
</table>`;
}

/**
 * Place an HTML button that when clicked will give me the html table for the email I wish to create based on the relevant data within the page.
 * @returns a string of html that can be pasted as formatted text into a gmail.
 */
function createCopyButton() {
	let copyButton         = document.createElement( 'button' );
	copyButton.id          = 'copyThis';
	copyButton.textContent = 'GET';
	return copyButton;
}


function clickEventHandler( event ) {
	console.log('BUTTON CLICKED!');
	event.target.classList.add( 'clicked-button' )
}

document.querySelector( '#jigsaw-modal' ).append( createCopyButton() ); // put the copy button into the DOM

let theCopyButton = document.querySelector( '#jigsaw-modal > button#copyThis' )
theCopyButton.addEventListener( 'click', function() {
	const emailCopy = emailHTML( getDataObject() );
	this.classList.add( 'clicked-button' );
	// pasteboard is now the text of the html for the email, be sure to use the abbreviation setup in Typinator to paste it into a Google Mail Message
navigator.clipboard.writeText( emailCopy );
	navigator.clipboard.write( emailCopy );
	// text indicator that the button has been clicked -- which means the emailHTML should be in the clipboard to use.
	if ( this.textContent.toLowerCase() === 'get' ) this.textContent = 'Go!';
	let isItReviewed = 'mark as unreviewed' !== document.querySelectorAll('.value.breakword')[14].querySelectorAll('span')[0].children[0].outerText.toLowerCase().trim();


	if (! isItReviewed ) {
		console.log('no need to click')
	}
	// mark prospect as 'reviewed' by clicking - but only if the text isn't 'mark as unreviewed'
	if ( isItReviewed ) {

		setTimeout( () => {
			document.querySelectorAll('.value.breakword')[14].querySelectorAll('span')[0].children[0].click()
		}, 3000)
	}

})

function setClipboard( messageHTML ) {
    const type = 'text/plain'
    const blob = new Blob( [messageHTML], { type } );
    const data = [new ClipboardItem( { [type]: blob } )]
}

