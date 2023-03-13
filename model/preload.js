const { contextBridge, ipcRenderer, remote, electron } = require('electron')

contextBridge.exposeInMainWorld(
	'api', {
	connect1: (formData) => ipcRenderer.invoke('submitForm1', formData)
		.then((response) => {
			return response
		}),
	connect2: (formData) => ipcRenderer.invoke('submitForm2', formData)
		.then((response) => {
			return response
		}),
	compare: () => ipcRenderer.invoke('compare')
		.then((response) => {
			return response
		}),
	compareTables: (tableStructure) => ipcRenderer.invoke('compareTables', tableStructure)
		.then((response) => {
			return response
		}),
	compareTablesData: (tableDatas) => ipcRenderer.invoke('compareTablesData', tableDatas)
		.then((response) => {
			return response
		}),
	testConnection: (connectionData) => ipcRenderer.invoke('testConnection', connectionData)
		.then((response) => {
			return response
		}),
	toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
	system: () => ipcRenderer.invoke('dark-mode:system'),
	set_theme: (theme) => ipcRenderer.invoke('set-theme', theme)
})