const connect1 = document.getElementById('connect1'),
	connect2 = document.getElementById('connect2'),
	connectModal = document.getElementById('connection1Modal'),
	loadModal = document.getElementById('loadingModal'),
	connectModalClose = document.getElementById('connection1ModalClose'),
	connectModalConnect = document.getElementById('connection1ModalConnect'),
	compareButtonEl = document.getElementById('compare'),
	resultBoxEl = document.getElementById('result'),
	databaseSelectDiv = document.getElementById('database_select'),
	databaseSelect = document.getElementById('databases')

let connect1Tables = '',
	connect2Tables = '',
	db1NameEl = document.getElementById('db1'),
	db2NameEl = document.getElementById('db2')
databases = window.localStorage.getItem('dbNames')

const changeVisibility = (el) => {
	document.querySelectorAll('.navButton').forEach(btn => {
		btn.classList.remove('is-active')
	})
	el.classList.add('is-active')

}

const removeAllSelection = () => {
	let checkboxEls = document.querySelectorAll('.connect1Tables')

	checkboxEls.forEach(checkboxEl => {
		checkboxEl.checked = false
	})
}

//structure and date action

const viewTablesDisable = (action) => {
	document.querySelectorAll('.viewTable').forEach(checkbox => {
		checkbox.checked = false
		checkbox.disabled = action
	})
}

document.querySelector('.compareStructure').addEventListener('click', () => {
	viewTablesDisable(false)
})

document.querySelector('.compareData').addEventListener('click', () => {
	viewTablesDisable(true)
})


const changeCompareOption = (param) => {
	if (param == 'let') {
		document.querySelector('.compareStructure').disabled = false
		document.querySelector('.compareData').disabled = false
		document.querySelector('.compareData').checked = true
		viewTablesDisable(true)
	} else {
		document.querySelector('.compareStructure').disabled = true
		document.querySelector('.compareStructure').checked = true
		document.querySelector('.compareData').disabled = true
		viewTablesDisable(false)
	}
}

