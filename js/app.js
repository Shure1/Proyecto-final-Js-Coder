//TODO: el evento change se activa cuando el valor del select cambia
//TODO: se le puede agregar atributos a un div creado en js como el alt o el src con .alt y .src

function iniciarApp(){
    const resultado = document.querySelector('#resultado')
    const selectCategorias = document.querySelector('#categorias')
    if(selectCategorias){
        selectCategorias.addEventListener('change',seleccionarCategoria);
        obtenerCategorias();
    }
    const favoritoDiv = document.querySelector('.favoritos');
    if(favoritoDiv){
        obtenerFav()
    }

    
    const modal = document.querySelector('#modal')
    const modalBootstrap = new bootstrap.Modal(modal, {})
    

    function obtenerCategorias(){
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)//llamado hacia la url
            .then(respuesta => {//lo transformamos en json
                return respuesta.json()
            })
            .then(data => mostrarCategorias(data.categories))//imprimimos en consola los datos
    }

    function mostrarCategorias(categorias = []){
        categorias.forEach(categoria => {

            const {strCategory} = categoria
            const option = document.createElement('OPTION');
            option.value = strCategory //ingresamos el valor
            option.text = strCategory //ingresamos el texto para que se vea en el browser

            selectCategorias.appendChild(option)


        });
    }

    function seleccionarCategoria(e){
        /*la funcion compila debido a que ya existe en el html el select y lo detecta con DOMContentLoaded aunque las categorias se agreguen despues, si el select no estuviese en el html independiente de que las categorias se agreguen esta funcion no seria funcional*/
        const categoria = e.target.value
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(data => mostrarRecetas(data.meals))
    }

    function mostrarRecetas(recetas){
        limpiarHtml(resultado);

        const head = document.createElement('h2');
        head.classList.add('text-center', 'text-black', 'my-5');
        head.textContent = recetas.length ? 'Resultados' : 'No hay Resultados';
        resultado.appendChild(head);

        //iterar en los resultados

        recetas.forEach(receta => {
            const {idMeal, strMeal, strMealThumb} = receta
            //creamos un div para que bootstrap ocupe el ancho maximo
            const recetaContenedor = document.createElement('div');
            //seran 4 columnas
            recetaContenedor.classList.add('col-md-3');

            //aplicamos los estilos de la card
            const recetaCard = document.createElement('div')
            recetaCard.classList.add('card', 'mb-4')
            //estilos a la imagen
            const recetaImagen = document.createElement('img');
            recetaImagen.classList.add('card-img-top')
            recetaImagen.alt = `receta imagen ${strMeal ?? receta.titulo}`
            // strMealThumb es el llamado a la api y receta.img es el llamado al localstorage
            recetaImagen.src = strMealThumb ?? receta.img

            //generamos el cuerpo de la card
            const recetaCardBody = document.createElement('div')
            recetaCardBody.classList.add('card-body');
            //estilos al titulo
            const recetaHead = document.createElement('h3')
            recetaHead.classList.add('card.title', 'mb-3');
            recetaHead.textContent = strMeal ?? receta.titulo
            //generamos el boton y aplicamos estilos
            const recetaBoton = document.createElement('button');
            recetaBoton.classList.add('btn', 'btn-danger', 'w-100');
            recetaBoton.textContent='ver receta'
            //? entonces el function previene que se ejecute la funcion seleccionarReceta hasta que se ejecute el evento
            recetaBoton.onclick = function(){

                seleccionarReceta(idMeal ?? receta.id)
            }

            //lo colocamos en el html
            /* estructura
                contenedor 
                    .card
                        img
                        .card-body
                            h3
                            button */
            recetaCardBody.appendChild(recetaHead);
            recetaCardBody.appendChild(recetaBoton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);
            resultado.appendChild(recetaContenedor)//resultado es la unca estructura que si existe en el html sin esta variable no funcionaria el cod
           
        })
    }

    function seleccionarReceta(id){
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`

        fetch(url)
            .then(resultado => resultado.json())
            .then(data => mostrarRecetaModal(data.meals[0]))
    }

    function mostrarRecetaModal(receta){

        const {idMeal, strInstructions, strMeal, strMealThumb} =receta
        
        //añadimos contenido al modal
        const modalTitle  = document.querySelector('.modal-header .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');
        //agregamos el titulo de la receta
        modalTitle.textContent = strMeal;
        //agregamos imagen e instrucciones 
        modalBody.innerHTML =`
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
            <h3 class="my-3"> Instrucciones </h3>
            <p>${strInstructions}</p>
            <h3 class="my-3"> Ingredientes y Cantidades </h3>
        `;

        const listgroup = document.createElement('ul');
        listgroup.classList.add('list-group');

        //MOSTRAR INGREDIENTES
        //ocupamos el for convencional porque ya sabemos que tiene 20 ingredientes como maximo
        for(let i = 1; i<=20;i++){
            if(receta[`strIngredient${i}`]){
                //obtenemos los ingredientes y porciones
                const ingredientes = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                //reamos una lista y le agregamos los ingredientes y porciones
                const ingredienteLi = document.createElement('li');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingredientes} - ${cantidad} `
                

                //lo agregamos a la lista creada antes del for
                listgroup.appendChild(ingredienteLi)
            }
           
        }
        //añadimos el listado al cuerpo de la card
        modalBody.appendChild(listgroup);

        //seleccionamos el lugar donde colocaremos el boton
        const modalFooter = document.querySelector('.modal-footer')
        //como ocupamos appendChild tenemos que limpiar la card o sino apareceran mas de dos botones a medida que se vayan viendo mas recetas
        limpiarHtml(modalFooter);
        
        //añadimos los botones
        const btnFavorito = document.createElement('button');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent= existeReceta(idMeal) ? 'Eliminar Favorito' : 'Añadir Favorito'

        //almacenamos en el LocalStorage, actualizamos el boton y eliminamos del local dependiendo del caso
        btnFavorito.onclick = function(){

            if(existeReceta(idMeal)){
                eliminarFavorito(idMeal)
                btnFavorito.textContent = 'Añadir Favorito';
                mostrarToast('Receta eliminada correctamente')
                return
            }
            agregarFavorito({
                id: idMeal,
                titulo:strMeal,
                img:strMealThumb
            })
            btnFavorito.textContent = 'Eliminar Favorito'
            mostrarToast('Receta agregada correctamente')
        }

        const btnCerrarModal = document.createElement('button');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent= 'Cerrar'
        //? entonces el function previene que se ejecute la funcion modalBootstrap hasta que se ejecute el evento sino se ejecutaria automaticamente
        btnCerrarModal.onclick = function(){
            modalBootstrap.hide();
        }

        

        

        //añadimos el boton en el HTML
        modalFooter.appendChild(btnFavorito)
        modalFooter.appendChild(btnCerrarModal)

        
        //mostramos el modal
        modalBootstrap.show();
    }

    function agregarFavorito(receta){
        //si no hay favoritos en el localStorage generamos un arreglo
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        //enviamos los datos al localStorage
        localStorage.setItem('favoritos', JSON.stringify([...favoritos,receta]))
    }

    function eliminarFavorito(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        const nuevosFav = favoritos.filter(favorito => favorito.id!== id)
        localStorage.setItem('favoritos', JSON.stringify(nuevosFav))
    }

    function existeReceta(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        return favoritos.some(favorito => favorito.id === id)
    }

    function mostrarToast(mensaje){
        const toast = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toastBoostrap = new bootstrap.Toast(toast)

        toastBody.textContent = mensaje
        toastBoostrap.show()
    }

    function obtenerFav(){
        const fav = JSON.parse(localStorage.getItem('favoritos')) ?? []
        if(fav.length){
            mostrarRecetas(fav)
            return
        }

        const FavoritoVacio = document.createElement('p')
        FavoritoVacio.textContent = 'No hay recetas en Favortios'
        FavoritoVacio.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        resultado.appendChild(FavoritoVacio)
    }


    function limpiarHtml(contenedor){
        while(contenedor.firstChild){
            contenedor.removeChild(contenedor.firstChild)
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp)