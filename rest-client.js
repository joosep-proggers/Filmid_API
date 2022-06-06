const vue = Vue.createApp({
    data() {
        return {
            eventInModal: {name: null}, 
            events: [] 
        }
    },
    async created(){
        this.events = await (await fetch('http://localhost:8080/events')).json();
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
                const signInMsg = document.getElementById("si-error-msg")
                if (data.error){
                    signInMsg.textContent = (data.error)
                } else {
                    localStorage.setItem('sessionId', data.sessionId)
                    localStorage.setItem('isAdmin', data.isAdmin)
                    localStorage.setItem('username', this.username)
                    document.getElementById("signIn").style.display = "none"
                    document.getElementById("sign-in-btn").style.display = "none"
                    document.getElementById("sign-out-btn").style.display = "block"

                    if(localStorage.getItem('isAdmin') == 'true'){
                        deleteBtn = document.getElementById('deleteBtn');       
                        deleteBtn.style.display = "block"
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
            await fetch("http://localhost:8080/logout", logoutRequest)
            .then(response => response.json())
            .then(data => {
                const signOutMsg = document.getElementById("so-error-msg")
                if (data.error) {
                    signOutMsg.textContent = (data.error)
                } else {
                    document.getElementById("sign-in-btn").style.display = "block"
                    document.getElementById("sign-out-btn").style.display = "none"
                    document.getElementById("sign-in-btn").textContent = "Sign In"
                    document.getElementById("deleteBtn").style.display = "none"
                    localStorage.clear()
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
            .then(data => console.log(data))

            this.events = await (await fetch('http://localhost:8080/events')).json();
        }
    }  
}).mount('body')