const drawDataResult = (array) => {
	resultBoxEl.innerHTML = 'Data compare result'
	window.api.compareTablesData(array).then(ret => {
		let dataResults = ''
		if (ret.length == 0) {
			resultBoxEl.innerHTML = 'Data compare show no difference'
		} else {
			ret.forEach((table, i) => {
				if (table.data.delete.length == 0 && table.data.update.length == 0 && table.data.insert.length == 0) {
					resultTitle = '<div class="grid-item1"><code>' + table.table + '</code></div>'
					dataResults += '<div class="container"><div class="" data-iterator="' + i + '"><div class="grid-wrapper">' + resultTitle + '</div><pre>No Difference</pre></div>'
				} else {
					let resultText = '',
						resultTitle = '<div class="grid-item1"><code>' + table.table + '</code></div>'
					resultStart = ''
					if (table.data.delete.length > 0) {
						resultStart += '<button data-pointer="' + table.table + '-delete" class="copyDelete button is-light is-info is-small"><span class="icon"><i class="fa-solid fa-copy"></i></span><span>Copy Delete Query</span></button>'
						resultText += '<div><pre class="expandable is-flex" data-action="' + table.table + '-delete"><div class="resultTitle">' + table.table + ' DELETE: </div><div><span class="imageHolder"><img class="up-arrow" src="../images/angle-down.svg"></span></div></pre></div><pre class="' + table.table + '-delete ' + table.table + '-all sqlText closed sqlDelete sqlResult' + i + ' sqlDelete' + i + '">'
						table.data.delete.forEach(item => {
							resultText += item
						})
						resultText += '</pre>'
					}
					if (table.data.update.length > 0) {
						resultStart += '<button data-pointer="' + table.table + '-update" class="copyUpdate button is-light is-info is-small"><span class="icon"><i class="fa-solid fa-copy"></i></span><span>Copy Update Query</span></button>'
						resultText += '<div><pre class="expandable is-flex" data-action="' + table.table + '-update"><div class="resultTitle">' + table.table + ' UPDATE: </div><div><span class="imageHolder"><img class="up-arrow" src="../images/angle-down.svg"></span></div></pre></div><pre class="' + table.table + '-update ' + table.table + '-all sqlText closed sqlUpdate sqlResult' + i + ' sqlUpdate' + i + '">'
						table.data.update.forEach(item => {
							resultText += item
						})
						resultText += '</pre>'
					}
					if (table.data.insert.length > 0) {
						resultStart += '<button data-pointer="' + table.table + '-insert" class="copyInsert button is-light is-info is-small"><span class="icon"><i class="fa-solid fa-copy"></i></span><span>Copy Insert Query</span></button>'
						resultText += '<div><pre class="expandable is-flex" data-action="' + table.table + '-insert"><div class="resultTitle">' + table.table + ' INSERT: </div><div><span class="imageHolder"><img class="up-arrow" src="../images/angle-down.svg"></span></div></pre></div><pre class="' + table.table + '-insert ' + table.table + '-all sqlText closed sqlInsert sqlResult' + i + ' sqlInsert' + i + '">'
						table.data.insert.forEach(item => {
							resultText += item
						})
						resultText += '</pre>'
					}

					if (table.data.delete.length > 0 || table.data.update.length > 0 || table.data.insert.length > 0) {
						resultStart += '<button data-pointer="' + table.table + '-all" class="copyAll button is-light is-info is-small"><span class="icon"><i class="fa-solid fa-copy"></i></span><span>Copy All Query</span></button>'
					}

					dataResults += '<div class="container"><div class="" data-iterator="' + i + '"><div class="grid-wrapper">' + resultTitle + '<div class="grid-item2 has-text-right">' + resultStart + '</div></div>' + resultText + '</div>'
					dataResults += '<hr>'
				}

			})
			resultBoxEl.innerHTML += dataResults
		}
		loadModal.classList.remove('is-active')

		let expandableEls = document.querySelectorAll('.expandable')

		expandableEls.forEach(el => {
			el.addEventListener('click', ev => {
				let imgEl = el.querySelector('.imageHolder > img')
				let collapsableEl = document.querySelector('.' + el.dataset.action)
				if (imgEl.classList.contains("up-arrow")) {
					imgEl.classList.remove("up-arrow")
					imgEl.classList.add("down-arrow")
					collapsableEl.classList.remove("closed")
					collapsableEl.classList.add("open")
				} else {
					imgEl.classList.remove("down-arrow")
					imgEl.classList.add("up-arrow")
					collapsableEl.classList.remove("open")
					collapsableEl.classList.add("closed")
				}
			})
		})

		let copyDeleteButtonEls = document.querySelectorAll('.copyDelete')
		let copyUpdateButtonEls = document.querySelectorAll('.copyUpdate')
		let copyInsertButtonEls = document.querySelectorAll('.copyInsert')
		let copyAllButtonEls = document.querySelectorAll('.copyAll')

		copyDeleteButtonEls.forEach(delBtn => {
			delBtn.addEventListener('click', ev => {
				let selectedText = document.querySelector('.' + delBtn.dataset.pointer + ' > pre')
				selectedText.focus()
				navigator.clipboard.writeText(selectedText.innerHTML)
					.then(() => {
						alert('The query is Copied!')
					})
					.catch((err) => console.log(err))
			})
		})

		copyUpdateButtonEls.forEach(updBtn => {
			updBtn.addEventListener('click', ev => {
				let selectedText = document.querySelector('.' + updBtn.dataset.pointer + ' > pre')
				selectedText.focus()
				navigator.clipboard.writeText(selectedText.innerHTML)
					.then(() => {
						alert('The query is Copied!')
					})
					.catch((err) => console.log(err))
			})
		})

		copyInsertButtonEls.forEach(insBtn => {
			insBtn.addEventListener('click', ev => {
				let selectedText = document.querySelector('.' + insBtn.dataset.pointer + ' > pre')
				selectedText.focus()
				navigator.clipboard.writeText(selectedText.innerHTML)
					.then(() => {
						alert('The query is Copied!')
					})
					.catch((err) => console.log(err))
			})
		})

		copyAllButtonEls.forEach(cpAllBtn => {
			cpAllBtn.addEventListener('click', ev => {
				let selectedTextEls = document.querySelectorAll('.' + cpAllBtn.dataset.pointer + ' > pre'),
					textHolder = ''

				selectedTextEls.forEach(el => {
					textHolder += el.innerHTML + "\r\n"
				})
				// textHolder.focus()
				navigator.clipboard.writeText(textHolder)
					.then(() => {
						alert('The query is Copied!')
					})
					.catch((err) => console.log(err))
			})
		})
	})
}

