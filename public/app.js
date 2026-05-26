// --- GOOGLE SIGN IN LOGIC ---
window.handleCredentialResponse = function(response) {
    // Cuando el usuario se loguea con Google, abrimos el modal para pedir/confirmar su nombre.
    // Para simplificar el prototipo, no decodificaremos el JWT de Google (response.credential),
    // simplemente abrimos el modal para que el usuario ingrese su nombre y la lógica de Admin.
    
    const modal = document.getElementById('name-modal');
    modal.classList.remove('hidden');
    
    // Si GSAP está disponible, animamos la entrada del modal
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(modal.querySelector('div'), 
            { scale: 0.9, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
    }
};

window.onload = function () {
    // Inicializar Google Identity Services
    google.accounts.id.initialize({
        client_id: "1040900213875-67mr6d8bkhifr251jrun6g7smmcbup8r.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    // Renderizar el botón en el contenedor
    const googleBtnContainer = document.getElementById("google-btn-container");
    if (googleBtnContainer) {
        google.accounts.id.renderButton(
            googleBtnContainer,
            { theme: "outline", size: "large", shape: "pill", text: "signin_with" }
        );
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    const API_BASE_URL = "";

    // --- GSAP SAFE WRAPPER ---
    let gsapAvailable = false;
    try {
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            gsapAvailable = true;
            
            // Animate Navigation
            gsap.fromTo('.nav-btn', 
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.5)', delay: 0.1 }
            );

            // Animate Hero section on load
            gsap.fromTo('.hero-text > *', 
                { y: 40, opacity: 0, scale: 0.98 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.2)', delay: 0.3 }
            );
            
            gsap.fromTo('.hero-image', 
                { x: 30, opacity: 0, rotationY: 15 },
                { x: 0, opacity: 1, rotationY: 0, duration: 1.2, delay: 0.5, ease: 'power3.out' }
            );

            // Animate Search Bar and benefits
            gsap.fromTo('.hero-text input, .hero-text button',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.8 }
            );

            // Continuous pulse on priority button
            gsap.to('[data-time="11:30 AM"]', {
                scale: 1.05,
                boxShadow: "0px 0px 15px rgba(22, 163, 74, 0.4)",
                repeat: -1,
                yoyo: true,
                duration: 1.5,
                ease: "sine.inOut"
            });

            // 3D Tilt Effect for cards
            const tiltCards = document.querySelectorAll('.group');
            tiltCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;
                    
                    gsap.to(card, {
                        rotateX: rotateX,
                        rotateY: rotateY,
                        transformPerspective: 1000,
                        ease: 'power1.out',
                        duration: 0.4
                    });
                });
                
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        rotateX: 0,
                        rotateY: 0,
                        ease: 'elastic.out(1, 0.3)',
                        duration: 1
                    });
                });
            });

        }
    } catch (e) {
        console.warn("GSAP Animations failed to load. UI will remain visible without animations.");
    }

    // --- NAME MODAL & ADMIN LOGIC ---
    const saveNameBtn = document.getElementById('save-name-btn');
    const nameInput = document.getElementById('display-name-input');
    const nameModal = document.getElementById('name-modal');
    const googleBtnContainer = document.getElementById('google-btn-container');
    const userProfileContainer = document.getElementById('user-profile-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const navAdminBtn = document.getElementById('nav-admin-btn');
    const navSolicitudesBtn = document.getElementById('nav-solicitudes-btn');
    const navHelperBtn = document.getElementById('nav-helper-btn');
    const roleOptions = document.querySelectorAll('.role-option');
    
    let isUserAdmin = false;
    let currentUserName = "Usuario de Prueba";
    let userRole = "cliente";
    let helperProfile = null;
    let pendingRatingApptId = null;
    let selectedRating = 0;

    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            roleOptions.forEach(o => {
                o.classList.remove('border-2', 'border-accent-green', 'bg-accent-green-light/30');
                o.classList.add('border', 'border-card-border');
            });
            option.classList.remove('border', 'border-card-border');
            option.classList.add('border-2', 'border-accent-green', 'bg-accent-green-light/30');
            option.querySelector('input').checked = true;
        });
    });

    function updateNavForRole() {
        if (userRole === 'ayudante') {
            navSolicitudesBtn.classList.remove('hidden');
            navHelperBtn.classList.remove('hidden');
        } else {
            navSolicitudesBtn.classList.add('hidden');
            navHelperBtn.classList.add('hidden');
        }
    }

    async function saveHelperProfile(skills, bio) {
        const response = await fetch(`${API_BASE_URL}/api/helpers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentUserName, skills, bio })
        });
        if (response.ok) {
            const data = await response.json();
            helperProfile = data.helper;
        }
    }

    async function loadHelperProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/helpers?name=${encodeURIComponent(currentUserName)}`);
            if (response.ok) {
                helperProfile = await response.json();
                if (helperProfile) renderHelperProfile();
            }
        } catch (e) {
            console.error("Error cargando perfil ayudante:", e);
        }
    }

    function renderHelperProfile() {
        if (!helperProfile) return;
        document.getElementById('helper-profile-name').textContent = helperProfile.name;
        document.getElementById('helper-avatar').textContent = helperProfile.name.charAt(0).toUpperCase();
        document.getElementById('helper-bio').value = helperProfile.bio || '';
        document.getElementById('helper-jobs-count').textContent = helperProfile.completedJobs || 0;

        const avg = helperProfile.ratingCount > 0
            ? (helperProfile.ratingSum / helperProfile.ratingCount).toFixed(1)
            : null;
        document.getElementById('helper-rating-display').textContent = avg
            ? `${avg} (${helperProfile.ratingCount} reseñas)`
            : 'Sin calificaciones';

        document.querySelectorAll('.helper-skill-check').forEach(cb => {
            cb.checked = (helperProfile.skills || []).includes(cb.value);
        });

        renderHelperJobs();
    }

    function renderHelperJobs() {
        const container = document.getElementById('helper-jobs-list');
        const myJobs = appointments.filter(a => a.helperName === currentUserName && a.status !== 'Pendiente');

        if (myJobs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Aún no tienes trabajos asignados.</p>';
            return;
        }

        container.innerHTML = myJobs.map(appt => {
            const statusClass = appt.status === 'Completado'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700';
            const completeBtn = appt.status === 'Asignado'
                ? `<button class="helper-complete-btn text-accent-green hover:underline text-sm font-semibold" data-id="${appt.id}">Marcar completado</button>`
                : '';
            return `
                <div class="p-4 border border-card-border rounded-xl">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold">${escapeHtml(appt.service)}</h4>
                            <p class="text-sm text-gray-500">Cliente: ${escapeHtml(appt.clientName)} · ${escapeHtml(appt.time)}</p>
                        </div>
                        <span class="px-2 py-1 ${statusClass} rounded-lg text-xs font-semibold">${appt.status}</span>
                    </div>
                    ${appt.description ? `<p class="text-sm text-gray-600 mb-2">${escapeHtml(appt.description)}</p>` : ''}
                    <div class="text-right">${completeBtn}</div>
                </div>`;
        }).join('');

        container.querySelectorAll('.helper-complete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                btn.textContent = '...';
                try {
                    await fetch(`${API_BASE_URL}/api/appointments/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    await loadAppointments();
                    await loadHelperProfile();
                } catch (e) {
                    btn.textContent = 'Marcar completado';
                }
            });
        });
    }

    function renderSolicitudes() {
        const container = document.getElementById('solicitudes-list');
        const empty = document.getElementById('solicitudes-empty');
        const skills = helperProfile?.skills || [];
        const available = appointments.filter(a =>
            a.status === 'Pendiente' && skills.includes(a.service)
        );

        container.querySelectorAll('.solicitud-card').forEach(el => el.remove());

        if (available.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        available.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'solicitud-card bg-white p-6 rounded-2xl border border-card-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4';
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-lg">${escapeHtml(appt.service)}</h4>
                    <p class="text-sm text-gray-500">Cliente: ${escapeHtml(appt.clientName)} · ${escapeHtml(appt.time)}</p>
                    ${appt.description ? `<p class="text-sm text-gray-600 mt-2">${escapeHtml(appt.description)}</p>` : ''}
                    <p class="font-display font-bold text-accent-green mt-2">~ $${escapeHtml(String(appt.price))}</p>
                </div>
                <button class="accept-btn px-6 py-3 bg-accent-green text-white rounded-xl font-bold hover:bg-green-700 transition-colors whitespace-nowrap" data-id="${appt.id}">Aceptar</button>`;
            container.appendChild(card);

            card.querySelector('.accept-btn').addEventListener('click', async (e) => {
                const btn = e.target;
                btn.textContent = '...';
                btn.disabled = true;
                try {
                    await fetch(`${API_BASE_URL}/api/appointments/accept`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: appt.id, helperName: currentUserName })
                    });
                    await loadAppointments();
                } catch (err) {
                    btn.textContent = 'Aceptar';
                    btn.disabled = false;
                }
            });
        });
    }

    function renderMyRequests() {
        const section = document.getElementById('my-requests-section');
        const list = document.getElementById('my-requests-list');
        const mine = appointments.filter(a => a.clientName === currentUserName);

        if (userRole !== 'cliente' || mine.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        list.innerHTML = mine.map(appt => {
            let statusBadge = '';
            if (appt.status === 'Pendiente') statusBadge = '<span class="text-orange-600 font-semibold">Esperando ayudante</span>';
            else if (appt.status === 'Asignado') statusBadge = `<span class="text-blue-600 font-semibold">Asignado a ${escapeHtml(appt.helperName)}</span>`;
            else if (appt.status === 'Completado' && !appt.rating) statusBadge = '<span class="text-green-600 font-semibold">Completado — califica abajo</span>';
            else if (appt.rating) statusBadge = `<span class="text-green-600 font-semibold">Completado · ${appt.rating}★</span>`;

            const rateBtn = (appt.status === 'Completado' && !appt.rating)
                ? `<button class="rate-btn mt-2 text-sm text-accent-green font-semibold hover:underline" data-id="${appt.id}" data-helper="${escapeHtml(appt.helperName || '')}">Calificar ayudante</button>`
                : '';

            return `
                <div class="p-4 bg-gray-50 rounded-xl border border-card-border">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold">${escapeHtml(appt.service)}</h4>
                            <p class="text-sm text-gray-500">${escapeHtml(appt.time)} · $${escapeHtml(String(appt.price))}</p>
                        </div>
                        <div class="text-sm text-right">${statusBadge}</div>
                    </div>
                    ${rateBtn}
                </div>`;
        }).join('');

        list.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openRatingModal(btn.getAttribute('data-id'), btn.getAttribute('data-helper'));
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function openRatingModal(apptId, helperName) {
        pendingRatingApptId = apptId;
        selectedRating = 0;
        document.getElementById('rating-modal-subtitle').textContent =
            helperName ? `Califica a ${helperName}` : 'Califica a tu ayudante';
        document.getElementById('rating-modal').classList.remove('hidden');
        document.querySelectorAll('.rating-star').forEach(s => {
            s.classList.remove('text-yellow-400');
            s.classList.add('text-gray-300');
        });
        document.getElementById('submit-rating-btn').disabled = true;
    }

    function checkPendingRatings() {
        if (userRole !== 'cliente') return;
        const toRate = appointments.find(a =>
            a.clientName === currentUserName && a.status === 'Completado' && !a.rating
        );
        if (toRate) openRatingModal(toRate.id, toRate.helperName);
    }

    saveNameBtn.addEventListener('click', async () => {
        let enteredName = nameInput.value.trim();
        if (!enteredName) enteredName = "Usuario Nuevo";

        // Check if name ends with "123"
        if (enteredName.endsWith("123")) {
            isUserAdmin = true;
            // Remove "123" from the display name
            enteredName = enteredName.slice(0, -3).trim();
            // Show Admin Panel button
            navAdminBtn.classList.remove('hidden');
        } else {
            isUserAdmin = false;
            navAdminBtn.classList.add('hidden');
        }

        currentUserName = enteredName;
        userRole = document.querySelector('input[name="user-role"]:checked').value;
        updateNavForRole();

        if (userRole === 'ayudante') {
            await saveHelperProfile(['Montaje'], '');
            await loadHelperProfile();
        }

        // Hide Modal
        nameModal.classList.add('hidden');
        
        // Hide Google Button and Show Profile
        googleBtnContainer.style.display = 'none';
        userProfileContainer.classList.remove('hidden');
        userProfileContainer.classList.add('flex');
        userNameDisplay.textContent = currentUserName;
    });

    // --- TAB NAVIGATION LOGIC ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let isAnimating = false;

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnimating || btn.classList.contains('active')) return;
            
            const targetId = btn.getAttribute('data-target');
            const currentTab = document.querySelector('.tab-content:not(.hidden)');
            const targetTab = document.getElementById(targetId);

            // Update Nav Buttons
            document.querySelectorAll('.nav-btn:not(#nav-admin-btn)').forEach(b => b.classList.remove('active'));
            if(btn.id !== 'nav-admin-btn') {
                btn.classList.add('active');
            }

            if (gsapAvailable) {
                isAnimating = true;
                if (currentTab) {
                    gsap.to(currentTab, {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            currentTab.classList.add('hidden');
                            currentTab.classList.remove('block');
                            
                            targetTab.classList.remove('hidden');
                            targetTab.classList.add('block');
                            
                            gsap.set(targetTab, { opacity: 1, y: 0 });
                            
                            if (targetId === 'solicitudes') renderSolicitudes();
                            if (targetId === 'helper-profile') loadHelperProfile();
                            
                            const childrenToAnimate = targetTab.querySelectorAll(':scope > div > *');
                            gsap.fromTo(childrenToAnimate.length > 0 ? childrenToAnimate : targetTab.children,
                                { opacity: 0, y: 30, scale: 0.98 },
                                { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)', 
                                  onComplete: () => { isAnimating = false; }
                                }
                            );
                        }
                    });
                }
            } else {
                if (currentTab) {
                    currentTab.classList.add('hidden');
                    currentTab.classList.remove('block');
                }
                targetTab.classList.remove('hidden');
                targetTab.classList.add('block');
                if (targetId === 'solicitudes') renderSolicitudes();
                if (targetId === 'helper-profile') loadHelperProfile();
            }
        });
    });

    // --- ON DEMAND / PIDE UN TECNICO LOGIC ---
    const serviceLabels = document.querySelectorAll('#service-options label');
    const timeButtons = document.querySelectorAll('.time-btn');
    const displayPrice = document.getElementById('display-price');
    const btnConfirmService = document.getElementById('btn-confirm-service');
    
    let selectedService = "Montaje";
    let selectedPrice = "15";
    let selectedTime = "11:30 AM";

    // Service Selection
    serviceLabels.forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        input.addEventListener('change', () => {
            serviceLabels.forEach(l => {
                l.classList.remove('border-2', 'border-accent-green', 'bg-accent-green-light/30');
                l.classList.add('border', 'border-card-border', 'bg-white');
            });
            if (input.checked) {
                label.classList.remove('border', 'border-card-border', 'bg-white');
                label.classList.add('border-2', 'border-accent-green', 'bg-accent-green-light/30');
                selectedService = input.value;
                selectedPrice = input.getAttribute('data-price');
                displayPrice.textContent = selectedPrice;
                
                if (gsapAvailable) {
                    gsap.fromTo(label, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
                }
            }
        });
    });

    // Time Selection
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => {
                b.classList.remove('border-2', 'border-accent-green', 'bg-accent-green-light/30', 'text-accent-green', 'font-semibold');
                b.classList.add('border', 'border-card-border');
            });
            btn.classList.remove('border', 'border-card-border');
            btn.classList.add('border-2', 'border-accent-green', 'bg-accent-green-light/30', 'text-accent-green', 'font-semibold');
            selectedTime = btn.getAttribute('data-time');
            
            if (gsapAvailable) {
                gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
            }
        });
    });

    // --- ADMIN PANEL STATE LOGIC ---
    let appointments = [];
    const adminTbody = document.getElementById('admin-appointments-body');
    const emptyStateRow = document.getElementById('empty-state-row');
    const pendingCount = document.getElementById('admin-pending-count');
    
    async function loadAppointments() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/appointments`);
            if (response.ok) {
                appointments = await response.json();
                renderAdminTable();
                renderMyRequests();
                if (userRole === 'ayudante') {
                    renderSolicitudes();
                    renderHelperJobs();
                }
                checkPendingRatings();
            }
        } catch (error) {
            console.error("Error cargando citas de la BD:", error);
        }
    }

    function renderAdminTable() {
        if (appointments.length === 0) {
            emptyStateRow.style.display = 'table-row';
            adminTbody.innerHTML = '';
            adminTbody.appendChild(emptyStateRow);
            pendingCount.textContent = "0";
            return;
        }

        emptyStateRow.style.display = 'none';
        adminTbody.innerHTML = '';
        
        appointments.forEach((appt, index) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50';
            
            let statusBadge = '';
            if (appt.status === 'Pendiente') {
                statusBadge = '<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">Pendiente</span>';
            } else if (appt.status === 'Asignado') {
                statusBadge = `<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Asignado${appt.helperName ? ' · ' + escapeHtml(appt.helperName) : ''}</span>`;
            } else {
                const ratingText = appt.rating ? ` · ${appt.rating}★` : '';
                statusBadge = `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Completado${ratingText}</span>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${escapeHtml(appt.clientName)}</td>
                <td class="px-6 py-4">${escapeHtml(appt.service)}</td>
                <td class="px-6 py-4">Hoy a las ${escapeHtml(appt.time)}</td>
                <td class="px-6 py-4 font-semibold">$${escapeHtml(String(appt.price))}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    ${appt.status !== 'Completado' ? `<button class="text-accent-green hover:underline text-sm complete-btn" data-index="${index}">Completar</button>` : `<span class="text-gray-400 text-sm">--</span>`}
                </td>
            `;
            adminTbody.appendChild(tr);
        });

        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = e.target.getAttribute('data-index');
                
                // Actualizar en el Backend (BD)
                const originalText = e.target.innerHTML;
                e.target.innerHTML = '...';
                try {
                    await fetch(`${API_BASE_URL}/api/appointments/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ index: parseInt(idx) })
                    });
                    appointments[idx].status = 'Completado';
                    await loadAppointments();
                } catch (err) {
                    console.error("Error al completar cita:", err);
                    e.target.innerHTML = originalText;
                }
            });
        });

        const pending = appointments.filter(a => a.status === 'Pendiente').length;
        pendingCount.textContent = pending;
    }
    
    // Cargar los registros desde la base de datos al iniciar la página
    loadAppointments();

    // Schedule new appointment
    btnConfirmService.addEventListener('click', () => {
        if (gsapAvailable) {
            gsap.to(btnConfirmService, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        }
        
        const originalText = btnConfirmService.innerHTML;
        btnConfirmService.innerHTML = '¡Abriendo WhatsApp...! <svg class="w-5 h-5 ml-2 inline-block" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.115.548 4.184 1.594 6.002L.003 24l6.113-1.604A11.967 11.967 0 0012.031 24c6.646 0 12.03-5.385 12.03-12.031C24.062 5.385 18.677 0 12.031 0zm0 22.016a9.967 9.967 0 01-5.07-1.385l-.364-.216-3.771.989.998-3.676-.236-.376A9.97 9.97 0 012.046 12.03C2.046 6.52 6.521 2.045 12.03 2.045c5.51 0 9.986 4.475 9.986 9.985s-4.476 9.986-9.985 9.986zm5.48-7.487c-.301-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.679.151-.201.302-.782.979-.958 1.18-.176.201-.353.226-.654.075-1.704-.849-2.92-1.92-4.041-3.834-.201-.341-.021-.527.129-.678.136-.136.301-.352.451-.527.151-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.679-1.636-.931-2.241-.244-.585-.493-.505-.679-.514-.176-.009-.377-.01-.578-.01-.201 0-.528.076-.804.377-.276.302-1.055 1.031-1.055 2.513 0 1.482 1.08 2.915 1.231 3.116.151.201 2.124 3.242 5.143 4.544.718.309 1.278.494 1.716.632.72.228 1.376.196 1.895.118.582-.087 1.782-.729 2.033-1.433.251-.704.251-1.307.176-1.433-.075-.126-.276-.201-.578-.352z"></path></svg>';
        btnConfirmService.classList.replace('bg-accent-green', 'bg-green-500');
        const taskDescription = document.getElementById('task-description')?.value.trim() || '';
        const newAppointment = {
            clientName: currentUserName,
            service: selectedService,
            price: selectedPrice,
            time: selectedTime,
            description: taskDescription,
            status: 'Pendiente'
        };
        
        fetch(`${API_BASE_URL}/api/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAppointment)
        }).then(() => loadAppointments()).catch(err => console.error("Error guardando en BD:", err));

        setTimeout(() => {
            btnConfirmService.innerHTML = originalText;
            btnConfirmService.classList.replace('bg-green-500', 'bg-accent-green');
            
            // Redirect to WhatsApp
            const message = `Hola, necesito ayuda con: ${selectedService}. Lo necesito para: ${selectedTime}. Mi nombre es: ${currentUserName}`;
            window.open(`https://wa.me/593998045232?text=${encodeURIComponent(message)}`, '_blank');
        }, 1500);
    });

    // --- CHATBOT LOGIC ---
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendChat = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    function toggleChat() {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            if (gsapAvailable) {
                gsap.fromTo(chatWindow, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
            }
            chatInput.focus();
        }
    }

    chatToggle.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        if (isUser) {
            msgDiv.className = 'chat-bubble-sent bg-accent-green text-white p-3 rounded-2xl rounded-tr-none text-sm self-end max-w-[85%] shadow-sm';
        } else {
            msgDiv.className = 'chat-bubble-received bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-tl-none text-sm text-gray-700 self-start max-w-[85%]';
        }
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    function botReply(userMsg) {
        let reply = "Mmm, no estoy seguro de entenderte del todo. 🤔 Intenta decir cosas como: 'quiero agendar una cita', 'ver membresías', o 'se dañó mi baño'.";
        let msgLower = userMsg.toLowerCase();

        // Saludos
        if (msgLower.match(/(hola|saludos|buenas|q tal|que tal|buenos dias|buenas tardes)/)) {
            const greetings = [
                `¡Hola ${currentUserName !== "Usuario de Prueba" ? currentUserName : ""}! 👋 Soy AyudanteBot. ¿En qué te puedo apoyar hoy?`,
                `¡Qué gusto saludarte! 😊 ¿Necesitas que te ayudemos con alguna reparación o tarea en casa?`,
                `¡Hola! Aquí Ayudante Express listo para la acción. 🚀 ¿Qué se te ofrece?`
            ];
            reply = greetings[Math.floor(Math.random() * greetings.length)];
        } 
        // Baño / Plomería
        else if (msgLower.match(/(baño|inodoro|ducha|agua|fuga|tubería|plomeria|fregadero)/)) {
            reply = "¡Uy, problemas con el agua! 💧 Si es el baño, te recomiendo cerrar la llave de paso principal por seguridad para evitar inundaciones. Luego, ¡no te preocupes! Puedo ayudarte a agendar una cita con un plomero de nuestra comunidad. Solo ve a la pestaña 'Publicar Solicitud', selecciona 'Plomería Básica' y estarán ahí súper rápido.";
        }
        // Agendar / Cita / Necesito ayuda
        else if (msgLower.match(/(agendar|cita|necesito ayuda|quiero un ayudante|reparar|arreglar|daño)/)) {
            reply = "¡Claro que sí, para eso estamos! 🛠️ Agendar es súper fácil. Dirígete a la pestaña 'Publicar Solicitud' en el menú de arriba. Cuéntanos qué pasó, elige a qué hora lo necesitas, y enviaremos tu solicitud a los ayudantes cercanos. ¡En minutos tendrás ofertas en tu WhatsApp!";
        }
        // Electricidad
        else if (msgLower.match(/(luz|electricidad|enchufe|foco|cortocircuito|chispa)/)) {
            reply = "¡Con la electricidad hay que tener cuidado! ⚡ Te sugiero no tocar nada si ves chispas o cables expuestos. Baja el interruptor (breaker) de esa zona si puedes y ve a 'Publicar Solicitud' -> 'Electricidad' para enviarte a un experto de inmediato.";
        }
        // Membresías / Precios
        else if (msgLower.match(/(precio|cuanto|cuesta|membresia|suscripcion|pagar|costo)/)) {
            reply = "¡Nuestros precios están pensados para el bolsillo estudiantil! 💸 Publicar una tarea es gratis y tú eliges la oferta. Si prefieres algo constante, la membresía Básica cuesta $10/mes (visitas preventivas) y el plan Foráneo Pro $15/mes (para roomies). Revisa la pestaña 'Membresías' para ver todos los beneficios.";
        }
        // Comunidad / Aprender
        else if (msgLower.match(/(aprender|curso|leer|comunidad|ser ayudante|trabajar)/)) {
            reply = "¡Nos encanta esa actitud emprendedora! 🎓 Tenemos minicursos rápidos y gratuitos en la sección 'Comunidad'. Puedes aprender a arreglar una cisterna o cambiar un enchufe de forma segura. ¡Pásate por ahí, capacítate y empieza a generar ingresos ayudando a otros!";
        }

        // Simular que el bot está escribiendo...
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-bubble-received bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-tl-none text-sm text-gray-400 self-start max-w-[85%]';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span class="animate-pulse">Escribiendo...</span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Deshabilitar input mientras escribe
        chatInput.disabled = true;

        setTimeout(() => {
            // Remover "Escribiendo..." y habilitar input
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
            chatInput.disabled = false;
            chatInput.focus();
            
            // Agregar el mensaje real
            addMessage(reply, false);
        }, 1000 + Math.random() * 800); // 1 a 1.8 segundos de retraso
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (text === '') return;
        
        addMessage(text, true);
        chatInput.value = '';
        botReply(text);
    }

    sendChat.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // --- SUBSCRIPTIONS LOGIC ---
    const subscribeButtons = document.querySelectorAll('.btn-subscribe');
    subscribeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.getAttribute('data-plan');
            const originalText = btn.innerHTML;
            btn.innerHTML = '¡Suscrito! ✓';
            
            setTimeout(() => {
                alert(`¡Felicidades ${currentUserName}! Te has suscrito exitosamente a la membresía ${plan}. Te enviaremos los detalles por correo.`);
                btn.innerHTML = originalText;
            }, 600);
        });
    });

    // --- COMMUNITY / COURSES LOGIC ---
    const courseButtons = document.querySelectorAll('.btn-course');
    const articleModal = document.getElementById('article-modal');
    const closeArticleModal = document.getElementById('close-article-modal');
    const finishArticleBtn = document.getElementById('finish-article-btn');
    const articleTitle = document.getElementById('article-title');
    const articleContent = document.getElementById('article-content');

    if (courseButtons && articleModal) {
        courseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.group');
                const title = card ? card.querySelector('h3').textContent : 'Artículo';
                
                articleTitle.textContent = title;
                articleContent.innerHTML = `
                    <p class="text-lg font-medium text-gray-800">Bienvenido al contenido: <strong>${title}</strong>.</p>
                    <p>Aquí encontrarás toda la información necesaria para aprender y aplicar estas habilidades como ayudante.</p>
                    <h4 class="font-bold text-lg text-on-primary mt-6 border-b pb-2">Paso 1: Preparación</h4>
                    <p class="mt-2">Asegúrate de tener todas las herramientas necesarias antes de comenzar. La seguridad es lo primero que debes tener en cuenta al realizar cualquier tarea del hogar. Siempre usa equipo de protección si es necesario (guantes, gafas de seguridad).</p>
                    <h4 class="font-bold text-lg text-on-primary mt-6 border-b pb-2">Paso 2: Ejecución</h4>
                    <p class="mt-2">Sigue las instrucciones paso a paso. Si tienes dudas durante el proceso, siempre es mejor detenerte y consultar a la comunidad o buscar tutoriales específicos en video. Nunca asumas un riesgo innecesario, especialmente con electricidad o plomería compleja.</p>
                    <h4 class="font-bold text-lg text-on-primary mt-6 border-b pb-2">Paso 3: Verificación</h4>
                    <p class="mt-2">Revisa que todo haya quedado perfectamente funcional y limpio. Una buena impresión final asegurará una calificación de 5 estrellas por parte de tu cliente, lo que te ayudará a conseguir más solicitudes en el futuro.</p>
                `;
                
                articleModal.classList.remove('hidden');
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(articleModal.querySelector('div'), 
                        { y: 50, opacity: 0 }, 
                        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
                    );
                }
            });
        });

        const hideArticleModal = () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(articleModal.querySelector('div'), { 
                    y: 50, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in',
                    onComplete: () => articleModal.classList.add('hidden')
                });
            } else {
                articleModal.classList.add('hidden');
            }
        };

        closeArticleModal.addEventListener('click', hideArticleModal);
        finishArticleBtn.addEventListener('click', hideArticleModal);
    }

    // --- HELPER PROFILE SAVE ---
    document.getElementById('save-helper-profile-btn')?.addEventListener('click', async () => {
        const skills = [...document.querySelectorAll('.helper-skill-check:checked')].map(cb => cb.value);
        const bio = document.getElementById('helper-bio').value.trim();
        if (skills.length === 0) {
            alert('Selecciona al menos una habilidad.');
            return;
        }
        await saveHelperProfile(skills, bio);
        renderHelperProfile();
        renderSolicitudes();
        alert('Perfil guardado correctamente.');
    });

    // --- RATING MODAL ---
    document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            document.querySelectorAll('.rating-star').forEach((s, i) => {
                s.classList.toggle('text-yellow-400', i < selectedRating);
                s.classList.toggle('text-gray-300', i >= selectedRating);
            });
            document.getElementById('submit-rating-btn').disabled = false;
        });
    });

    document.getElementById('submit-rating-btn')?.addEventListener('click', async () => {
        if (!pendingRatingApptId || !selectedRating) return;
        try {
            await fetch(`${API_BASE_URL}/api/appointments/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pendingRatingApptId, rating: selectedRating })
            });
            document.getElementById('rating-modal').classList.add('hidden');
            pendingRatingApptId = null;
            await loadAppointments();
        } catch (e) {
            console.error("Error al calificar:", e);
        }
    });

});
