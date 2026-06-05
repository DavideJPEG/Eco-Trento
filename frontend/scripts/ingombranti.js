const { createApp } = Vue;

createApp({
    data() {
        return {
            form: { oggetto: '', data: '', indirizzo: '', fasciaOraria: '' },
            messaggio: '',
            tipoMessaggio: '',
            linguaAttuale: localStorage.getItem('eco_lang') || 'it',
        }
    },
    methods: {
        // Metodo per la lingua
       t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        async submitRichiesta() {
            this.messaggio = this.t('msg_invio_corso');
            this.tipoMessaggio = "";
            
            const testoUnito = `${this.form.oggetto} - ${this.t('msg_indirizzo_digitato')}: ${this.form.indirizzo}`;
            const token = localStorage.getItem('token'); 

            const payload = {
                descrizioneOggetti: testoUnito,
                dataRitiroRichiesta: this.form.data,
                fasciaOraria: this.form.fasciaOraria,
                viaRitiro: "507f1f77bcf86cd799439011" 
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
                    this.messaggio = this.t('msg_richiesta_successo');
                    this.tipoMessaggio = "success";
                    
                    this.form = { oggetto: '', data: '', indirizzo: '', fasciaOraria: '' };
                    
                    setTimeout(() => { window.location.href = 'main.html'; }, 2000);
                } else {
                    throw new Error("Errore durante l'invio");
                }

            } catch (err) {
                console.error(err);
                this.messaggio = this.t('msg_errore_server');
                this.tipoMessaggio = "error";
            }
        }
    }
}).mount('#app');