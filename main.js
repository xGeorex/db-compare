const { app, BrowserWindow, ipcMain, Menu, nativeTheme } = require('electron')
const crypto = require('crypto')
const util = require('util')
let mysql = require('mysql2/promise') //mysql2/promise
const { showNotification } = require('./src/notifications')
const path = require('path')

let connection1 = '',
	connection2 = '',
	table1Res = [],
	table2Res = [],
	controlTable = [],
	totalResult = []


const compareTables = async () => {
	table1Res = []
	table2Res = []
	controlTable = []
	try {
		let [rows, fields] = await connection1.execute('SHOW TABLES')
		for (let table1 of rows) {
			table1Res.push({ 'table': table1[fields[0].name], 'hash': '' })
			controlTable.push(table1[fields[0].name])
		}

		try {
			let [rows2, fields2] = await connection2.execute('SHOW TABLES')
			for (let table2 of rows2) {
				table2Res.push({ 'table': table2[fields2[0].name], 'hash': '' })
				controlTable.push(table2[fields2[0].name])
			}

			return { 'table1': table1Res, 'table2': table2Res, 'control': new Set(controlTable.sort()) }

		} catch (err) {
			showNotification('Database reading error', err.message)
			return false
		}
	} catch (err) {
		showNotification('Database reading error', err.message)
		return false
	}
}

const addHashToTable = async (tables) => {
	for (let tbl1 of tables.table1) {
		let hash = crypto.createHmac('sha256', tbl1.table)
		let [res, fields] = await connection1.execute('DESCRIBE ' + tbl1.table)
		hash.update(JSON.stringify(res))
		tbl1.hash = hash.digest('hex')
	}

	for (let tbl2 of tables.table2) {
		let hash2 = crypto.createHmac('sha256', tbl2.table)
		let [res2, fields2] = await connection2.execute('DESCRIBE ' + tbl2.table)
		hash2.update(JSON.stringify(res2))
		tbl2.hash = hash2.digest('hex')
	}

	return tables
}

