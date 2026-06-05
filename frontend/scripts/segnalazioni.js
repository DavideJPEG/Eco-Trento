const { createApp } = Vue;

createApp({
    data() {
        return {
            form: { tipo: '', via: '', descrizione: '' },
            messaggio: '',
            tipoMessaggio: '',
            linguaAttuale: localStorage.getItem('eco_lang') || 'it',
        }
    },
    methods: {
        // Metodo per la lingua
       t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        async submitSegnalazione() {
            this.messaggio = this.t('msg_invio_segnalazione');
            this.tipoMessaggio = "";
            
            const token = localStorage.getItem('token');
            
            const payload = {
                tipo: this.form.tipo, 
                descrizione: `${this.form.descrizione} \n[${this.t('msg_indirizzo_segnalato')}: ${this.form.via}]`,
                via: "507f1f77bcf86cd799439011" 
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
                    this.messaggio = this.t('msg_segnalazione_successo');
                    this.tipoMessaggio = "success";
                    
                    this.form = { tipo: '', via: '', descrizione: '' };
                    
                    setTimeout(() => { window.location.href = 'main.html'; }, 2000);
                } else {
                    const data = await response.json();
                    throw new Error(data.message || "Errore durante l'invio");
                }

            } catch (err) {
                console.error(err);
                this.messaggio = this.t('msg_errore_connessione');
                this.tipoMessaggio = "error";
            }
        }
    }
}).mount('#app');