const drawResult = (array) => {
	if (array.length > 0) {
		window.api.compareTables(array).then(ret => {
			resultBoxEl.innerHTML = ''
			if (ret.length < 1) {
				resultBoxEl.innerHTML += '<div>No differences</div>'
			} else {
				resultBoxEl.innerHTML += '<div><button class="copyAllButton button is-light is-info is-small"><span class="icon"><i class="fa-solid fa-copy"></i></span> <span>Copy All</span></button></div><hr>'
				let fullResult = ''
				ret.forEach(res => {
					fullResult += res + '<hr>'
				})
				resultBoxEl.innerHTML += fullResult

				document.querySelectorAll('.copyTable').forEach(tableEl => {
					tableEl.addEventListener('click', e => {
						let tableTextEls = document.querySelectorAll('.' + tableEl.dataset.table),
							tableText = ''

						tableTextEls.forEach((el) => {
							tableText += el.innerHTML + "\r\n"
						})
						navigator.clipboard.writeText(tableText).then(() => {
							alert('Selected queries are Copied!')
						})
							.catch((err) => console.log(err))
					})
				})

				document.querySelector('.copyAllButton').addEventListener('click', ev => {
					let mysqlTextEls = document.querySelectorAll('.mysqlText'),
						texts = ''
					mysqlTextEls.forEach(item => {
						texts += item.innerHTML + "\r\n"
					})
					navigator.clipboard.writeText(texts).then(() => {
						alert('All query are Copied!')
					})
						.catch((err) => console.log(err))
				})
			}
		})
	} else {
		resultBoxEl.innerHTML = 'Select a table to compare'
	}
}

const drawConnection1 = (param) => {
	document.getElementById('wrapper').innerHTML = '<div class="grid-item1"></div>'
	document.getElementById('wrapper').innerHTML += '<div class="grid-item2">Preparing to compare ...</div>'
	connect2.disabled = false
	connect1.disabled = false

	compareButtonEl.disabled = true
	changeCompareOption('deny')
	document.querySelectorAll('.navButton').forEach(navBtn => {
		navBtn.disabled = true
	})
}

const drawConnection2 = (param2) => {
	document.getElementById('wrapper').innerHTML = ''
	let control = param2.control,
		data2 = param2.table2,
		data1 = param2.table1

	control.forEach(item => {
		let row = ''
		let cssClass = ''
		let iconImage = ''
		let checkboxClass = ''
		let found1 = data1.find(el => el.table == item)
		let found2 = data2.find(el => el.table == item)
		if (found1 !== undefined && found2 !== undefined) {
			if ((found1.hash !== found2.hash) && (found1.table === found2.table)) {
				cssClass = 'has-background-warning diff '
				iconImage = '<span class="icon"><i class="fa-solid fa-not-equal"></i></span>'
			} else if ((found1.hash === found2.hash) && (found1.table === found2.table)) {
				cssClass = 'has-background-success same '
				iconImage = '<span class="icon"><i class="fa-solid fa-equals"></i></span>'
			}
		} else {
			cssClass = 'diff orphan '
		}

		if (item.match(/view_/)) {
			checkboxClass = ' viewTable'
		}

		if (found1) {
			row += '<div class="resultRow ' + cssClass + 'grid-item1"><input type="checkbox" id="' + item + '" data-table="' + item + '" class="connect1Tables is-primary' + checkboxClass + '"></div>'
			row += '<div class="resultRow ' + cssClass + 'grid-item2"><label for="' + item + '">' + item + '</label></div>'
		} else {
			row += '<div class="resultRow ' + cssClass + 'grid-item1"></div>'
			row += '<div class="resultRow ' + cssClass + 'grid-item2"></div>'
		}
		if (found2) {
			row += '<div class="resultRow ' + cssClass + 'grid-item1"><label for="' + item + '">' + iconImage + '</label></div>'
			row += '<div class="resultRow ' + cssClass + 'grid-item2"><label for="' + item + '">' + item + '</label></div>'
		} else {
			row += '<div class="resultRow ' + cssClass + 'grid-item1">' + (found1 !== undefined ? '<label for="' + item + '">&nbsp;&nbsp;</label>' : '') + '</div>'
			row += '<div class="resultRow ' + cssClass + 'grid-item2">' + (found1 !== undefined ? '<label for="' + item + '">&nbsp;&nbsp;</label>' : '') + '</div>'
		}
		document.getElementById('wrapper').innerHTML += row
	})

	connect2.disabled = false
	compareButtonEl.disabled = false
	document.querySelectorAll('.navButton').forEach(navBtn => {
		navBtn.disabled = false
		navBtn.addEventListener('click', ev => {
			changeVisibility(navBtn)
			if (navBtn.dataset.action == 'showAll') {
				document.querySelectorAll('.resultRow').forEach(row => {
					row.classList.remove('is-hidden')
				})
				changeCompareOption('deny')
				removeAllSelection()
			} else if (navBtn.dataset.action == 'showDiff') {
				document.querySelectorAll('.resultRow').forEach(row => {
					row.classList.remove('is-hidden')
				})
				document.querySelectorAll('.same').forEach(row => {
					row.classList.add('is-hidden')
				})
				changeCompareOption('deny')
				removeAllSelection()
			} else if (navBtn.dataset.action == 'showOrphan') {
				document.querySelectorAll('.resultRow').forEach(row => {
					row.classList.add('is-hidden')
				})
				document.querySelectorAll('.orphan').forEach(row => {
					row.classList.remove('is-hidden')
				})
				changeCompareOption('deny')
				removeAllSelection()
			} else if (navBtn.dataset.action == 'showEq') {
				document.querySelectorAll('.resultRow').forEach(row => {
					row.classList.remove('is-hidden')
				})
				document.querySelectorAll('.diff').forEach(row => {
					row.classList.add('is-hidden')
				})
				changeCompareOption('let')
				removeAllSelection()
			}
		})
	})

}

