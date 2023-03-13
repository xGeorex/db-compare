const { Notification } = require('electron')
const showNotification = (titleEl, msgEl) => {
    new Notification({ title: titleEl, body: msgEl }).show()
}

module.exports = { showNotification }