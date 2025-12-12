// --- Apparition douce au scroll ---
const elements = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
elements.forEach(el => observer.observe(el));


// --- Notification personnalisée ---
function showCustomAlert(title, message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
        <button>Fermer</button>
    `;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.classList.add('show'), 50);

    alertBox.querySelector('button').addEventListener('click', () => {
        alertBox.classList.remove('show');
        setTimeout(() => alertBox.remove(), 400);
    });
}


// --- Envoi du formulaire (Google Apps Script endpoint) ---
const form = document.getElementById('rsvpForm');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();

        const data = new FormData(form);

        fetch('https://script.google.com/macros/s/AKfycbzqesjeTlRb2hyN6byRF9DJG-D_fgUWzkjKhKZniw-fsemA4QOl2p3BZFnxf-9Lpo6i/exec', {
            method: 'POST',
            body: data
        })
            .then(res => res.json())
            .then(res => {
                if (res.result === 'success') {
                    showCustomAlert('Merci ❤️', 'Votre réponse a bien été enregistrée !');
                    form.reset();

                    // On masque les blocs et vide les sous-champs après reset
                    document.querySelectorAll('.rsvp-subsection').forEach(b => b.classList.add('d-none'));
                    document.querySelectorAll('[id^="noms"]').forEach(div => div.innerHTML = '');
                } else {
                    showCustomAlert('Oups 😕', 'Une erreur est survenue : ' + res.message);
                }
            })
            .catch(err => showCustomAlert('Erreur 😢', err.message));
    });
}


// --- Gestion vidéo et son ---
const video = document.getElementById("videoMariage");
const soundBtn = document.getElementById("soundBtn");

if (video) {
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    video.play().catch(() => { });
                    if (soundBtn) soundBtn.style.display = "block";
                }, 3000);
                observer.unobserve(video);
            }
        });
    }, { threshold: 0.5 });

    videoObserver.observe(video);
}

function enableSound() {
    if (!video) return;
    video.muted = false;
    video.play();
    if (soundBtn) soundBtn.style.display = "none";
}

if (soundBtn) soundBtn.addEventListener("click", enableSound);


// --- Initialisation dynamique des blocs du formulaire ---
document.addEventListener("DOMContentLoaded", () => {

    // Affiche ou masque les blocs selon Oui / Non
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const name = e.target.name;            // ex: presenceMairie
            const value = e.target.value;          // Oui ou Non
            const bloc = document.getElementById('bloc' + name.replace('presence', ''));

            if (!bloc) return;

            if (value === 'Oui') {
                bloc.classList.remove('d-none');

                // 👉 Ajout important : générer automatiquement le champ pour 1 personne
                const select = bloc.querySelector('.nombre-select');
                if (select) {
                    select.dispatchEvent(new Event('change'));
                }

            } else {
                bloc.classList.add('d-none');
                bloc.querySelectorAll('input, select').forEach(el => el.value = '');
                const nomsDiv = bloc.querySelector('[id^="noms"]');
                if (nomsDiv) nomsDiv.innerHTML = '';
            }
        });
    });

    // Génère les champs pour le nombre de personnes
    document.querySelectorAll('.nombre-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const targetId = e.target.getAttribute('data-target'); // ex: nomsMairie
            const container = document.getElementById(targetId);

            container.innerHTML = ''; // reset

            const nb = parseInt(e.target.value, 10);
            const prefix = targetId.replace('noms', 'nom'); // ex: nomsMairie -> nomMairie

            for (let i = 1; i <= nb; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `${prefix}${i}`;
                input.classList.add('form-control', 'mb-2');
                input.placeholder = `Nom et prenom ${i}`;
                container.appendChild(input);
            }
        });
    });

});
