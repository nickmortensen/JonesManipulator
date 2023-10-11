function email( data ) {
let { titleColor, formTitle, prospectName }
return `<style>

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
</table>`

}
