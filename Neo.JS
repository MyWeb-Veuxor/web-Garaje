document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('vehicleForm');
    const placaInput = document.getElementById('placa');
    const canvas = document.getElementById('vehicleCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    let isDrawing = false;
    let vehiclesData = loadVehiclesData();
    let annotations = [];

    // Evento de envío de formulario
    form.addEventListener('submit', handleFormSubmit);

    // Toggle del menú
    document.querySelector('.menu-button').addEventListener('click', toggleMenu);

    // Mostrar historial
    document.querySelector('.submenu-button').addEventListener('click', displayHistory);

    // Autocompletar campos del formulario
    placaInput.addEventListener('input', autocompleteForm);

    // Eventos de dibujo en el canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);

    // Limpiar el canvas
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);

    // Selección de vehículo
    window.selectVehicle = selectVehicle;

    /**
     * Maneja el envío del formulario
     * Guarda los datos del vehículo, muestra una alerta y resetea el formulario
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        saveVehicleData();
        alert('Vehículo registrado correctamente.');
        form.reset();
        vehiclesData = loadVehiclesData();  // Recargar datos después de guardar
    }

    /**
     * Toggle del menú
     * Muestra u oculta el submenú
     */
    function toggleMenu() {
        document.querySelector('.submenu').classList.toggle('show');
    }

    /**
     * Autocompleta los campos del formulario
     * Busca el vehículo por la placa ingresada y rellena los campos si se encuentra
     */
    function autocompleteForm() {
        const vehicle = vehiclesData.find(v => v.placa.toUpperCase() === placaInput.value.toUpperCase());
        if (vehicle) {
            fillFormFields(vehicle);
            annotations = vehicle.annotations || [];
            redrawAnnotations();
        } else {
            clearFormFields();
            annotations = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Inicia el dibujo en el canvas
     * @param {MouseEvent} e 
     */
    function startDrawing(e) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = colorPicker.value;
    }

    /**
     * Dibuja en el canvas mientras se arrastra el mouse
     * @param {MouseEvent} e 
     */
    function draw(e) {
        if (isDrawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
    }

    /**
     * Finaliza el dibujo en el canvas
     */
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            ctx.closePath();
            annotations.push({
                color: colorPicker.value,
                path: ctx.getImageData(0, 0, canvas.width, canvas.height)
            });
        }
    }

    /**
     * Limpia el canvas y las anotaciones
     */
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        annotations = [];
    }

    /**
     * Selecciona el tipo de vehículo y muestra la imagen correspondiente en el canvas
     * @param {string} type 
     */
    function selectVehicle(type) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            redrawAnnotations();
        };
        img.src = type === 'car' ? 'imagen/car_top_view.png' : 'imagen/van_top_view.png';
    }

    /**
     * Guarda los datos del vehículo en localStorage
     */
    function saveVehicleData() {
        const vehicle = {
            fecha: document.getElementById('fecha').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            placa: document.getElementById('placa').value,
            color: document.getElementById('color').value,
            propietario: document.getElementById('propietario').value,
            observaciones: document.getElementById('observaciones').value,
            annotations: annotations,
            garage: document.querySelector('input[name="garage"]:checked').value,  // Guardar el garaje seleccionado
            imagen: document.getElementById('foto').files[0] ? URL.createObjectURL(document.getElementById('foto').files[0]) : '',  // Guardar la URL de la imagen
        };
        vehiclesData.push(vehicle);
        localStorage.setItem('vehiclesData', JSON.stringify(vehiclesData));
    }

    /**
     * Carga los datos de los vehículos desde localStorage
     * @returns {Array} 
     */
    function loadVehiclesData() {
        const data = localStorage.getItem('vehiclesData');
        return data ? JSON.parse(data) : [];
    }

    /**
     * Redibuja las anotaciones en el canvas
     */
    function redrawAnnotations() {
        annotations.forEach(annotation => {
            ctx.putImageData(annotation.path, 0, 0);
        });
    }

    /**
     * Muestra el historial de vehículos registrados
     */
    function displayHistory() {
        const historyContainer = document.getElementById('history-container');
        const historyTableBody = document.querySelector('#historyTable tbody');
        historyTableBody.innerHTML = ''; // Limpiar el contenido existente

        const sortedData = vehiclesData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        sortedData.forEach(vehicle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle.fecha}</td>
                <td>${vehicle.marca}</td>
                <td>${vehicle.modelo}</td>
                <td>${vehicle.placa}</td>
                <td>${vehicle.color}</td>
                <td>${vehicle.propietario}</td>
                <td>${vehicle.observaciones}</td>
                <td>${vehicle.garage}</td>
                <td><img src="${vehicle.imagen}" alt="Imagen del Vehículo" class="thumbnail"></td>
                <td><canvas id="canvas-${vehicle.placa}" width="100" height="60"></canvas></td>
                <td>
                    <button onclick="editVehicle('${vehicle.placa}')">Editar</button>
                    <button onclick="deleteVehicle('${vehicle.placa}')">Eliminar</button>
                </td>
            `;
            historyTableBody.appendChild(row);

            // Dibujar las anotaciones en el mini-canvas
            const miniCanvas = document.getElementById(`canvas-${vehicle.placa}`);
            const miniCtx = miniCanvas.getContext('2d');
            vehicle.annotations.forEach(annotation => {
                miniCtx.putImageData(annotation.path, 0, 0);
            });
        });

        historyContainer.style.display = 'block'; // Asegurarse de que el contenedor del historial esté visible

        // Añadir eventos a las miniaturas para abrir el modal
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', openModal);
        });
    }

    /**
     * Abre el modal con la imagen en pantalla completa
     * @param {Event} e
     */
    function openModal(e) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('fullImage');
        modal.style.display = 'block';
        modalImg.src = e.target.src;

        const closeBtn = document.getElementsByClassName('close')[0];
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    /**
     * Edita un vehículo existente
     * @param {string} placa - La placa del vehículo a editar
     */
    function editVehicle(placa) {
        const vehicle = vehiclesData.find(v => v.placa === placa);
        if (vehicle) {
            fillFormFields(vehicle);
        }
    }

    /**
     * Elimina un vehículo existente
     * @param {string} placa - La placa del vehículo a eliminar
     */
    function deleteVehicle(placa) {
        vehiclesData = vehiclesData.filter(v => v.placa !== placa);
        localStorage.setItem('vehiclesData', JSON.stringify(vehiclesData));
        displayHistory(); // Actualizar la visualización del historial
    }

    /**
     * Rellena los campos del formulario con los datos del vehículo
     * @param {Object} vehicle 
     */
    function fillFormFields(vehicle) {
        document.getElementById('fecha').value = vehicle.fecha;
        document.getElementById('marca').value = vehicle.marca;
        document.getElementById('modelo').value = vehicle.modelo;
        document.getElementById('color').value = vehicle.color;
        document.getElementById('propietario').value = vehicle.propietario;
        document.getElementById('observaciones').value = vehicle.observaciones || '';
        document.querySelector(`input[name="garage"][value="${vehicle.garage}"]`).checked = true;  // Seleccionar el garaje
    }

    /**
     * Limpia los campos del formulario
     */
    function clearFormFields() {
        document.getElementById('fecha').value = '';
        document.getElementById('marca').value = '';
        document.getElementById('modelo').value = '';
        document.getElementById('color').value = '';
        document.getElementById('propietario').value = '';
        document.getElementById('observaciones').value = '';
        const selectedGarage = document.querySelector('input[name="garage"]:checked');
        if (selectedGarage) {
            selectedGarage.checked = false;  // Limpiar la selección del garaje
        }
    }
});
