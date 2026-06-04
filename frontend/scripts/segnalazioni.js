const { createApp } = Vue;

createApp({
    data() {
        return {
            form: { tipo: '', via: '', descrizione: '' },
            messaggio: '',
            tipoMessaggio: ''
        }
    },
    methods: {
        async submitSegnalazione() {
            this.messaggio = "Invio segnalazione in corso...";
            this.tipoMessaggio = "";
            
            const token = localStorage.getItem('token');
            
            // Prepariamo il pacco per il backend.
            // Concateniamo la via alla descrizione per non perdere l'info.
            const payload = {
                titolo: this.form.tipo,
                descrizione: `${this.form.descrizione} \n[Indirizzo Segnalato: ${this.form.via}]`,
                via: "507f1f77bcf86cd799439011" // ID finto per la tabella strade
            };

            try {
                const response = await fetch('http://localhost:3000/api/v1/segnalazioni', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                        'x-access-token': token
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.messaggio = "Segnalazione inviata con successo! Grazie per il tuo aiuto.";
                    this.tipoMessaggio = "success";
                    
                    // Svuoto il form
                    this.form = { tipo: '', via: '', descrizione: '' };
                    
                    // Riporto l'utente alla home dopo 2 secondi
                    setTimeout(() => { window.location.href = 'main.html'; }, 2000);
                } else {
                    const data = await response.json();
                    throw new Error(data.message || "Errore durante l'invio");
                }

            } catch (err) {
                console.error(err);
                this.messaggio = "Errore di connessione al server o sessione scaduta.";
                this.tipoMessaggio = "error";
            }
        }
    }
}).mount('#app');