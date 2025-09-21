const http = require("https");

const options = {
  method: "GET",
  hostname: "judge0-ce.p.rapidapi.com",
  port: null,
  path: "/submissions/2e979232-92fd-4012-97cf-3e9177257d10?base64_encoded=true&fields=*",
  headers: {
    "x-rapidapi-key": "017c961eb8mshf75d45721e7702dp10d6f1jsn0a1d01decf71",
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
  },
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
