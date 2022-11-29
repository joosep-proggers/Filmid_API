const express = require("express");
const cors = require("cors");
const app = express();
const https = require("https");
const fs = require("fs");
const { debug } = require("console");
const { OAuth2Client } = require("google-auth-library");
const { type } = require("os");
const OAuth2ClientInstance = new OAuth2Client(
  "49359541663-65j2pbik2ji6k4vig1fae69qj6g8stbh.apps.googleusercontent.com"
);

const csvFile = "log.csv";
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};
const httpsServer = https.createServer(options, app);

let expressWs = require("express-ws")(app, httpsServer);
let events = [
  {
    id: 1,
    name: "Magnus' Among Us themed Birthday Party",
    location: "Aedevahe talu, Kursi küla, Harjumaa",
    date: "2022-08-08 19:00",
    price: "16.50",
  },
  {
    id: 2,
    name: "Joe Nuts' Public Execution",
    location: "Raekoja plats",
    date: "2022-03-25 16:00",
    price: "6.99",
  },
  {
    id: 3,
    name: "Eminmen Concert",
    location: "Saku Suurhall",
    date: "2022-06-01 14:00",
    price: "0",
  },
];

const users = [
  { username: "ad;min", password: "admin", isAdmin: true },
  { username: "user", password: "password", isAdmin: false },
];

const sessions = [];

async function getClientDataFromGoogle(token) {
  const ticket = await OAuth2ClientInstance.verifyIdToken({
    idToken: token,
    audience:
      "49359541663-65j2pbik2ji6k4vig1fae69qj6g8stbh.apps.googleusercontent.com",
  });
  return ticket.getPayload();
}

function createLog(action = {}) {
  let date = new Date().toISOString().replace("T", " ").replace("Z", "");
  //let content = Object.keys(action).map((key) =>  + ";" + action[key]);
  let content = []
  Object.values(action).forEach((value) => {
    if(typeof(value) == 'string'){
      value = value.replace(/;/g,'\\;')
      content.push(';' + value)
    }else if(typeof(value) == 'object'){
      value.forEach((element) => {
        try{
          element[0] = element[0].replace(/;/g,'\\;')
        }catch(err){
        }
      })
      content.push(';' + value)
    }else{
      content.push(';' + value)
    }
  })
  const writeStream = fs.createWriteStream(csvFile, { flags: "a" });
  writeStream.write(`\n${date}`);
  content.forEach((e) => writeStream.write(`${e}`));
  writeStream.end();
}

app.ws("/", function (ws, req) {
  ws.on("message", function (msg) {
    expressWs.getWss().clients.forEach((client) => client.send(msg));
  });
});

app.use(cors()); // Avoid CORS errors in browsers
app.use(express.json()); // Populate req.body

app.get("/events", (req, res) => {
  res.send(events);
});

app.get("/events/:id", (req, res) => {
  if (typeof events[req.params.id - 1] === "undefined") {
    return res.status(404).send({ error: "Event not found" });
  }
  res.send(events[req.params.id - 1]);
});

app.post("/oAuth2Login", async (req, res) => {
  try {
    const dataFromGoogle = await getClientDataFromGoogle(req.body.credential);
    sessionId = Math.round(Math.random() * 100000000);
    newSession = { id: sessionId, user: dataFromGoogle.email, isAdmin: false };
    sessions.push(newSession);
    createLog({
      doneBy: newSession.user,
      action: 0,
      data: `id:${sessionId},isAdmin:${newSession.isAdmin}`,
    });

    return res.status(201).send({
      success: true,
      username: dataFromGoogle.email,
      isAdmin: false,
      sessionId: sessionId,
    });
  } catch (err) {
    return res.status(400).send({ error: "Login unsuccessful" });
  }
});

app.post("/sessions", (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({ error: "One or more parameters missing" });
  } else {
    userMatched = 0;
    checkAdmin = false;
    users.forEach((element) => {
      if (
        element.username == req.body.username &&
        element.password == req.body.password
      ) {
        userMatched += 1;
        if (element.isAdmin == true) {
          checkAdmin = true;
        }
        sessionId = Math.round(Math.random() * 100000000);
        session = {
          id: sessionId,
          user: req.body.username,
          isAdmin: checkAdmin,
        };
        sessions.push(session);
        createLog({
          doneBy: session.user,
          action: 0,
          data: `id:${session.id},isAdmin:${session.isAdmin}`,
        });
      }
    });
    if (userMatched == 0) {
      return res.status(401).send({ error: "Invalid username or password" });
    } else if (userMatched == 1) {
      return res
        .status(201)
        .send({ success: true, isAdmin: checkAdmin, sessionId: sessionId });
    }
  }
});

app.post("/logout", (req, res) => {
  if (!req.body.username || !req.body.sessionId) {
    return res.status(400).send({ error: "One or more parameters missing" });
  } else {
    sessions.forEach((element) => {
      if (
        element.user == req.body.username ||
        element.id == req.body.sessionId
      ) {
        sessions.splice(element);
        createLog({
          doneBy: element.user,
          action: 1,
          data: `id:${element.id},isAdmin:${element.isAdmin}`,
        });
        return res.status(201).send({ success: true });
      } else {
        return res.status(401).send({ error: "Invalid sessionId or username" });
      }
    });
  }
});

