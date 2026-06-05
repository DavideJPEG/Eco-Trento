/**
 * ECOTRENTO - Dashboard Operatore (Gestione Ingombranti)
 * Architettura: Vue.js 3 (CDN) - API RESTful
 */

const { createApp } = Vue;

createApp({
    data() {
        return {
            richieste: [],
            filtro: '',
            isLoading: true,
            messaggio: '',
            tipoMessaggio: '',
            apiBaseUrl: 'http://localhost:3000', // Base URL per lo sviluppo locale
            linguaAttuale: localStorage.getItem('eco_lang') || 'it', // Lingua attuale
        };
    },
    mounted() {
        this.caricaRichieste();
    },
    methods: {
        t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        /**
         * Recupera il token da localStorage e formatta gli header
         */
        getAuthHeaders() {
            const token = localStorage.getItem('token'); 
            
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-access-token': token
            };
        },

        /**
         * GET: Recupera la lista globale delle richieste
         */
        async caricaRichieste() {
            this.isLoading = true;
            this.nascondiMessaggio();

            try {
                let url = `${this.apiBaseUrl}/api/v1/ingombranti`;
                if (this.filtro) {
                    url += `?stato=${this.filtro}`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Errore Server: ${response.status}`);
                }

                // Il backend restituisce direttamente l'array
                this.richieste = await response.json();

            } catch (error) {
                console.error('[ECOTRENTO] Errore API GET:', error);
                this.mostraMessaggio("Errore nel caricamento delle richieste.", 'error');
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * PATCH: Cambia lo stato della richiesta chiamando l'endpoint dedicato
         */
        async aggiornaStato(selfUrl, azione) {
            if (!confirm(`Confermi di voler eseguire l'azione: ${azione.toUpperCase()}?`)) {
                return;
            }

            const targetUrl = `${this.apiBaseUrl}${selfUrl}/${azione}`;

            try {
                const response = await fetch(targetUrl, {
                    method: 'PATCH',
                    headers: this.getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Aggiornamento fallito (Status: ${response.status})`);
                }

                this.mostraMessaggio(`Richiesta aggiornata con successo!`, 'success');
                this.caricaRichieste();

            } catch (error) {
                console.error('[ECOTRENTO] Errore API PATCH:', error);
                this.mostraMessaggio('Errore durante l\'aggiornamento dello stato.', 'error');
            }
        },

        /**
         * Utility UI: Formatta la data dal formato ISO a uno leggibile
         */
        formattaData(dataString) {
            if (!dataString) return 'Data non specificata';
            
            const dateObj = new Date(dataString);
            return dateObj.toLocaleDateString('it-IT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        },

        /**
         * Utility UI: Sostituisce gli underscore ("In_Attesa" -> "In Attesa")
         */
        formattaStato(stato) {
            if (!stato) return 'Sconosciuto';
            return stato.replace(/_/g, ' ');
        },

        mostraMessaggio(testo, tipo) {
            this.messaggio = testo;
            this.tipoMessaggio = tipo;
            setTimeout(() => this.nascondiMessaggio(), 4000);
        },

        nascondiMessaggio() {
            this.messaggio = '';
            this.tipoMessaggio = '';
        }
    }
}).mount('#app');