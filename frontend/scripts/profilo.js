const { createApp } = Vue;

createApp({
    data() {
        return {
            isLoading: true,
            isEditing: false,
            messaggio: '',
            tipoMessaggio: '',
            userEmail: '',
            userRuolo: '',
            form: {
                nome: '',
                cognome: '',
                indirizzoPrincipale: '',
                notificaApp: true,
                notificaEmail: false
            }
        }
    },
    mounted() {
        this.caricaDatiUtente();
    },
    methods: {
        async caricaDatiUtente() {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:3000/api/v1/utenti/me', {
                    headers: { 
                        'Authorization': 'Bearer ' + token,
                        'x-access-token': token
                    }
                });

                if (!response.ok) throw new Error("Errore nel caricamento dati");

                const data = await response.json();
                
                if (data.success && data.user) {
                    this.userEmail = data.user.email;
                    this.userRuolo = data.user.ruolo;
                    
                    this.form.nome = data.user.nome || '';
                    this.form.cognome = data.user.cognome || '';
                    this.form.indirizzoPrincipale = data.user.indirizzoPrincipale || '';
                    
                    if (data.user.preferenzeNotifiche) {
                        this.form.notificaApp = data.user.preferenzeNotifiche.app;
                        this.form.notificaEmail = data.user.preferenzeNotifiche.email;
                    }
                }
            } catch (err) {
                console.error(err);
                this.messaggio = "Impossibile caricare il profilo. Il token potrebbe essere scaduto.";
                this.tipoMessaggio = "error";
            } finally {
                this.isLoading = false;
            }
        },

        async salvaModifiche() {
            this.messaggio = "Salvataggio in corso...";
            this.tipoMessaggio = "";
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch('http://localhost:3000/api/v1/utenti/me', {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                        'x-access-token': token
                    },
                    body: JSON.stringify(this.form)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.messaggio = "Profilo aggiornato con successo!";
                    this.tipoMessaggio = "success";
                    this.isEditing = false;
                    
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    throw new Error(data.message || "Errore durante l'aggiornamento");
                }
            } catch (err) {
                console.error(err);
                this.messaggio = "Errore durante il salvataggio dei dati.";
                this.tipoMessaggio = "error";
            }
        },

        eseguiLogout() {
            if(confirm("Sei sicuro di voler uscire?")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }
    }
}).mount('#app');