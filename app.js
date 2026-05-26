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
    
    // --- GSAP SAFE WRAPPER ---
    let gsapAvailable = false;
    try {
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin();
            gsapAvailable = true;
            
            // Animate Hero section on load
            gsap.fromTo('.hero-text > *', 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
            );
            
            gsap.fromTo('.hero-image', 
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1, delay: 0.3, ease: 'power2.out' }
            );
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
    
    let isUserAdmin = false;
    let currentUserName = "Usuario de Prueba";

    saveNameBtn.addEventListener('click', () => {
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
                            
                            // RESET the target tab's own inline styles (because it might have opacity: 0 from a previous animation out)
                            gsap.set(targetTab, { opacity: 1, y: 0 });
                            
                            gsap.fromTo(targetTab.children,
                                { opacity: 0, y: 30 },
                                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', 
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
            }
        });
    });

    // --- ON DEMAND / PIDE UN TECNICO LOGIC ---
    const serviceLabels = document.querySelectorAll('#service-options label');
    const timeButtons = document.querySelectorAll('.time-btn');
    const displayPrice = document.getElementById('display-price');
    const btnConfirmService = document.getElementById('btn-confirm-service');
    
    let selectedService = "Instalación de repisa";
    let selectedPrice = "20";
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
        });
    });

    // --- ADMIN PANEL STATE LOGIC ---
    let appointments = [];
    const adminTbody = document.getElementById('admin-appointments-body');
    const emptyStateRow = document.getElementById('empty-state-row');
    const pendingCount = document.getElementById('admin-pending-count');

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
            } else {
                statusBadge = '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Completado</span>';
            }

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${appt.clientName}</td>
                <td class="px-6 py-4">${appt.service}</td>
                <td class="px-6 py-4">Hoy a las ${appt.time}</td>
                <td class="px-6 py-4 font-semibold">$${appt.price}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    ${appt.status === 'Pendiente' ? `<button class="text-accent-green hover:underline text-sm complete-btn" data-index="${index}">Completar</button>` : `<span class="text-gray-400 text-sm">--</span>`}
                </td>
            `;
            adminTbody.appendChild(tr);
        });

        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                appointments[idx].status = 'Completado';
                renderAdminTable();
            });
        });

        const pending = appointments.filter(a => a.status === 'Pendiente').length;
        pendingCount.textContent = pending;
    }

    // Schedule new appointment
    btnConfirmService.addEventListener('click', () => {
        const originalText = btnConfirmService.innerHTML;
        btnConfirmService.innerHTML = '¡Agendado Exitosamente! ✓';
        btnConfirmService.classList.replace('bg-on-primary', 'bg-green-600');
        
        appointments.unshift({
            clientName: currentUserName,
            service: selectedService,
            price: selectedPrice,
            time: selectedTime,
            status: 'Pendiente'
        });
        
        renderAdminTable();

        setTimeout(() => {
            btnConfirmService.innerHTML = originalText;
            btnConfirmService.classList.replace('bg-green-600', 'bg-on-primary');
            
            // Si es admin, lo llevamos al panel de admin para que lo vea, si no, le damos un aviso.
            if(isUserAdmin) {
                document.querySelector('.nav-btn[data-target="admin"]').click();
            } else {
                alert("¡Tu técnico ha sido agendado! Te enviaremos un correo de confirmación.");
            }
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
        let reply = "Lo siento, no entiendo bien. Intenta decir: 'quiero publicar una tarea', 'ver membresías' o 'quiero aprender'.";
        let msgLower = userMsg.toLowerCase();

        if (msgLower.includes("precio") || msgLower.includes("cuanto") || msgLower.includes("membresia") || msgLower.includes("suscripcion")) {
            reply = "La membresía Básica cuesta $99/mes (ideal estudiantes) y el Foráneo Pro $199/mes (para roomies). Puedes verlas en la pestaña 'Membresías'.";
        } else if (msgLower.includes("ayudante") || msgLower.includes("solicitud") || msgLower.includes("servicio") || msgLower.includes("tarea")) {
            reply = "¡Claro! Ve a la pestaña 'Publicar Solicitud' en el menú, cuéntanos qué necesitas y enviaremos tu solicitud a los ayudantes cercanos.";
        } else if (msgLower.includes("hola") || msgLower.includes("saludos") || msgLower.includes("buenas")) {
            reply = `¡Hola ${currentUserName !== "Usuario de Prueba" ? currentUserName : ""}! 👋 Soy AyudanteBot. ¿En qué te puedo apoyar hoy?`;
        } else if (msgLower.includes("aprender") || msgLower.includes("curso") || msgLower.includes("leer") || msgLower.includes("comunidad")) {
            reply = "¡Genial! Tenemos minicursos y artículos en la sección de 'Comunidad'. Ve allá para empezar a aprender y volverte un ayudante.";
        } else if (msgLower.includes("gratis") || msgLower.includes("pagar")) {
            reply = "Publicar una solicitud es gratis. Solo le pagas al ayudante cuando aceptas su oferta y completa el trabajo.";
        }

        setTimeout(() => {
            addMessage(reply, false);
        }, 1000);
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
    courseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Cargando...';
            setTimeout(() => {
                btn.innerHTML = originalText;
                alert('¡Abriendo el contenido de la academia! Preparando lección en una nueva ventana...');
            }, 600);
        });
    });

});
