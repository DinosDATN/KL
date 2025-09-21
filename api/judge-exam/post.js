const http = require("https");

const options = {
  method: "POST",
  hostname: "judge0-ce.p.rapidapi.com",
  port: null,
  path: "/submissions?base64_encoded=true&wait=false&fields=*",
  headers: {
    "x-rapidapi-key": "017c961eb8mshf75d45721e7702dp10d6f1jsn0a1d01decf71",
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    "Content-Type": "application/json",
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

req.write(
  JSON.stringify({
    language_id: 52,
    source_code:
      "I2luY2x1ZGUgPHN0ZGlvLmg+CgppbnQgbWFpbih2b2lkKSB7CiAgY2hhciBuYW1lWzEwXTsKICBzY2FuZigiJXMiLCBuYW1lKTsKICBwcmludGYoImhlbGxvLCAlc1xuIiwgbmFtZSk7CiAgcmV0dXJuIDA7Cn0=",
    stdin: "SnVkZ2Uw",
  })
);
req.end();