const compareDataArray = async (array1, array2, table) => {
	let db1 = connection1.connection.config.database,
		db2 = connection2.connection.config.database,
		insertText = '',
		valueText = '',
		updateQueryText = '',
		deleteQueryText = '',
		insertVals = '',
		retQuery = { 'update': [], 'insert': [], 'delete': [] },
		removed = 0

	let cloneArray1 = JSON.parse(JSON.stringify(array1))
	let cloneArray2 = JSON.parse(JSON.stringify(array2))

	if (array1.length >= array2.length) {
		array1.forEach((arRow1, iR) => {
			let found = array2.find(el => el.key == arRow1.key)
			if (found !== undefined) {
				if (found.hash === arRow1.hash) {
					cloneArray1.splice((iR - removed), 1)
					cloneArray2.splice((iR - removed), 1)
					removed++
				} else {
					updateQueryText += 'UPDATE `' + db2 + '`.`' + table + '` SET \r\n'
					let columns = Object.entries(arRow1.data)
					columns.forEach((item, i) => {
						if (i !== 0) {
							updateQueryText += item[0] + ' = ' + (isNaN(item[1]) ? '"' + item[1] + '"' : item[1]) + (i < (columns.length - 1) ? ', ' : '')
						}
					})
					updateQueryText += '\r\n WHERE ' + found.keyField + ' = ' + (isNaN(found.key) ? '"' + found.key + '"' : found.key) + '; \r\n'
					cloneArray1.splice((iR - removed), 1)
					cloneArray2.splice((iR - removed), 1)
					removed++
				}

			} else {
				insertText = ''
				valueText = ''
				let columns = Object.entries(arRow1.data)
				columns.forEach((item, i) => {
					insertText += item[0] + (i < (columns.length - 1) ? ', ' : '')
					valueText += (isNaN(item[1]) ? '"' + item[1] + '"' : item[1]) + (i < (columns.length - 1) ? ', ' : '')
				})

				insertVals += '(' + valueText + ')' + (iR < (array1.length - 1) ? ', \r\n' : '')
			}
		})

		if (cloneArray2.length > 0) {
			cloneArray2.forEach((arRow2, i) => {
				deleteQueryText += 'DELETE FROM `' + db2 + '`.`' + table + '` WHERE ' + arRow2.keyField + ' = ' + (isNaN(arRow2.key) ? '"' + arRow2.key + '"' : arRow2.key) + ';\r\n'
			})
		}

		if (deleteQueryText != '') {
			retQuery.delete.push('<pre>' + deleteQueryText + '</pre>')
		}

		if (updateQueryText != '') {
			retQuery.update.push('<pre>' + updateQueryText + '</pre>')
		}

		if (insertVals != '') {
			retQuery.insert.push('<pre>INSERT INTO `' + db2 + '`.`' + table + '` (' + insertText + ') \r\n VALUES ' + insertVals + ';</pre> \r\n')
		}
	} else if (array2.length > array1.length) {
		array2.forEach((arRow2, i) => {

			let found = array1.find(el => el.key == arRow2.key)
			if (found !== undefined) {
				if (found.hash === arRow2.hash) {
					cloneArray1.splice((i - removed), 1)
					cloneArray2.splice((i - removed), 1)
					removed++
				} else {
					updateQueryText += 'UPDATE `' + db2 + '`.`' + table + '` \r\n SET \r\n'
					let columns = Object.entries(found.data)
					columns.forEach((item, i) => {
						if (i !== 0) {
							updateQueryText += item[0] + ' = ' + (isNaN(item[1]) ? '"' + item[1] + '"' : item[1]) + (i < (columns.length - 1) ? ',\r\n' : '\r\n')
						}
					})
					updateQueryText += 'WHERE ' + found.keyField + ' = ' + (isNaN(found.key) ? '"' + found.key + '"' : found.key) + '; \r\n'
					cloneArray1.splice((i - removed), 1)
					cloneArray2.splice((i - removed), 1)
					removed++
				}
			} else {
				deleteQueryText += 'DELETE FROM `' + db2 + '`.`' + table + '` WHERE ' + arRow2.keyField + ' = ' + (isNaN(arRow2.key) ? '"' + arRow2.key + '"' : arRow2.key) + ';\r\n'
			}
		})

		if (cloneArray1.length > 0) {
			cloneArray1.forEach((arRow1, iR) => {
				insertText = ''
				valueText = ''
				let columns = Object.entries(arRow1.data)
				columns.forEach((item, i) => {
					insertText += item[0] + (i < (columns.length - 1) ? ', ' : '')
					valueText += (isNaN(item[1]) ? '"' + item[1] + '"' : item[1]) + (i < (columns.length - 1) ? ', ' : '')
				})

				insertVals += '(' + valueText + ')' + (iR < cloneArray1.length ? ', \r\n' : '')
			})
		}

		if (deleteQueryText != '') {
			retQuery.delete.push('<pre>' + deleteQueryText + '</pre>')
		}

		if (updateQueryText != '') {
			retQuery.update.push('<pre>' + updateQueryText + '</pre>')
		}

		if (insertVals != '') {
			retQuery.insert.push('<pre>INSERT INTO `' + db2 + '`.`' + table + '` (' + insertText + ') \r\n VALUES ' + insertVals + ';</pre> \r\n')
		}
	}

	return retQuery
}

const doTableDataQuery = async (tables) => {
	let db1 = connection1.connection.config.database,
		db2 = connection2.connection.config.database,
		totalResult = []
	for (let table of tables) {
		res2Array = [],
			res1Array = []

		try {
			let [columns2, fields2] = await connection2.execute('SELECT * FROM ' + table)
			try {
				let [columns1, fields1] = await connection1.execute('SELECT * FROM ' + table)
				for (let row2 of columns2) {
					let hashText2 = ''
					let columns2 = Object.entries(row2)
					let hash2 = crypto.createHmac('sha256', table)
					columns2.forEach((col2, i) => {
						if (i !== 0) {
							hashText2 += col2[1]
						}
					})
					hash2.update(JSON.stringify(hashText2))
					res2Array.push({ 'data': row2, 'hash': hash2.digest('hex'), 'key': columns2[0][1], 'keyField': columns2[0][0] })
				}

				for (let row1 of columns1) {
					let hashText1 = ''
					let columns1 = Object.entries(row1)
					let hash1 = crypto.createHmac('sha256', table)
					columns1.forEach((col1, i) => {
						if (i !== 0) {
							hashText1 += col1[1]
						}
					})
					hash1.update(JSON.stringify(hashText1))
					res1Array.push({ 'data': row1, 'hash': hash1.digest('hex'), 'key': columns1[0][1], 'keyField': columns1[0][0] })
				}

				let returnData = await compareDataArray(res1Array, res2Array, table)
				totalResult.push({ 'table': table, 'data': returnData })
			} catch (error) {
				showNotification('Unknow error INNER', error)
			}

		} catch (err) {
			showNotification('Unknow error Outer', err)
		}
	}
	return totalResult
}

