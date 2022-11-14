window.onload = checkIfLoggedIn();
function showLoginPanel() {
    if (document.getElementById('signIn').style.display == "none") {
        document.getElementById('signIn').style.display = "block";
        document.getElementById('sign-in-btn').textContent = "Close"
    } else {
        document.getElementById('signIn').style.display = "none"
        document.getElementById('sign-in-btn').textContent = "Sign In"
    }
}
function checkIfLoggedIn() {
    if (localStorage.length != 0) {
        document.getElementById('sign-in-btn').style.display = "none"
        document.getElementById('sign-out-btn').style.display = "block"
        if (localStorage.getItem('isAdmin') == 'true') { 
            document.getElementById('deleteBtn').style.display = "block"
            document.getElementById('addBtn').style.display = "block"
            document.getElementById('editBtn').style.display = "block"
        }	
    }
}


const vue = Vue.createApp({
    data() {
        return {
            eventInModal: {name: null}, 
            events: [] 
        }
    },
    async created(){
        try{ 
            this.events = await (await fetch('http://localhost:8080/events')).json();}
        catch(error){
            alert("Something went wrong " + error)
        }
    },
    methods: {
        getEvent: async function (id) {
            this.eventInModal = await (await fetch(`http://localhost:8080/events/${id}`)).json()
            let eventInfoModal = new bootstrap.Modal(document.getElementById('eventInfoModal'), {})
            eventInfoModal.show()
        },
        
        login: async function () {
            this.username = document.querySelector("#username").value
            this.password = document.querySelector("#password").value
            const loginRequest = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: this.username,
                    password: this.password
                })                 
            };

            await fetch("http://localhost:8080/sessions", loginRequest)
            .then(response => response.json())
            .then(data => {
                let signInMsg = document.getElementById("si-error-msg")
                if (data.error){
                    signInMsg.textContent = (data.error)
                } else {
                    localStorage.setItem('sessionId', data.sessionId)
                    localStorage.setItem('isAdmin', data.isAdmin)
                    localStorage.setItem('username', this.username)
                    document.getElementById("signIn").style.display = "none"
                    document.getElementById("sign-in-btn").style.display = "none"
                    document.getElementById("sign-out-btn").style.display = "block"
                    signInMsg.textContent = ""

                    if(localStorage.getItem('isAdmin') == 'true'){
                        deleteBtn = document.getElementById('deleteBtn'); 
                        addBtn = document.getElementById('addBtn')      
                        editBtn = document.getElementById("editBtn")
                        deleteBtn.style.display = "block"
                        addBtn.style.display = "block"
                        editBtn.style.display = "block"
                    }  
                } 
            })
        },

        logout: async function () {
            const logoutRequest = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sessionId: localStorage.getItem('sessionId'),
                    username: localStorage.getItem('username')
                }) 
            }

            document.getElementById("sign-in-btn").style.display = "block"
            document.getElementById("sign-out-btn").style.display = "none"
            document.getElementById("sign-in-btn").textContent = "Sign In"
            document.getElementById("deleteBtn").style.display = "none"
            document.getElementById("addBtn").style.display = "none"
            document.getElementById("editBtn").style.display ="none"
            localStorage.clear()

            await fetch("http://localhost:8080/logout", logoutRequest)
            .then(response => response.json())
            .then(data => {
                const signOutMsg = document.getElementById("so-error-msg")
                if (data.error) {
                    signOutMsg.textContent = (data.error)
                }
            })
        },

        deleteEvent: async function (id) {
            const deleteRequest = {
                method: "DELETE",
                headers: {
                    "Authorization": localStorage.getItem('sessionId')
                },
                body: {}  
            }

            await fetch(`http://localhost:8080/events/${id}`, deleteRequest)
            .then(response => response.json())
            .then((data) => {
                if(data.error){
                    alert("Something went wrong, try again later \n" + data.error)
                }
            })
            
        },

        removeEvent: function (id) {
            this.events.splice(id-1,1)
            for(let i = 0; i < this.events.length; i++){
                this.events[i].id = i +1
            }
            
        },

        showAddEventModal: function () {
            let eventAddModal = new bootstrap.Modal(document.getElementById('addEventModal'), {})
            eventAddModal.show()
        },

        addEvent: async function () {

            this.addName = document.getElementById('addEventName').value
            this.addLocation = document.getElementById('addEventLocation').value
            this.addDate = document.getElementById('addEventDate').value
            this.addPrice = document.getElementById('addEventPrice').value

            this.addDate = this.addDate.replace("T", " ")

            const addRequest = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem('sessionId')
                },
                body: JSON.stringify({
                    name: this.addName,
                    location: this.addLocation,
                    date: this.addDate,
                    price: this.addPrice
                })                 
            }

            await fetch('http://localhost:8080/events', addRequest)
            .then(response => response.json())
            .then((data) => {
                if(data.error){
                    alert("Something went wrong, try again later \n" + data.error)
                }
            })

            this.addName.value = ""
            this.addLocation.value = ""
            this.addDate.value = ""
            this.addPrice.value = ""

            this.events = await (await fetch('http://localhost:8080/events')).json();
        },
        
        newOrEditEvent: function (eventData) {

            if(eventData.id > this.events.length){
                let newEvent = JSON.parse(eventData)
                this.events.push(newEvent)
            }else{
                eventData = JSON.parse(eventData)
                this.events[eventData.id-1] = eventData
                
            }
            
            
        },

        showEditEventModal: function (){
            let eventEditModal = new bootstrap.Modal(document.getElementById('editEventModal'), {})
            eventEditModal.show()
        },
        
        editEvent: async function (id) {

            

            this.editName = document.getElementById('editEventName').value
            this.editLocation = document.getElementById('editEventLocation').value
            this.editDate = document.getElementById('editEventDate').value
            this.editPrice = document.getElementById('editEventPrice').value

            this.editDate = this.editDate.replace("T", " ")

            const editRequest = {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem('sessionId')
                },
                body: JSON.stringify({
                    name: this.editName,
                    location: this.editLocation,
                    date: this.editDate,
                    price: this.editPrice
                }) 
            }

            await fetch(`http://localhost:8080/events/${id}`, editRequest)
            .then(response => response.json())
            .then((data) => {
                if(data.error){
                    alert("Something went wrong, try again later \n" + data.error)
                }
            })

            this.events = await (await fetch('http://localhost:8080/events')).json();

            document.getElementById('editEventName').value = ""
            document.getElementById('editEventLocation').value = ""
            document.getElementById('editEventDate').value = ""
            document.getElementById('editEventPrice').value = ""


        }
    }
}).mount('body')

const connection = new WebSocket("ws://localhost:8080/")
    connection.onmessage = function (event) {
        console.log(event.data)
        
        if (event.data.length > 3) {
            vue.newOrEditEvent(event.data)
        } else {
            vue.removeEvent(event.data)
        }
    }