app.post("/events", (req, res) => {
  let auth = req.headers.authorization;

  if (!auth) {
    return res.status(400).send({ error: "Missing authorization header" });
  } else {
    try {
      let obj = sessions.find((o) => o.id == auth);
      if (!obj.isAdmin) {
        return res.status(403).send({ error: "Unauthorized" });
      } else {
        if (
          !req.body.name ||
          !req.body.price ||
          !req.body.location ||
          !req.body.date
        ) {
          return res
            .status(400)
            .send({ error: "One or all params are missing" });
        }
        let newEvent = {
          id: events.length + 1,
          name: req.body.name,
          location: req.body.location,
          date: req.body.date,
          price: req.body.price,
        };
        events.push(newEvent);
        expressWs
          .getWss()
          .clients.forEach((client) => client.send(JSON.stringify(newEvent)));
        createLog({
          doneBy: obj.user,
          action: 2,
          data: `id:${newEvent.id},name:${newEvent.name},location:${newEvent.location},date:${newEvent.date},price:${newEvent.price}`,
        });
        res
          .status(201)
          .location("localhost:8080/events/" + (events.length - 1))
          .send(newEvent);
      }
    } catch (error) {
      console.log(error);
      return res.status(401).send({ error: "Session not found" });
    }
  }
});

app.patch("/events/:id", (req, res) => {
  let auth = req.headers.authorization;

  if (!auth) {
    return res.status(400).send({ error: "Missing authorization header" });
  } else {
    try {
      let obj = sessions.find((o) => o.id == auth);

      if (!obj.isAdmin) {
        return res.status(403).send({ error: "Unauthorized" });
      } else {
        if (!events[req.params.id - 1]) {
          return res.status(404).send({ error: "Event not found" });
        }

        let event = events.find((o) => o.id == req.params.id);
        let oldValues = Object.assign({}, event);

        for (const [element, value] of Object.entries(req.body)) {
          if (value != "") {
            event[element] = value;
          }
        }

        let newValues = Object.assign({}, event);
        for (key in oldValues) {
          if (oldValues[key] == newValues[key]) {
            delete oldValues[key];
            delete newValues[key];
          }
        }
        let oldValuesArr = Object.entries(oldValues);
        let newValuesArr = Object.entries(newValues);
        let oldArr = [];
        oldValuesArr.forEach(([key, value]) => {
          oldArr.push(key + ":" + value);
        });
        let newArr = [];
        newValuesArr.forEach(([key, value]) => {
          newArr.push(key + ":" + value);
        });

        expressWs
          .getWss()
          .clients.forEach((client) => client.send(JSON.stringify(event)));
        createLog({
          doneBy: obj.user,
          action: 3,
          data: [`id:${event.id}`, oldArr, newArr],
        });
        res.status(200).send({ success: true });
      }
    } catch (error) {
      console.log(error);
      return res.status(401).send({ error: "Session not found" });
    }
  }
});

app.delete("/events/:id", (req, res) => {
  let auth = req.headers.authorization;

  if (!auth) {
    return res.status(400).send({ error: "Missing authorization header" });
  } else {
    try {
      let obj = sessions.find((o) => o.id == auth);

      if (!obj.isAdmin) {
        return res.status(403).send({ error: "Unathorized" });
      } else {
        if (!events[req.params.id - 1]) {
          return res.status(404).send({ error: "Event not found" });
        }
        createLog({
          doneBy: obj.user,
          action: 4,
          data: `id:${events[req.params.id - 1].id},name:${
            events[req.params.id - 1].name
          },location:${events[req.params.id - 1].location},date:${
            events[req.params.id - 1].date
          },price:${events[req.params.id - 1].price}`,
        });

        events.splice(req.params.id - 1, 1);

        for (let i = 0; i < events.length; i++) {
          events[i].id = i + 1;
        }
        expressWs
          .getWss()
          .clients.forEach((client) => client.send(req.params.id));

        return res.status(200).send({ success: true });
      }
    } catch (error) {
      console.log(error);
      return res.status(401).send({ error: "Session not found" });
    }
  }
});

app.get("/logs", (req, res) => {

  try {
    let contents = fs.readFileSync('log.csv', 'utf-8');

    var logs = contents.split('\n')

    }
  catch(error){
    console.log(error)
  }

  let auth = req.headers.authorization
  if (!auth) {
    return res.status(400).send({ error: "Missing authorization header" });
  } else {
    try {
      let obj = sessions.find((o) => o.id == auth);

      if (!obj.isAdmin) {
        return res.status(403).send({ error: "Unathorized" });
      } else {
        return res.status(200).send({logs})
      }
    } catch(err){
      console.log(err)
    }
  }
});

httpsServer.listen(8443, () => {
  console.log("https api up at localhost:8443");
});