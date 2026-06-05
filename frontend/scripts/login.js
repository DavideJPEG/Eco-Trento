const { createApp } = Vue;

createApp({
    data() {
        return {
            mode: 'login',
            errorMessage: '',
            successMessage: '',
            loginData: { email: '', password: '' },
            registerData: { nome: '', cognome: '', email: '', password: '' },
            linguaAttuale: localStorage.getItem('eco_lang') || 'it',
        }
    },
    methods: {

        t(chiave) { return window.i18n ? window.i18n.t(chiave) : chiave; },
impostaLingua(lang) { if(window.i18n) window.i18n.cambiaLingua(lang); },

        // FUNZIONE PER IL LOGIN
        async handleLogin() {
            this.errorMessage = '';
            try {
                const response = await fetch('http://localhost:3000/api/v1/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: this.loginData.email,
                        password: this.loginData.password
                    })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || 'Errore durante il login');

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                window.location.href = 'main.html';
            } catch (err) {
                this.errorMessage = err.message;
            }
        },

        // FUNZIONE PER LA REGISTRAZIONE
        async handleRegister() {
            this.errorMessage = '';
            this.successMessage = '';

            try {
                const payload = {
                    nome: this.registerData.nome,
                    cognome: this.registerData.cognome,
                    email: this.registerData.email,
                    password: this.registerData.password,
                    via: "507f1f77bcf86cd799439011"
                };

                const response = await fetch('http://localhost:3000/api/v1/utenti/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || 'Errore durante la registrazione');

                this.successMessage = "Registrazione completata! Ora puoi fare il login.";
                this.mode = 'login'; 
            } catch (err) {
                this.errorMessage = err.message;
            }
        }
    }
}).mount('#app');