const doTableQuery = async (tables) => {
	let db1 = connection1.connection.config.database,
		db2 = connection2.connection.config.database
	totalResult = []

	for (let table of tables) {
		let compareResult = ''
		if (table.match(/view_/)) {
			try {
				let [columns1, fields1] = await connection1.execute(`SELECT VIEW_DEFINITION 
				FROM    INFORMATION_SCHEMA.VIEWS
				WHERE   TABLE_SCHEMA    = '${db1}' 
				AND     TABLE_NAME      = '${table}'`)

				const fullRes1 = columns1[0].VIEW_DEFINITION.replaceAll('`,`', '`<|>`').replaceAll('from', '<|>from').replaceAll('select', 'select<|>').replaceAll(') where (', '<|>) where (').replaceAll(') and (', ') and (<|>').replaceAll(') or (', ') or (<|>').replaceAll(') inner join ', ')<|> inner join').replaceAll(') left join ', ')<|> left join').replaceAll(') right join ', ')<|> right join').replaceAll(') join ', ')<|> join').replaceAll('`' + db1 + '`.', '')
				const rows1 = fullRes1.split('<|>')

				let [columns2, fields2] = await connection2.execute(`SELECT VIEW_DEFINITION 
				FROM    INFORMATION_SCHEMA.VIEWS
				WHERE   TABLE_SCHEMA    = '${db2}' 
				AND     TABLE_NAME      = '${table}'`)

				const fullRes2 = columns2[0].VIEW_DEFINITION.replaceAll('`,`', '`<|>`').replaceAll('from', '<|>from').replaceAll('select', 'select<|>').replaceAll(') where (', '<|>) where (').replaceAll(') and (', ') and (<|>').replaceAll(') or (', ') or (<|>').replaceAll(') inner join ', ')<|> inner join').replaceAll(') left join ', ')<|> left join').replaceAll(') right join ', ')<|> right join').replaceAll(') join ', ')<|> join').replaceAll('`' + db2 + '`.', '')
				const rows2 = fullRes2.split('<|>')

				if (rows1.length >= rows2.length) {
					rows1.forEach((line, i) => {
						if (line != rows2[i]) {
							compareResult += '<div class="table-result-grid"><pre class="mysqlText grid-item1 ' + table + '">The line do not match! \r\n ' + db1 + ': "' + line + '"\r\n ' + db2 + ': "' + rows2[i] + '";</pre>'
							compareResult += '</div>'
						}
					})
				} else {
					rows2.forEach((line, i) => {
						if (line != rows1[i]) {
							compareResult += '<div class="table-result-grid"><pre class="mysqlText grid-item1 ' + table + '">The line do not match! \r\n ' + db1 + ': "' + rows1[i] + '"\r\n ' + db2 + ': "' + line + '";</pre>'
							compareResult += '</div>'
						}
					})
				}

			} catch (err) {
				let [columns1, fields1] = await connection1.execute(`SHOW CREATE VIEW ${table}`)
				// console.log(err.message)
				// showNotification('Unknow error views', err)

				compareResult += '<div class="table-result-grid"><pre id="' + table + '" class="mysqlText grid-item1 ' + table + '">' + columns1[0]['Create View'] + ' ;</pre>'
				compareResult += '</div>'
			}
		} else {
			try {
				let [columns2, fields2] = await connection2.execute('DESCRIBE ' + table)
				try {
					let [columns1, fields1] = await connection1.execute('DESCRIBE ' + table)
					if (columns1.length >= columns2.length) {
						for (let clmn of columns1) {
							let found = columns2.find(el => el.Field == clmn.Field)

							if (found !== undefined) {
								if (clmn.Type !== found.Type
									|| clmn.Null !== found.Null
									|| clmn.Default !== found.Default) {
									compareResult += '<div class="table-result-grid"><pre id="' + clmn.Field + '" class="mysqlText grid-item1 ' + table + '">ALTER TABLE `' + db2 + '`.`' + table + '`\r\n CHANGE COLUMN `' + clmn.Field + '` `' + clmn.Field + '` ' + clmn.Type + ' ' + clmn.Default + ' DEFAULT ' + clmn.Default + ' ;</pre>'
									compareResult += '</div>'
								}
							} else {
								compareResult += '<div class="table-result-grid"><pre id="' + clmn.Field + '" class="mysqlText grid-item1 ' + table + '">ALTER TABLE `' + db2 + '`.`' + table + '`\r\n CHANGE COLUMN `' + clmn.Field + '` `' + clmn.Field + '` ' + clmn.Type + ' ' + clmn.Default + ' DEFAULT ' + clmn.Default + ' ;</pre>'
								compareResult += '</div>'
							}
						}
					} else if (columns2.length > columns1.length) {
						for (let clmn2 of columns2) {
							let found2 = columns1.find(el => el.Field == clmn2.Field)
							if (found2 !== undefined) {
								if (clmn2.Type !== found2.Type
									|| clmn2.Null !== found2.Null
									|| clmn2.Default !== found2.Default) {
									compareResult += '<div class="table-result-grid"><pre id="' + found2.Field + '" class="mysqlText grid-item1 ' + table + '">ALTER TABLE `' + db2 + '`.`' + table + '`\r\n CHANGE COLUMN `' + found2.Field + '` `' + found2.Field + '` ' + found2.Type + ' ' + found2.Default + ' DEFAULT ' + found2.Default + ' ;</pre>'
									compareResult += '</div>'
								}
							} else {
								compareResult += '<div class="table-result-grid"><pre id="' + clmn2.Field + '" class="mysqlText grid-item1 ' + table + '">ALTER TABLE `' + db1 + '`.`' + table + '` DROP COLUMN `' + clmn2.Field + '`;</pre>'
								compareResult += '</div>'
							}
						}
					} else {
						console.log("Unexpected error")
					}
				} catch (err) {
					console.log(err)
					showNotification('Unknow error 1', err.sqlMessage)
				}
			} catch (err) {
				try {
					let [columns1, fields1] = await connection1.execute('show create table `' + table + '`')

					compareResult += '<div class="table-result-grid"><pre id="' + table + '" class="mysqlText grid-item1 ' + table + '">' + columns1[0]['Create Table'] + ' ;</pre>'
					compareResult += '</div>'
				} catch (err) {
					showNotification('Missing table', err.sqlMessage)
				}
			}
		}

		if (compareResult !== '') {
			totalResult.push('<div><div class="table-result-grid"><h2 class="grid-item1">' + table + ' Result</h2><div class="grid-item2 has-text-right"><button class="copyTable button is-light is-info is-small" data-table="' + table + '"><img src="../images/copy.svg" width="15"></button></div></div><pre class="mysqlTextContainer">' + compareResult + '</pre><br></div>')
		}
	}

	return totalResult
}

