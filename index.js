const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());        // Avoid CORS errors in browsers
app.use(express.json()) // Populate req.body

const events = [
    { id: 1, name: "Magnus' Among Us themed Birthday Party", location: "Aedevahe talu, Kursi küla, Harjumaa", date: "2022-08-08 19:00:00", price: "16.50"},
    { id: 2, name: "Joe Nuts' Public Execution", location: "Raekoja plats", date: "2022-03-25 16:00:00",  price: "6.99"},
    { id: 3, name: "Eminmen Concert", location: "Saku Suurhall", date: "2022-06-01 14:00:00", price: "0" }
]

app.get('/items', (req, res) => {
    res.send(events)
})


app.get('/events', (req, res) => {
    res.send(events)
})

app.get('/events/:id', (req, res) => {
    if (typeof events[req.params.id - 1] === 'undefined') {
        return res.status(404).send({ error: "Event not found" })
    }
    res.send(events[req.params.id - 1])
})

app.post('/events', (req, res) => {
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
    res.status(201).location('localhost:8080/events/' + (events.length - 1)).send(
        newEvent
    )
})

app.listen(8080, () => {
    console.log(`API up at: http://localhost:8080`)
})