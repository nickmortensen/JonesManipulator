let logStyle = 'color: goldenrod; backgroud: green; font-weight: bolder; font-size: 1.4em; padding: 4px 10px; border: 2px solid goldenrod'
let logMessage = '%cYou are on an Ashwaubenon site'

function isDefined( a ) {
    let undefined = typeof a === 'undefined'
    return ! undefined
}

let logStyle = 'color: goldenrod; backgroud: green; font-weight: bolder; font-size: 1.4em; padding: 4px 10px; border: 2px solid goldenrod'

if ( !isDefined( logStyle ) ) {
    logStyle = 'color: goldenrod; backgroud: green; font-weight: bolder; font-size: 1.4em; padding: 4px 10px; border: 2px solid goldenrod'
}

var thisPage = new URL(document.location.href)



// const whichPage = document.location.href => {
//   let lunchSite = 'https://ashwaubenon.familyportal.cloud'
// }

let logMessage = '%cYou are on an Ashwaubenon site'
console.log(logMessage, logStyle)


/* Fee Payment Page Actions
if ( document.location.href === 'https://funding') {

}
let fundingArea = document.querySelectorAll('.jss106')[2]
fundingArea.parentElement.style.display = 'none'



let alertArea = document.querySelectorAll('.alert')[0]
alertArea.style.backgroundColor = 'rgba(0 115 24/0.6)'

let linkToLunchFunding = document.createElement('a')

linkToLunchFunding.textContent = 'LUNCH SITE'
linkToLunchFunding.setAttribute('href', lunchSite)

alertArea.insertAdjacentElement('beforeend', linkToLunchFunding)
*/


/**
 * POWER SCHOOL DOES NOT DO AUTOSIGNIN
 */
 const isPowerSchool = () => {
    let thisSite = new URL( document.location.href )
    return thisSite.hostname === 'ashwaubenon.powerschool.com'
 }


 const isSignIn = () => {
    let thisSite = new URL( document.location.href )
    let result = false
    if ( isPowerSchool() ) {
       result =  '/public/home.html' === thisSite.pathname
    }
    return result
 }

if ( 'https://ashwaubenon.powerschool.com/public/home.html' === document.location.href ) {
    let message = '%clogging into the Power School Signin Page'
    console.log(message, logStyle)
    // find the two input fields
    let usernameField = document.querySelector('#fieldAccount')
    usernameField.setAttribute('autocomplete', 'username')
    usernameField.setAttribute('value', 'nmortensen')

    let passwordField = document.querySelector('#fieldPassword')
    passwordField.setAttribute('autocomplete', 'current-password')
    passwordField.setAttribute('value', 'G0at-sneaky-dryer')

    let signInButton = document.getElementById('btn-enter-sign-in')
    signInButton.click()
}
