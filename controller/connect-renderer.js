const connectionEditorListTableEl = document.getElementById('connectionList'),
	tabLinkEls = document.querySelectorAll('.tabLink'),
	tabPanelEls = document.querySelectorAll('.tab-panel'),
	addNewConnectionBtn = document.querySelector('.add-new-connection'),
	addNewConnectionModal = document.getElementById('addConnectionModal'),
	addNewConnectionModalClose = document.getElementById('addConnectionModalClose'),
	addNewConnectionModalTestBtn = document.getElementById('addConnectionModalTest'),
	addNewConnectionModalSaveBtn = document.getElementById('addConnectionModalSave'),
	inputEls = document.querySelectorAll('.modalInput'),
	connectionNameEl = document.getElementById('connectionName'),
	deleteConnectionBtn = document.querySelector('.deleteConnection')

let databases = window.localStorage.getItem('dbNames')


const tabLinkElsFunction = (connectName) => {
	let conNameEl = document.querySelector('.conName')
	tabLinkEls.forEach(tab => {
		tab.addEventListener('click', event => {
			tabLinkElsRemoveActiveClass()
			tabPanelElsRemoveActiveClass()
			tab.parentNode.classList.add('is-active')
			document.querySelector('.' + tab.dataset.id).classList.remove('is-hidden')
		})
	})
}

const tabLinkElsRemoveActiveClass = () => {
	tabLinkEls.forEach(tab => {
		tab.parentNode.classList.remove('is-active')
	})
}

const tabPanelElsRemoveActiveClass = () => {
	tabPanelEls.forEach(panel => {
		panel.classList.add('is-hidden')
	})
}

const setModalInputValue = () => {
	inputEls.forEach(input => {
		input.value = ''
	})
}

const letTestingConnection = () => {
	let canTest = true

	inputEls.forEach(input => {
		if (input.value == '' || input.value == undefined) {
			canTest = false
		}
	})

	return canTest
}

const inputsSetDefault = () => {
	document.querySelector('.conName').innerHTML = ''
	connectionNameEl.value = ''
	document.getElementById('db_name').value = ''
	document.getElementById('original_db_name').value = ''
	document.getElementById('db_host').value = ''
	document.getElementById('db_username').value = ''
	document.getElementById('db_pw').value = ''
	document.getElementById('db_db').value = ''

	document.getElementById('db_name').disabled = true
	document.getElementById('db_host').disabled = true
	document.getElementById('db_username').disabled = true
	document.getElementById('db_pw').disabled = true
	document.getElementById('db_db').disabled = true
	deleteConnectionBtn.disabled = true
	document.getElementById('deleteConnectCheckbox').disabled = true
	document.querySelector('.saveChanges').disabled = true
}

const inputSetValue = (name, datas) => {
	document.querySelector('.conName').innerHTML = name
	connectionNameEl.value = name
	document.getElementById('db_name').value = name
	document.getElementById('original_db_name').value = name
	document.getElementById('db_host').value = datas.host
	document.getElementById('db_username').value = datas.user
	document.getElementById('db_pw').value = datas.password
	document.getElementById('db_db').value = datas.database

	document.getElementById('db_name').disabled = false
	document.getElementById('db_host').disabled = false
	document.getElementById('db_username').disabled = false
	document.getElementById('db_pw').disabled = false
	document.getElementById('db_db').disabled = false
	document.getElementById('deleteConnectCheckbox').disabled = false
	document.querySelector('.saveChanges').disabled = false
}

const connectionListRendering = () => {
	connectionEditorListTableEl.innerHTML = ''
	databases = window.localStorage.getItem('dbNames')
	dbs = databases.split(',')

	dbs.sort().forEach(dbName => {
		connectionEditorListTableEl.innerHTML += '<tr><td data-name="' + dbName + '">' + dbName + '</td></tr>'
	})

	const dbConnectNameEls = document.querySelectorAll('.connection-grid > .grid-item-1 > table > #connectionList > tr > td')

	dbConnectNameEls.forEach(item => {
		item.addEventListener('click', event => {
			dbConnectNameEls.forEach(td => {
				td.classList.remove('is-active')
			})
			let storedConnection = window.localStorage.getItem(item.dataset.name)
			if (storedConnection) {
				item.classList.add('is-active')
				let data = JSON.parse(storedConnection)
				if (item.dataset.name) {
					tabLinkElsFunction(item.dataset.name)
					inputSetValue(item.dataset.name, data)
				}
			} else {
				inputsSetDefault()
			}
		})
	})
}

