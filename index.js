var express = require("express"),
	path = require("path"),
	fortune = require("./lib/fortune.js"),
	handlebars = require("express-handlebars").create({
		defaultLayout: "main",
		helpers: {
			section: function(name, options) {
				if (!this._sections) this._sections = {};
				this._sections[name] = options.fn(this);
				return null;
			}
		}
	}),
	bodyParser = require("body-parser"),
	formidable = require("formidable"),
	app = express();

function getWeatherData() {
	return {
		locations: [
			{
				name: "Portland",
				forecastUrl: "http://www.wunderground.com/US/OR/Portland.html",
				iconUrl: "http://icons-ak.wxug.com/i/c/k/cloudy.gif",
				weather: "Overcast",
				temp: "54.1 F(12.3 C)"
			},
			{
				name: "Bend",
				forecastUrl: "http://www.wunderground.com/US/OR/Bend.html",
				iconUrl: "http://icons-ak.wxug.com/i/c/k/cloudy.gif",
				weather: "Partly Cloudy",
				temp: "55.0 F(12.8 C)"
			},
			{
				name: "Lagos",
				forecastUrl: "http://www.wunderground.com/US/OR/Manzanita.html",
				iconUrl: "http://icons-ak.wxug.com/i/c/k/rain.gif",
				weather: "Light Rain",
				temp: "55.0 F(12.8 C)"
			}
		]
	};
}

//disable express' x-powered by:
app.disable("x-powered");

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", process.env.PORT || 3000);

app.locals.copyRightYear = new Date().getFullYear();
app.use(express.static(path.resolve(path.join(__dirname + "/public"))));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
	res.locals.showTests =
		app.get("env") !== "production" && req.query.test === "1";
	next();
});

app.use(function(req, res, next) {
	if (!res.locals.partials) {
		res.locals.partials = {};
	}
	res.locals.partials.weatherData = getWeatherData();
	next();
});

app.get("/", function(req, res) {
	res.render("home");
});

app.get("/about", function(req, res) {
	var randomFortune = fortune.getFortune();
	res.render("about", {
		fortune: randomFortune,
		pageTestScript: "/qa/tests-about.js"
	});
});

app.get("/newsletter", function(req, res) {
	res.render("newsletter", { csrf: "CSRF token goes here" });
});

app.post("/process", function(req, res) {
	if (req.xhr || req.accepts("json,html") === "json") {
		res.send({ success: true });
	} else {
		res.redirect(303, "/thank-you");
	}
});

app.get("/contest/vacation-photo", function(req, res) {
	var now = new Date();
	res.render("contest/vacation-photo", {
		year: now.getFullYear(),
		month: now.getMonth()
	});
});

app.post("/contest/vacation-photo/:year/:month", function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) {
			return res.redirect(303, "/error");
		}

		console.log("received fields:");
		console.log(fields);
		console.log("received files:");
		console.log(files);
		res.redirect(303, "/thank-you");
	});
});

//cross page testing
app.get("/tours/hood-river", function(req, res) {
	res.render("tours/hood-river");
});
//cross page testing
app.get("/tours/request-group-rate", function(req, res) {
	res.render("tours/request-group-rate");
});

//testing front end templating
app.get("/nursery-rhyme", function(req, res) {
	res.render("nursery-rhyme");
});
//ajax and front end templating
app.get("/data/nursery-rhyme", function(req, res) {
	res.json({
		animal: "squirrel",
		bodyPart: "tail",
		adjective: "bushy",
		noun: "heck"
	});
});
//custom 404 page
app.use(function(req, res) {
	res.status(404);
	res.render("404");
});

//custom 500 page
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render("500");
});

app.listen(app.get("port"), function() {
	console.log(
		"Express started on http://localhost " +
			app.get("port") +
			"; press Ctrl-C to terminate"
	);
});
