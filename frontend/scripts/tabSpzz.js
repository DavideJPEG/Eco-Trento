const { createApp } = Vue;

createApp({
    data() {
        return {
            quartieri: [],
            selectedQuartiereUrl: '', 
            pdfLink: '',
            isLoading: false,
            isMocking: false ,
            linguaAttuale: localStorage.getItem('eco_lang') || 'it',
        }
    },
    mounted() {
        this.fetchQuartieri();
    },
    methods: {

        t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        async fetchQuartieri() {
            try {
                const response = await fetch('http://localhost:3000/api/v1/quartieri');
                const data = await response.json();

                if (data && data.length > 0) {
                    this.quartieri = data;
                    this.selectedQuartiereUrl = data[0].calendario;
                    this.fetchPdfLink();
                } else {
                    throw new Error("Nessun quartiere nel database");
                }
            } catch (err) {
                console.warn("Database vuoto o irraggiungibile. Attivo i dati finti per farti testare l'UI!");
                this.abilitaDatiFinti();
            }
        },

        async fetchPdfLink() {
            if (this.isMocking) {
                this.pdfLink = 'https://www.dolomitiambiente.it/content/download/12411/129994/version/1/file/Trento_Centro.pdf';
                return;
            }

            this.isLoading = true;
            this.pdfLink = '';

            try {
                const response = await fetch('http://localhost:3000' + this.selectedQuartiereUrl);
                const data = await response.json();
                
                if(data.link) {
                    this.pdfLink = data.link;
                }
            } catch (err) {
                console.error("Errore nel caricamento del calendario", err);
            } finally {
                this.isLoading = false;
            }
        },

        abilitaDatiFinti() {
            this.isMocking = true;
            this.quartieri = [
                { nome: 'Centro Storico (Dati Finti)', calendario: 'fake1' },
                { nome: 'Oltrefersina (Dati Finti)', calendario: 'fake2' }
            ];
            this.selectedQuartiereUrl = 'fake1';
            this.fetchPdfLink();
        }
    }
}).mount('#app');