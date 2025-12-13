// ==================================================
// APPARITION DOUCE AU SCROLL
// ==================================================
const elements = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
elements.forEach(el => observer.observe(el));

// ==================================================
// NOTIFICATION PERSONNALISÉE
// ==================================================
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

// ==================================================
// VALIDATION : nomX1 OBLIGATOIRE (bloc Mairie uniquement)
// ==================================================
function validateRequiredNames() {
    const firstBloc = document.getElementById('nomsMairie');
    const firstInput = firstBloc.querySelector('input[name^="nom"]');
    if (!firstInput.value.trim()) {
        firstInput.focus();
        showCustomAlert('Champ obligatoire', 'Merci de renseigner au moins un nom et prénom pour la mairie.');
        return false;
    }
    return true;
}

// ==================================================
// OUTIL : GÉNÉRATION DES CHAMPS NOM / PRÉNOM
// ==================================================
function generateNameFields(container, prefix, count) {
    container.innerHTML = '';
    const total = count > 0 ? count : 1; // Toujours au moins 1 champ
    for (let i = 1; i <= total; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `${prefix}${i}`;
        input.className = 'form-control mb-2';
        input.placeholder = i === 1 ? 'Nom et prénom' : 'Nom et prénom';
        container.appendChild(input);
    }
}

// ==================================================
// GESTION VIDÉO & SON
// ==================================================
const video = document.getElementById('videoMariage');
const soundBtn = document.getElementById('soundBtn');
if (video) {
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    video.play().catch(() => { });
                    if (soundBtn) soundBtn.style.display = 'block';
                }, 3000);
                videoObserver.unobserve(video);
            }
        });
    }, { threshold: 0.5 });
    videoObserver.observe(video);
}
function enableSound() {
    if (!video) return;
    video.muted = false;
    video.play();
    if (soundBtn) soundBtn.style.display = 'none';
}
if (soundBtn) soundBtn.addEventListener('click', enableSound);

// ==================================================
// ENVOI DU FORMULAIRE (GOOGLE APPS SCRIPT) AVEC LOADER
// ==================================================
const form = document.getElementById('rsvpForm');
if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!validateRequiredNames()) return;

        // Désactiver le bouton et afficher loader
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Envoi...`;

        const data = new FormData(form);
        fetch('https://script.google.com/macros/s/AKfycbzqesjeTlRb2hyN6byRF9DJG-D_fgUWzkjKhKZniw-fsemA4QOl2p3BZFnxf-9Lpo6i/exec', {
            method: 'POST',
            body: data
        })
            .then(res => res.json())
            .then(res => {
                if (res.result === 'success') {
                    showCustomAlert('Merci ❤️', 'Votre réponse a bien été enregistrée !');
                    resetFormState();
                } else {
                    showCustomAlert('Oups 😕', 'Une erreur est survenue : ' + res.message);
                }
            })
            .catch(err => showCustomAlert('Erreur 😢', err.message))
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
    });
}

// ==================================================
// RESET COMPLET DU FORMULAIRE
// ==================================================
function resetFormState() {
    form.reset();
    document.querySelectorAll('.rsvp-subsection').forEach(bloc => {
        const select = bloc.querySelector('.nombre-select');
        if (select) select.value = '0';
        const nomsDiv = bloc.querySelector('[id^="noms"]');
        if (nomsDiv) generateNameFields(nomsDiv, nomsDiv.id.replace('noms', 'nom'), 1);
        bloc.classList.remove('d-none'); // Nom visible
        if (select) select.classList.add('d-none'); // Select caché par défaut
    });
}

// ==================================================
// INITIALISATION DYNAMIQUE DU FORMULAIRE
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des champs Nom/Prénom pour tous les blocs
    document.querySelectorAll('.rsvp-subsection').forEach(bloc => {
        const nomsDiv = bloc.querySelector('[id^="noms"]');
        if (!nomsDiv) return;
        const prefix = nomsDiv.id.replace('noms', 'nom');
        generateNameFields(nomsDiv, prefix, 1);
        bloc.classList.remove('d-none'); // Nom visible
        const select = bloc.querySelector('.nombre-select');
        if (select) select.classList.add('d-none'); // Select caché par défaut
    });

    // Gestion des radios Oui / Non
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', e => {
            const name = e.target.name;
            const value = e.target.value;
            const blocId = 'bloc' + name.replace('presence', '');
            const bloc = document.getElementById(blocId);
            if (!bloc) return;

            const select = bloc.querySelector('.nombre-select');
            const nomsDiv = bloc.querySelector('[id^="noms"]');
            const prefix = nomsDiv.id.replace('noms', 'nom');

            if (value === 'Oui') {
                if (select) select.classList.remove('d-none'); // Affiche le select
                const nb = parseInt(select.value, 10) || 1;
                generateNameFields(nomsDiv, prefix, nb);
            } else {
                if (select) select.classList.add('d-none'); // Masque le select si Non
                generateNameFields(nomsDiv, prefix, 1); // Toujours 1 Nom/Prénom
            }
        });
    });

    // Changement du nombre de personnes
    document.querySelectorAll('.nombre-select').forEach(select => {
        select.addEventListener('change', e => {
            const targetId = e.target.dataset.target;
            const container = document.getElementById(targetId);
            if (!container) return;
            const prefix = targetId.replace('noms', 'nom');
            const nb = parseInt(e.target.value, 10);
            generateNameFields(container, prefix, nb);
        });
    });
});
