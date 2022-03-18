const vue = Vue.createApp({
    data() {
        return {
            eventInModal: {name: null}, 
            events: [
                { id: 1, name: "Magnus' Among Us themed Birthday Party", location: "Aedevahe talu, Kursi küla, Harjumaa", date: "2022-08-08 19:00:00", price: "16.50"},
                { id: 2, name: "Joe Nuts' Public Execution", location: "Raekoja plats", date: "2022-03-25 16:00:00",  price: "6.99"},
                { id: 3, name: "Eminmen Concert", location: "Saku Suurhall", date: "2022-06-01 14:00:00", price: "0" }
            ] 
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
        } 
    }  
}).mount('#events')