const createWindow = (file, width = 800, height = 968, haveframe = true, debug = true, resizeable = true) => {
	const win = new BrowserWindow({
		minWidth: width,
		minHeight: height,
		resizable: resizeable,
		frame: haveframe,
		webPreferences: {
			preload: path.join(__dirname, '/model/preload.js')
		}
	})

	win.maximize()
	win.loadFile('./view/' + file)
	if (debug) {
		win.openDevTools()
	}

	win.on("closed", () => {
		app.quit()
	})

	ipcMain.handle('dark-mode:toggle', () => {
		if (nativeTheme.shouldUseDarkColors) {
			nativeTheme.themeSource = 'light'
		} else {
			nativeTheme.themeSource = 'dark'
		}
		return nativeTheme.shouldUseDarkColors
	})

	ipcMain.handle('dark-mode:system', () => {
		nativeTheme.themeSource = 'system'
	})

	ipcMain.handle('set-theme', (event, param) => {
		switch (param) {
			case 'Dark':
				nativeTheme.themeSource = 'dark'
				break
			case 'Light':
				nativeTheme.themeSource = 'light'
				break
			case 'System':
				nativeTheme.themeSource = 'system'
				break
			default:
				nativeTheme.themeSource = 'system'
				break
		}
		return true
	})

	ipcMain.handle('compare', async () => {
		if (connection1 !== '' && connection2 !== '') {
			let returns = ''
			returns = await compareTables()
			if (returns) {
				let retTable = await addHashToTable(returns)
				return retTable
			} else {
				return false
			}
		} else {
			throw "Missing Connection"
		}
	})

	ipcMain.handle('submitForm1', async (event, post) => {
		try {
			connection1.end()
			connection2.end()
		} catch (err) {
			console.log(err.message)
		}

		connection1 = ''
		try {
			connection1 = await mysql.createConnection({
				host: post.host,
				user: post.user,
				password: post.password,
				database: post.database
			})
			showNotification('Connection Created - ' + post.database, 'Connect to ' + post.database + ' was succesfully')
			return true
		} catch (err) {
			showNotification('Connection error', err.message)
			return false
		}
	})

	ipcMain.handle('submitForm2', async (event, post) => {
		try {
			connection2.end()
		} catch (err) {
			console.log(err.message)
		}
		connection2 = ''
		try {
			connection2 = await mysql.createConnection({
				host: post.host,
				user: post.user,
				password: post.password,
				database: post.database
			})
			showNotification('Connection Created - ' + post.database, 'Connect to ' + post.database + ' was succesfully')
			return true
		} catch (err) {
			showNotification('Connection error', err.message)
			return false
		}
	})

	ipcMain.handle('testConnection', async (event, connectionData) => {
		let testConnection = ''
		try {
			testConnection = await mysql.createConnection({
				host: connectionData.host,
				user: connectionData.user,
				password: connectionData.password,
				database: connectionData.database
			})
			testConnection.end()
			return { res: 1, message: "The connection test (" + connectionData.database + ") was succesful!" }
		} catch (error) {
			return { res: 0, message: error.message }
		}
	})

	ipcMain.handle('compareTables', async (event, tableArray) => {
		let dataRows = ''
		dataRows = await doTableQuery(tableArray)
		return dataRows
	})

	ipcMain.handle('compareTablesData', async (event, tableArray) => {
		let dataRows = ''
		dataRows = await doTableDataQuery(tableArray)

		return dataRows
	})

	menuTemplate = [{
		label: "Window",
		submenu: [
			{ role: "reload" },
			{ type: "separator" },
			{ label: "Quit", click: () => { app.quit() } }

		]
	}, {
		label: "Edit",
		submenu: [
			{
				label: "Edit connections",
				click: () => {
					let childWindow = new BrowserWindow({
						width: 750,
						height: 750,
						show: false,
						resizable: false,
						parent: win,
						modal: true,
						title: "Edit Connections",
						webPreferences: {
							preload: path.join(__dirname, '/model/preload.js')
						}
					})
					childWindow.loadFile('./view/connection-editor.html')
					childWindow.setMenuBarVisibility(false)
					// childWindow.openDevTools()
					childWindow.once('ready-to-show', childWindow.show)
				}
			},
			{ type: "separator" },
			{
				label: "Settings",
				click: () => {
					let childWindow = new BrowserWindow({
						width: 750,
						height: 750,
						show: false,
						resizable: false,
						parent: win,
						modal: true,
						title: "Settings",
						webPreferences: {
							preload: path.join(__dirname, '/model/preload.js')
						}
					})
					childWindow.loadFile('./view/settings.html')
					childWindow.setMenuBarVisibility(false)
					// childWindow.openDevTools()
					childWindow.once('ready-to-show', childWindow.show)
				}
			}
		]
	}]

	let menu = Menu.buildFromTemplate(menuTemplate)
	Menu.setApplicationMenu(menu)

}

app.whenReady().then(() => {
	createWindow('index.html')
	app.on('activate', () => {
		if (wins.length === 0) {
			createWindow('index.html')
		}
	})
})

app.on('window-all-closed', () => {
	try {
		connection1.end()
		connection2.end()
	} catch (err) {
		console.log(err)
	}
	if (process.platform !== 'darwin') {
		connection1.end()
		connection2.end()
		app.quit()
	}
})
