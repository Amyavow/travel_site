var express = require("express"),
	path = require("path"),
	handlebars = require("express-handlebars").create({
		defaultLayout: "main"
	}),
	app = express();

var fortunes = [
	"conquer your fears or they will conquer you.",
	"rivers need springs",
	"do not feear what you don't know",
	"you will have a pleasant surprise",
	"whenever possible, keep it simple"
];

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", process.env.PORT || 3000);

app.use(express.static(path.resolve(path.join(__dirname + "/public"))));
app.get("/", function(req, res) {
	res.render("home");
});

app.get("/about", function(req, res) {
	var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
	res.render("about", { fortune: randomFortune });
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
