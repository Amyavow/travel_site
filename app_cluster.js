var cluster = require("cluster");

function startWorker() {
	var worker = cluster.fork();
	console.log("CLUSTER: Worker %d started", worker.id);
}

if (cluster.isMaster) {
	require("os")
		.cpus()
		.forEach(function() {
			startWorker();
		});
	cluster.on("disconnect", function(worker) {
		console.log("ClUSTER: WOrker disconnected from cluster.", worker.id);
	});

	cluster.on("exit", function(worker, code, signal) {
		console.log(
			"CLUSTER; Worker %d died witht the exit code %d(%s)",
			worker.id,
			code,
			signal
		);
		startWorker();
	});
}else{
	require('./index.js')();
}
