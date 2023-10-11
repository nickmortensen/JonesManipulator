/*
 Last Updated on 2023_07_25
 * @link jonessign.com/meet-the-team
 * scrape relevant data to use in the react version of the site -- it should continue to evolve, so there will come in handy
 * @note that you'll have to visit the link and then run the following in the console area of browser tools
*/

let copyButtonElement = document.createElement('button')
copyButtonElement.className = 'people-copy'

let preElement          = document.createElement('pre')
preElement.style.overflow = 'hidden'
preElement.style.fontSize = '10px'
preElement.style.padding  = '10px'

let targetedArea              = document.querySelector('[data-w-id="73eb4b88-b40c-aef9-9df3-f00659db7407"]')
targetedArea.style.background = '#0273b9'
targetedArea.style.minWidth   = '100%'
targetedArea.style.minHeight  = '440px'
targetedArea.style.color      = '#fff'
targetedArea.style.overflow   = 'hidden'
targetedArea.fontSize = '16px';

let largeScaleArray   = []
let managementArray   = []
let multiSitesArray   = []
let managers          = []
let largescale        = []
let multisites        = []

const managementBlock = document.getElementById('meet-management')
const salesBlock      = document.getElementById('meet-sales')

const managementTeam  = [...managementBlock.querySelectorAll('[role=list] > div')]
const salesAreas      = {
	multiSites: {
		title: 'Multi-Site Branding',
		people: [...salesBlock.querySelectorAll('[class="margin"]')[0].querySelectorAll('[role=list] > div')]
	},
	largeScale: {
		title: 'Large-Scale Custom Projects and Architectural Creations',
		people: [...salesBlock.querySelectorAll('[class="margin"]')[1].querySelectorAll('[role=list] > div')]
	}
}

function teamMemberDetails( entry ) {
	let bioBlock = entry.querySelector('.bio-rich-text')
	let bio      = [...bioBlock.children]
	let bioArray = []
	bio.forEach(item => item.textContent.trim() !== '' && bioArray.push(item.textContent))
	let socialMedia = entry.querySelectorAll( '.team-card-links > a')
	const person    = {
		name: entry.children[1].firstChild.textContent,
		title: entry.children[1].lastChild.textContent,
		avatar: getComputedStyle(entry.firstChild).backgroundImage.slice(5, -2),
		socialMedia: {
			linkedIn: socialMedia[0].getAttribute('href'),
			email: socialMedia[1].getAttribute('href').slice(7),
			telephone: socialMedia[2].getAttribute('href')
		},
		bioArray
	}
	return person
}

salesAreas.multiSites.people.forEach( entry => {
	let dataObject = teamMemberDetails( entry )
	multiSitesArray.push(dataObject)
})

salesAreas.largeScale.people.forEach( entry => {
	let dataObject = teamMemberDetails( entry )
	largeScaleArray.push(dataObject)
})

managementTeam.forEach( entry => {
	let dataObject = teamMemberDetails( entry )
	managementArray.push(dataObject)
})


managementArray.forEach( manager => {
	let {name, title, avatar, socialMedia: { linkedIn, email, telephone}, bioArray} = manager
	let output = `\{
		name: '${name}',
		title: '${title}',
		avatar: '${avatar}',
		linkedIn: '${linkedIn}',
		email: '${email}',
		telephone: '${telephone}',
		bioArray: [
			"${bioArray.join(",\r")}",
		]
	\},`
	managers.push(output)
})

multiSitesArray.forEach( manager => {
	let {name, title, avatar, socialMedia: { linkedIn, email, telephone}, bioArray} = manager
	let output = `\{
		name: '${name}',
		title: '${title}',
		avatar: '${avatar}',
		linkedIn: '${linkedIn}',
		email: '${email}',
		telephone: '${telephone}',
		bioArray: [
			"${bioArray.join(",\n")}",
		]
	\},`
	multisites.push(output)
})
largeScaleArray.forEach( manager => {
	let {name, title, avatar, socialMedia: { linkedIn, email, telephone}, bioArray} = manager
	let output = `\{
		name: '${name}',
		title: '${title}',
		avatar: '${avatar}',
		linkedIn: '${linkedIn}',
		email: '${email}',
		telephone: '${telephone}',
		bioArray: [
			"${bioArray.join(",\r")}",
		]
	\},`
	largescale.push(output)
})


preElement.textContent = `\{
	management: \[
		${managers.join(' ')}
	\],
	salespeople: \{
		multisites: \[
			${multisites.join(' ')}
		\],
		largescale: \[
			${largescale.join(' ')}
		\],
	\}
\}`
targetedArea.insertAdjacentElement('afterbegin', preElement)
targetedArea.insertAdjacentElement('beforebegin', copyButtonElement)


//  SHOULD PROBABLY BE MOVED TO THE JONES MANIPULATOR PAGE
