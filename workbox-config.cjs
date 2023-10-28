module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{json,png,svg}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};