const clearModalImputs = () => {
	document.getElementById('_').value = ''
	document.getElementById('db_name').value = ''
	document.getElementById('db_host').value = ''
	document.getElementById('db_username').value = ''
	document.getElementById('db_pw').value = ''
	document.getElementById('db_db').value = ''
}

connect1.addEventListener('click', event => {
	databaseSelectDiv.style.display = 'none'
	databases = window.localStorage.getItem('dbNames')
	if (databases !== null) {
		let dbs = databases.split(',')
		databaseSelect.innerHTML = '<option>-SELECT-CONNECTION-</option>'
		dbs.sort().forEach(item => {
			if (item !== '') {
				databaseSelect.innerHTML += '<option value="' + item + '">' + item + '</option>'
			}
		})
		databaseSelectDiv.style.display = 'block'
	}
	connectModal.classList.add('is-active')
	document.getElementById('_').value = 'connect1'
})

connect2.addEventListener('click', async () => {
	databaseSelectDiv.style.display = 'none'
	// databases = window.localStorage.getItem('dbNames')
	if (databases !== null) {
		let dbs = databases.split(',')
		databaseSelect.innerHTML = '<option>-SELECT-CONNECTION-</option>'
		dbs.sort().forEach(item => {
			if (item !== '') {
				databaseSelect.innerHTML += '<option value="' + item + '">' + item + '</option>'
			}
		})
		databaseSelectDiv.style.display = 'block'
	}

	connectModal.classList.add('is-active')
	document.getElementById('_').value = 'connect2'
})

connectModalClose.addEventListener('click', event => {
	connectModal.classList.remove('is-active')
	clearModalImputs()
})

databaseSelect.addEventListener('change', event => {
	if (databaseSelect.value !== '') {
		let storedConnection = window.localStorage.getItem(databaseSelect.value)
		if (storedConnection) {
			let data = JSON.parse(storedConnection)
			document.getElementById('db_name').value = databaseSelect.value
			document.getElementById('db_host').value = data.host
			document.getElementById('db_username').value = data.user
			document.getElementById('db_pw').value = data.password
			document.getElementById('db_db').value = data.database
		} else {
			document.getElementById('db_name').value = ''
			document.getElementById('db_host').value = ''
			document.getElementById('db_username').value = ''
			document.getElementById('db_pw').value = ''
			document.getElementById('db_db').value = ''
		}
	} else {
		document.getElementById('db_name').value = ''
		document.getElementById('db_host').value = ''
		document.getElementById('db_username').value = ''
		document.getElementById('db_pw').value = ''
		document.getElementById('db_db').value = ''
	}
})

