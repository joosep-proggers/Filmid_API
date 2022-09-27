const express = require('express');
const cors = require('cors');
const app = express();

let expressWs = require('express-ws')(app)

const delay = ms => new Promise(res => setTimeout(res, ms));

app.ws('/', function(ws, req) {
    ws.on('message', function(msg) {
        expressWs.getWss().clients.forEach(client => client.send(msg));
    });
})

app.use(cors());        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

let events = [
    { id: 1, name: "Magnus' Among Us themed Birthday Party", location: "Aedevahe talu, Kursi küla, Harjumaa", date: "2022-08-08 19:00", price: "16.50"},
    { id: 2, name: "Joe Nuts' Public Execution", location: "Raekoja plats", date: "2022-03-25 16:00",  price: "6.99"},
    { id: 3, name: "Eminmen Concert", location: "Saku Suurhall", date: "2022-06-01 14:00", price: "0" }
]

const users = [{username: "admin", password: "admin", isAdmin: true},
{username: "user", password: "password", isAdmin: false}]

const sessions = []


app.get('/events', async (req, res) => {
    await delay(3000)
    res.send(events)
})

app.get('/events/:id', (req, res) => {
    if (typeof events[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "Event not found" })
    }
    res.send(events[req.params.id - 1])
})

app.post('/events', (req, res) => {

    let auth = req.headers.authorization

    if(!auth){
        return res.status(400).send({error: "Missing authorization header"})
    } else {
        try{
            let obj = sessions.find(o => o.id == auth)

            if(!obj.isAdmin){
                return res.status(403).send({error: "Unauthorized"})
            } else {

                if (!req.body.name || !req.body.price || !req.body.location || !req.body.date) {
                    return res.status(400).send({ error: 'One or all params are missing' })
                }
                let newEvent = {
                    id: events.length + 1,
                    name: req.body.name,
                    location: req.body.location,
                    date: req.body.date,
                    price: req.body.price
                }
                events.push(newEvent)
                expressWs.getWss().clients.forEach(client => client.send(JSON.stringify(newEvent)))
                res.status(201).location('localhost:8080/events/' + (events.length - 1)).send(newEvent)
            }
        }
        catch(error){
            console.log(error)
            return res.status(401).send({error: "Session not found"})
        }
    }
})

app.patch('/events/:id', (req, res) => {

    let auth = req.headers.authorization

    if(!auth){
        return res.status(400).send({error: "Missing authorization header"})
    } else {
        try{
            let obj = sessions.find(o => o.id == auth)

            if(!obj.isAdmin){
                return res.status(403).send({error: "Unauthorized"})
            } else {

                if(!events[req.params.id-1]){
                    return res.status(404).send({error: "Event not found"})
                }

                let event = events.find(o => o.id == req.params.id)

                if (req.body.name == ""){
                    event.name = event.name
                } else {
                    event.name = req.body.name
                }

                if (req.body.location == ""){
                    event.location = event.location
                } else {
                    event.location = req.body.location
                }

                if (req.body.date == ""){
                    event.date = event.date
                } else {
                    event.date = req.body.date
                }
                
                if (req.body.price == ""){
                    event.price = event.price
                } else {
                    event.price = req.body.price
                }
                expressWs.getWss().clients.forEach(client => client.send(JSON.stringify(event)))

                res.status(200).send({success: true})
            }

        }
        catch(error){
            console.log(error)
            return res.status(401).send({error: "Session not found"})
        }
    }
});

app.post('/sessions', (req,res) => {
    if (!req.body.username || !req.body.password){
        return res.status(400).send({error: "One or more parameters missing"})
    } else {
        userMatched = 0
        checkAdmin = false
        users.forEach((element) => {
            if(element.username == req.body.username && element.password == req.body.password){
                userMatched += 1
                if (element.isAdmin == true){
                    checkAdmin = true
                } 
                sessionId = Math.round(Math.random() * 100000000)
                session = {id: sessionId, user: req.body.username, isAdmin: checkAdmin}
                sessions.push(session)
            }
        });
        if (userMatched == 0){
            return res.status(401).send({error: "Invalid username or password"})
        }
        else if (userMatched == 1){
            return res.status(201).send({success: true, isAdmin: checkAdmin, sessionId: sessionId})
        }
    }
});

app.post('/logout', (req, res) => {
    if (!req.body.username || !req.body.sessionId){
        return res.status(400).send({error: "One or more parameters missing"})
    } else {
        sessions.forEach((element) => {
            if (element.user == req.body.username || element.id == req.body.sessionId) {
                sessions.splice(element)
                return res.status(201).send({success: true})
            } else {
                return res.status(401).send({error: "Invalid sessionId or username"})
            }
        })
    } 
})

app.delete('/events/:id', (req, res) => {

    let auth = req.headers.authorization

    if(!auth){
        return res.status(400).send({error: "Missing authorization header"})
    } else {
        try{
            let obj = sessions.find(o => o.id == auth)

            if(!obj.isAdmin){
                return res.status(403).send({error: "Unathorized"})
            } else {

                if(!events[req.params.id-1]){
                    return res.status(404).send({error: "Event not found"})
                }

                events.splice(req.params.id - 1, 1)

                for(let i = 0; i < events.length; i++){
                    events[i].id = i +1
                }
                expressWs.getWss().clients.forEach(client => client.send(req.params.id));
                return res.status(200).send({success: true})
            }

        }
        catch(error){
            console.log(error)
            return res.status(401).send({error: "Session not found"})
        }

    }
})

app.listen(8080, () => {
    console.log(`API up at: http://localhost:8080`)
})