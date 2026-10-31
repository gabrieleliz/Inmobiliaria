// Contraseña para modo administrador
const CODIGO_SECRETO = "554367";
//Arreglo para almacenar de forma local del navegador para no perder al recargar, si no hay nada comienza en cero
let propiedades = JSON.parse(localStorage.getItem('propiedades')) || [];
//Objeto para almacenar que inicia sesión el usuario
let usuarioActivo = null;

// navegación en la interfaz

//Para mostrar que sección o vista de la interfaz se muestra al usuario
function mostrarSeccion(id) {

    //oculta todas las secciones
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    //muestra solo la seccion del id dado
    document.getElementById(id).classList.remove('hidden');
    //nos indica cual seccion es: vista-publico o panel de usario (la que se va a mostrar)
    if (id === 'vista-publico') renderizarPublico();
    if (id === 'panel-usuario') renderizarMisPropiedades();
}


function verificarRol() {
    const rol = document.getElementById('rol-seleccionado').value;
    //Si se elige el campo de admin, pide el codigo secreto
    document.getElementById('campo-codigo-admin').className = (rol === 'admin' ? '' : 'hidden');
    //Oculta el apartado de registro
    document.getElementById('registro-extra').className = (rol === 'admin' ? 'hidden' : '');
}

// registro de usuario

//Evita que la página se actualice
document.getElementById('form-auth').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const rol = document.getElementById('rol-seleccionado').value;
    const nombre = document.getElementById('nombre').value;

    //Filtra que tipo de perfil es admin (pide codigo de administrador) o cliente (pide los archivos necesarios)
    if (rol === 'admin') {
        if (document.getElementById('codigo-admin').value === CODIGO_SECRETO) {
            usuarioActivo = { nombre, rol: 'admin' };
            mostrarSeccion('panel-admin');
            renderizarAdmin();
        } else { alert("Código incorrecto"); }
    } else {
        // Capturamos el enlace de la identificación
        const idUrl = document.getElementById('identificacion-url').value;
        usuarioActivo = { nombre, idUrl, rol: 'usuario' };
        document.getElementById('user-name-display').innerText = nombre;
        mostrarSeccion('panel-usuario');
    }
});

// publicación de propiedad

//Evita actualizaciones mientras se llena el formato de la propiedad
document.getElementById('form-propiedad').addEventListener('submit', function(e) {
    e.preventDefault();

    //datos necesarios para la publicación de la propiedad
    const nuevaProp = {
        id: Date.now(),
        dueno: usuarioActivo.nombre,
        idUrlDueno: usuarioActivo.idUrl, // Enlace de la identificación del usuario
        mapas: document.getElementById('maps-url').value,
        comprobante: document.getElementById('comprobante-url').value, // Enlace del comprobante
        precio: document.getElementById('precio').value,
        tipo: document.getElementById('tipo-operacion').value,
        contacto: document.getElementById('contacto').value,
        estado: 'pendiente',
        motivoRechazo: ''
    };
    //publica la propiedad
    propiedades.push(nuevaProp);
    //guarad en el almacenamiento local
    guardar();
    //actualiza la lista de propiedades
    renderizarMisPropiedades();
    //Devuelve los campos a 0 para su reutilización
    this.reset();
    alert("Propiedad enviada. El administrador revisará tus enlaces.");
});

// Vista de la interfaz

function renderizarMisPropiedades() {
    const lista = document.getElementById('mis-propiedades-lista');
    lista.innerHTML = '';

    //Filtra propiedades del usuario y si la propiedad fue rechazad genera un bloqueo para que esta no se publique
    propiedades.filter(p => p.dueno === usuarioActivo.nombre).forEach(p => {
        let notaRechazo = p.estado === 'rechazado' ? 
            `<div class="motivo-rechazo"><strong>Motivo:</strong> ${p.motivoRechazo}</div>` : '';

        //Publica una apartado con la información de la propiedad
        lista.innerHTML += `
            <div class="card">
                <p><strong>$${p.precio}</strong> <span class="estado-tag ${p.estado}">${p.estado}</span></p>
                ${notaRechazo}
                <button onclick="eliminar(${p.id})" style="background:red; padding:5px; font-size:0.7rem; margin-top:10px;">Dar de baja</button>
            </div>`;
    });
}

function renderizarAdmin() {
    const lista = document.getElementById('lista-pendientes');
    lista.innerHTML = '';

    //recorre todas las propiedades en el sistema
    propiedades.forEach(p => {
        lista.innerHTML += `
            <div class="card" style="background:#fff8e1; text-align:left;">
                <p><strong>Usuario:</strong> ${p.dueno}</p>
                <p>🪪 <a href="${p.idUrlDueno}" target="_blank">Ver Identificación</a></p>
                <p>📄 <a href="${p.comprobante}" target="_blank">Ver Comprobante Propiedad</a></p>
                <p>📍 <a href="${p.mapas}" target="_blank">Ver Mapa</a></p>
                <hr>
                <button onclick="cambiarEstado(${p.id}, 'aprobado')">Aprobar</button>
                <button onclick="rechazarConMotivo(${p.id})" style="background:orange">Rechazar</button>
                <button onclick="eliminar(${p.id})" style="background:red">Eliminar</button>
            </div>`;
    });
}

function renderizarPublico() {
    const contenedor = document.getElementById('contenedor-propiedades');
    contenedor.innerHTML = '';

    //muestra solo las propiedades aprobadas
    propiedades.filter(p => p.estado === 'aprobado').forEach(p => {
        contenedor.innerHTML += `
            <div class="card">
                <h3>${p.tipo.toUpperCase()}</h3>
                <p>Precio: <strong>$${p.precio}</strong></p>
                <a href="${p.mapas}" target="_blank" class="btn-mapa">Ver Ubicación</a>
                <p><small>Vendedor: ${p.dueno}</small></p>
            </div>`;
    });
}

// --- ACCIONES ---

function rechazarConMotivo(id) {
    const motivo = prompt("¿Por qué rechazas esta propiedad?");
    if (motivo) {
        //busca las propiedades rechazadas y guarda un mensaje del motivo del rechazo
        const idx = propiedades.findIndex(p => p.id === id);
        propiedades[idx].estado = 'rechazado';
        propiedades[idx].motivoRechazo = motivo;
        guardar();
        renderizarAdmin();
    }
}

function cambiarEstado(id, estado) {
    const idx = propiedades.findIndex(p => p.id === id);
    propiedades[idx].estado = estado;

    //cambia el estado de la propiedad  quitando todos los motivos previos de rechazo
    if(estado === 'aprobado') propiedades[idx].motivoRechazo = '';
    guardar();
    renderizarAdmin();
}

function eliminar(id) {
    if(confirm("¿Eliminar definitivamente?")) {
        //busca la propiedad que desea eliminar en el registro local 
        propiedades = propiedades.filter(p => p.id !== id);
        guardar();
        usuarioActivo.rol === 'admin' ? renderizarAdmin() : renderizarMisPropiedades();
    }
}

function guardar() { localStorage.setItem('propiedades', JSON.stringify(propiedades)); }

// Arrancar la página
mostrarSeccion('vista-publico');
