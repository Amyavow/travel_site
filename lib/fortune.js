var fortuneCookies = [
	"conquer your fear",
	"you are enough!",
	"you are counted as worthy!",
	"Baby, don't let them change you",
	"stay young, make love"
];

module.exports.getFortune = function () {
	var idx = Math.floor(Math.random() * fortuneCookies.length);
	return fortuneCookies[idx];
};