connectModalConnect.addEventListener('click', event => {
	event.preventDefault()
	event.stopPropagation()
	let dbName = '',
		connectParam = document.getElementById('_').value

	let data = {
		'host': document.getElementById('db_host').value,
		'user': document.getElementById('db_username').value,
		'password': document.getElementById('db_pw').value,
		'database': document.getElementById('db_db').value
	}
	if (document.getElementById('db_name').value != '' && document.getElementById('db_db').value != '') {
		dbName = document.getElementById('db_name').value + ' (' + document.getElementById('db_db').value + ')'
	} else {
		dbName = '--NO CONNECTION--'
	}
	connectModal.classList.remove('is-active')

	//add to storage if not inside
	if (document.getElementById('db_host').value != '' && document.getElementById('db_username').value != '' && document.getElementById('db_pw').value != '' && document.getElementById('db_db').value != '') {
		if (databases === null) {
			window.localStorage.setItem('dbNames', document.getElementById('db_name').value)
			window.localStorage.setItem(document.getElementById('db_name').value, JSON.stringify(data))
		} else if (databases.search(document.getElementById('db_name').value) < 0) {
			databases = window.localStorage.getItem('dbNames')
			window.localStorage.setItem('dbNames', databases + ',' + document.getElementById('db_name').value)
			window.localStorage.setItem(document.getElementById('db_name').value, JSON.stringify(data))
		} else {
			//if connection edited
			let storedConnection = window.localStorage.getItem(document.getElementById('db_name').value)
			let data = JSON.parse(storedConnection)
			if (document.getElementById('db_host').value != data.host || document.getElementById('db_username').value != data.user || document.getElementById('db_pw').value != data.password || document.getElementById('db_db').value != data.database) {
				window.localStorage.setItem(document.getElementById('db_name').value, JSON.stringify(data))
			}
		}
	}
	databases = window.localStorage.getItem('dbNames')
	databases = databases.replace(document.getElementById('db_name').value, "")
	clearModalImputs()

	if (connectParam == 'connect1') {
		window.api.connect1(data).then((ret) => {
			if (db2NameEl.innerHTML != ' - ') {
				db2NameEl.innerHTML = ' - '
			}
			resultBoxEl.innerHTML = ''
			loadModal.classList.add('is-active')
			db1NameEl.innerHTML = dbName
			if (ret) {
				loadModal.classList.remove('is-active')
				drawConnection1(ret)
			}
		})
	} else if (connectParam == 'connect2') {
		window.api.connect2(data).then((ret2) => {
			db2NameEl.innerHTML = dbName
			if (ret2) {
				resultBoxEl.innerHTML = ''
				document.getElementById('wrapper').innerHTML = '<div class="grid-item1"></div>'
				document.getElementById('wrapper').innerHTML += '<div class="grid-item2">Load databases ...</div>'
				loadModal.classList.add('is-active')
				window.api.compare().then((result, error) => {
					document.getElementById('wrapper').innerHTML = ''
					loadModal.classList.remove('is-active')
					drawConnection2(result)
				})
			}
		})
	}

})

compareButtonEl.addEventListener('click', e => {
	let isSelected = 0,
		connect1Tables = document.querySelectorAll('.connect1Tables'),
		compareData = []

	resultBoxEl.innerHTML = ''

	connect1Tables.forEach(table1 => {
		if (table1.checked === true) {
			isSelected = 1
			resultBoxEl.innerHTML += "comparing this table: " + table1.dataset.table + "...</br>"
			let exist = false
			compareData.forEach(item => {
				if (item == table1.dataset.table) {
					exist = true
				}
			})
			if (!exist) {
				compareData.push(table1.dataset.table)
			}
		}
	})
	resultBoxEl.innerHTML += '<hr>'
	if (isSelected == 0) {
		resultBoxEl.innerHTML = "ERROR: Select a table for comparsion!\r\n"
	} else {
		if (document.querySelector('.compareStructure').checked) {
			drawResult(compareData)
		} else if (document.querySelector('.compareData').checked) {
			loadModal.classList.add('is-active')
			drawDataResult(compareData)
		}
	}
})

let theme = window.localStorage.getItem('theme')
window.api.set_theme(theme)