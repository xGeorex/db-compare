const toggleDarkModeBtn = document.getElementById('toggle-dark-mode')
const resetToSystemBtn = document.getElementById('reset-to-system')
const clearConnectBtn = document.getElementById('clear-connect')

clearConnectBtn.addEventListener('click', event => {
	try {
		window.localStorage.clear()
	} catch (e) {
		console.log(e)
	}
	alert("connection removed!")
	location.reload()
})

toggleDarkModeBtn.addEventListener('click', event => {
	window.api.toggle().then(res => {
		toggleDarkModeBtn.innerHTML = res ? '<span class="symbol"><i class="fa-solid fa-sun"></i></span><span>Light</span>' : '<span class="symbol"><i class="fa-solid fa-moon"></i></span><span>Dark</span>'
		let theme = res ? 'Dark' : 'Light'
		window.localStorage.setItem('theme', theme)
	})
})

resetToSystemBtn.addEventListener('click', event => {
	window.api.system().then(() => {
		toggleDarkModeBtn.innerHTML = 'System'
		window.localStorage.setItem('theme', 'System')
		alert("Theme set back to System")
	})
})

let theme = window.localStorage.getItem('theme')
if (theme == 'Dark') {
	toggleDarkModeBtn.innerHTML = '<span class="symbol"><i class="fa-solid fa-sun"></i></span><span>Light</span>'
} else if (theme == 'Light') {
	toggleDarkModeBtn.innerHTML = '<span class="symbol"><i class="fa-solid fa-moon"></i></span><span>Dark</span>'
}