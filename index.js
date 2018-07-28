var http = require("http"),
	express = require("express"),
	path = require("path"),
	fortune = require("./lib/fortune.js"),
	weatherData = require("./lib/weatherData.js"),
	credentials = require("./credentials.js"),
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
	cookieParser = require("cookie-parser"),
	session = require("express-session"),
	formidable = require("formidable"),
	app = express();

//disable express' x-powered by:
app.disable("x-powered");

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", process.env.PORT || 3000);

app.use(function(req, res, next) {
	//create domain for request
	var domain = require("domain").create();
	//handle errors on the domain
	domain.on("error", function(err) {
		console.error("DOMAIN ERROR CAUGHT\n", err.stack);
		try {
			//failsafe shut down in 5 seconds
			setTimeout(function() {
				console.error("Failsafe shutdown.");
				process.exit(1);
			}, 5000);

			//disconnect from cluster
			var worker = require("cluster").worker;
			if (worker) {
				worker.disconnect();
			}
			//stop new requests
			server.close();

			try {
				//attempt to use Express error route
				next(err);
			} catch (err) {
				//if Express error route failed, try plain Node response
				console.error("Express error mechanism failed.\n", err.stack);
				res.statusCode = 500;
				res.setHeader("Content-Type", "text/plain");
				res.end("Server error.");
			}
		} catch (err) {
			console.error("Unable to send 500 response \n", err.stack);
		}
	});
	//add request and response objects to the domain
	domain.add(req);
	domain.add(res);
	//execute the rest of the request chain in the domain
	domain.run(next);
});

switch (app.get("env")) {
	case "development":
		app.use(require("morgan")("dev"));
		break;
	case "production":
		app.use(
			require("express-logger")({
				path: __dirname + "/log/requests.log"
			})
		);
		break;
}
app.locals.copyRightYear = new Date().getFullYear();
app.use(express.static(path.resolve(path.join(__dirname + "/public"))));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(credentials.cookieSecret));
app.use(
	session({
		secret: "TKRv0IJs=HYqrvagQ#&!F!%V]Ww/4KiVs$s,<<MX",
		resave: true,
		saveUninitialized: true
	})
);

app.use(function(req, res, next) {
	res.locals.showTests =
		app.get("env") !== "production" && req.query.test === "1";
	next();
});

app.use(function(req, res, next) {
	if (!res.locals.partials) {
		res.locals.partials = {};
	}
	res.locals.partials.weatherData = weatherData.getWeatherData();
	next();
});

app.use(function(req, res, next) {
	//if a flash message, add to the context and then delete it
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

app.use(function(req, res, next) {
	var cluster = require("cluster");
	if (cluster.isWorker) {
		console.log("Worker %d received request", cluster.worker.id);
	}
	next();
});

app.get("/", function(req, res) {
	//res.cookie("coffee", "makesAlive", { signed: true });
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

function startServer() {
	http.createServer(app).listen(app.get("port"), function() {
		console.log(
			"Express started on http://localhost " +
				app.get("port") +
				" mode on http://localhost:" +
				app.get("env") +
				"; press Ctrl-C to terminate"
		);
	});
}

if (require.main === module) {
	//if the application is run directly
	startServer();
} else {
	//export function to be imported as a module via require
	module.exports = startServer;
}