document.getElementById('deleteConnectCheckbox').addEventListener('click', event => {
	deleteConnectionBtn.disabled = (document.getElementById('deleteConnectCheckbox').checked ? false : true)
})

document.querySelector('.saveChanges').addEventListener('click', event => {
	let data = {
		'host': document.getElementById('db_host').value,
		'user': document.getElementById('db_username').value,
		'password': document.getElementById('db_pw').value,
		'database': document.getElementById('db_db').value
	}

	let newName = document.getElementById('db_name').value,
		originalName = document.getElementById('original_db_name').value

	if (newName == originalName) {
		window.localStorage.removeItem(originalName.value)
		window.localStorage.setItem(newName, JSON.stringify(data))
	} else {
		let newList = ''
		dbs = databases.split(',')
		dbs.sort().forEach((item, i) => {
			if (item === originalName) {
				window.localStorage.removeItem(originalName.value)
				newList += (newList == '' ? newName : ',' + newName)
			} else {
				newList += (newList == '' ? item : ',' + item)
			}
		})
		window.localStorage.setItem('dbNames', newList)
		window.localStorage.setItem(newName, JSON.stringify(data))
	}
	alert("Connection updated!")
	location.reload()
})

deleteConnectionBtn.addEventListener('click', event => {
	let newList = ''

	dbs = databases.split(',')
	dbs.sort().forEach((item, i) => {
		if (item === connectionNameEl.value) {
			window.localStorage.removeItem(connectionNameEl.value)
		} else {
			newList += (newList == '' ? item : ',' + item)
		}
	})
	window.localStorage.setItem('dbNames', newList)
	location.reload()
})

addNewConnectionBtn.addEventListener('click', event => {
	setModalInputValue()
	addNewConnectionModal.classList.add('is-active')
})

addNewConnectionModalClose.addEventListener('click', event => {
	setModalInputValue()
	addNewConnectionModal.classList.remove('is-active')
})

inputEls.forEach(input => {
	input.addEventListener('keyup', event => {
		addNewConnectionModalTestBtn.disabled = (letTestingConnection() ? false : true)
	})
})

addNewConnectionModalTestBtn.addEventListener('click', event => {
	if (letTestingConnection()) {
		let data = {
			'host': document.getElementById('add_db_host').value,
			'user': document.getElementById('add_db_username').value,
			'password': document.getElementById('add_db_pw').value,
			'database': document.getElementById('add_db_db').value
		}
		window.api.testConnection(data)
			.then((response) => {
				alert(response.message)
				addNewConnectionModalSaveBtn.disabled = (response.res != 1)
			})
	} else {
		alert('You need to fill all the field before testing the connection!')
	}
})

addNewConnectionModalSaveBtn.addEventListener('click', event => {
	databases = window.localStorage.getItem('dbNames')
	if (databases !== null) {
		if (databases.split(',').find(el => el == document.getElementById('add_db_name').value) !== undefined) {
			alert("Error! The name: " + document.getElementById('add_db_name').value + ", is already used!")
		} else {
			let data = {
				'host': document.getElementById('add_db_host').value,
				'user': document.getElementById('add_db_username').value,
				'password': document.getElementById('add_db_pw').value,
				'database': document.getElementById('add_db_db').value
			}

			window.localStorage.setItem('dbNames', databases + ',' + document.getElementById('add_db_name').value)
			window.localStorage.setItem(document.getElementById('add_db_name').value, JSON.stringify(data))
			databases = window.localStorage.getItem('dbNames')
			alert("Connection saved!")
			location.reload()
		}
	} else {
		let data = {
			'host': document.getElementById('add_db_host').value,
			'user': document.getElementById('add_db_username').value,
			'password': document.getElementById('add_db_pw').value,
			'database': document.getElementById('add_db_db').value
		}

		window.localStorage.setItem('dbNames', document.getElementById('add_db_name').value)
		window.localStorage.setItem(document.getElementById('add_db_name').value, JSON.stringify(data))
		databases = window.localStorage.getItem('dbNames')
		alert("Connection saved!")
		setModalInputValue()
		addNewConnectionModalTestBtn.disabled = true
		addNewConnectionModalSaveBtn.disabled = true
		addNewConnectionModal.classList.remove('is-active')
		connectionListRendering()
	}
})

if (databases !== null) {
	connectionListRendering()
} else {
	connectionEditorListTableEl.innerHTML = '<tr><th>No Stored Connection</th></tr>'
}
