exports.default = async function(configuration) {
	// do not include passwords or other sensitive data in the file
	// rather create environment variables with sensitive data
	const CERTIFICATE_NAME = 'WINDOWS_SIGN_CERTIFICATE_NAME';
	const TOKEN_PASSWORD = 'WINDOWS_SIGN_TOKEN_PASSWORD';
	console.log('sign it!')
	require("child_process")
	.execSync(echo ${CERTIFICATE_NAME} ${TOKEN_PASSWORD}, { stdio: "inherit" } ); };
