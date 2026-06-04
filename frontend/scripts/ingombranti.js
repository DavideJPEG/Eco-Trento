const { createApp } = Vue;

createApp({
    data() {
        return {
            form: { oggetto: '', data: '', indirizzo: '', fasciaOraria: '' },
            messaggio: '',
            tipoMessaggio: ''
        }
    },
    methods: {
        async submitRichiesta() {
            this.messaggio = "Invio in corso...";
            this.tipoMessaggio = "";
            
            const testoUnito = `${this.form.oggetto} - Indirizzo digitato: ${this.form.indirizzo}`;
            const token = localStorage.getItem('token'); // Recuperiamo il token dal browser

            const payload = {
                descrizioneOggetti: testoUnito,
                dataRitiroRichiesta: this.form.data,
                fasciaOraria: this.form.fasciaOraria,
                viaRitiro: "507f1f77bcf86cd799439011" // L'ID finto per superare il blocco delle Strade
            };

            try {
                const response = await fetch('http://localhost:3000/api/v1/ingombranti', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                        'x-access-token': token
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.messaggio = "Richiesta inviata con successo!";
                    this.tipoMessaggio = "success";
                    
                    this.form = { oggetto: '', data: '', indirizzo: '', fasciaOraria: '' };
                    
                    setTimeout(() => { window.location.href = 'main.html'; }, 2000);
                } else {
                    throw new Error("Errore durante l'invio");
                }

            } catch (err) {
                console.error(err);
                this.messaggio = "Accesso negato o errore del server.";
                this.tipoMessaggio = "error";
            }
        }
    }
}).mount('#app');