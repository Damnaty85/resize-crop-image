document.addEventListener("DOMContentLoaded", () => {
    function resizeableImage(image_target) {
        // variable
        let constrain = false
        let resizeContainer;

        const orig_src = new Image()
        const imageTarget = document.querySelector(image_target);
        const loader = document.querySelector(".js-loadfile");
        const overlay = document.querySelector(".overlay");
        const cropBtn = document.querySelector(".js-crop");
        const resetBtn = document.querySelector('.js-reset');

        const event_state = {}
        const min_width = 60
        const min_height = 60
        const max_width = 1800
        const max_height = 1900
        const init_height = 500
        let imageData=null;

        const resize_canvas = document.createElement('canvas');

        function load() {
            imageTarget.src = imageData;
            orig_src.src = imageTarget.src;
            
            imageTarget.style = `width:'auto';height:${init_height}`

            orig_src.addEventListener('load', function() {
                let width = imageTarget.getBoundingClientRect().width;
                let height = imageTarget.getBoundingClientRect().height;
                resizeImageCanvas(width, height);
            })
        }

        function init(evt) {
            loader.addEventListener("change", function() {
                const files = loader.files; 
                const reader = new FileReader();

                reader.addEventListener("load", function() {
                    imageData = reader.result;
                    load()
                })

                reader.readAsDataURL(files[0]);
            })

            resetBtn.addEventListener("click", () => {
                if(imageData) load();
            })

            orig_src.src = imageTarget.src;

            function wrapImage(image) {
                const cropWrapper = document.querySelector(".crop-wrapper");
                
                function resizeContainerTemplate() {
                    return`
                        <div class="resize-container">
                            <div class="resize-container-ontop"></div>
                            <span class="resize-handle resize-handle-nw"></span>
                            <span class="resize-handle resize-handle-ne"></span>
                            <span class="resize-handle resize-handle-se"></span>
                            <span class="resize-handle resize-handle-sw"></span>
                        </div>
                    `
                }

                cropWrapper.insertAdjacentHTML('beforeend', resizeContainerTemplate());
                resizeContainer = document.querySelector(".resize-container")
                resizeContainer.append(image)

                resizeContainer.querySelectorAll(".resize-handle").forEach((item) => {
                    item.addEventListener('mousedown', startResize)
                })

                resizeContainer.querySelector(".resize-container-ontop").addEventListener("mousedown", startMoving)

            }

            wrapImage(imageTarget);

            cropBtn.addEventListener('click', crop);
        }

        function saveEventState(evt){
            event_state.container_width = resizeContainer.getBoundingClientRect().width;
            event_state.container_height = resizeContainer.getBoundingClientRect().height;
            event_state.container_left = resizeContainer.getBoundingClientRect().left + window.scrollX; 
            event_state.container_top = resizeContainer.getBoundingClientRect().top + window.scrollY;
            event_state.mouse_x = (evt.clientX || evt.pageX) + window.scrollX; 
            event_state.mouse_y = (evt.clientY || evt.pageY) + window.scrollY;

            event_state.evnt = evt;
        };

        function resizing(evt){
            let mouse = {};
            let width;
            let height;
            let left;
            let top;
            
            mouse.x = (evt.clientX || evt.pageX) + window.scrollX; 
            mouse.y = (evt.clientY || evt.pageY) + window.scrollY;
            
            if(event_state.evnt.target.classList.contains('resize-handle-se') ){
                width = mouse.x - event_state.container_left;
                height = mouse.y  - event_state.container_top;
                left = event_state.container_left;
                top = event_state.container_top;
            } else if(event_state.evnt.target.classList.contains('resize-handle-sw') ){
                width = event_state.container_width - (mouse.x - event_state.container_left);
                height = mouse.y  - event_state.container_top;
                left = mouse.x;
                top = event_state.container_top;
            } else if(event_state.evnt.target.classList.contains('resize-handle-nw') ){
                width = event_state.container_width - (mouse.x - event_state.container_left);
                height = event_state.container_height - (mouse.y - event_state.container_top);
                left = mouse.x;
                top = mouse.y;
                if(constrain || evt.shiftKey){
                    top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                }
            } else if(event_state.evnt.target.classList.contains('resize-handle-ne') ){
                width = mouse.x - event_state.container_left;
                height = event_state.container_height - (mouse.y - event_state.container_top);
                left = event_state.container_left;
                top = mouse.y;
                if(constrain || evt.shiftKey){
                    top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                }
            }
            
            if(constrain || evt.shiftKey){
                height = width / orig_src.width * orig_src.height;
            }
        
            if(width > min_width && height > min_height && width < max_width && height < max_height){
                resizeContainer.style = `left:${left}px;top:${top - 63}px`
                resizeImage(width, height);
            }
        }

        resizeImage = function(width, height){
            imageTarget.style = `width: ${width}px; height: ${height}px`;
        };

        function resizeImageCanvas(width, height){
            resize_canvas.width = width;
            resize_canvas.height = height;
            resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);   
            imageTarget.setAttribute('src', resize_canvas.toDataURL("image/png"));
        };

        function startResize(evt){
            evt.preventDefault();
            evt.stopPropagation();
            saveEventState(evt);
            document.addEventListener('mousemove', resizing)
            document.addEventListener('mouseup', endResize)
        };

        function endResize(evt){
            let width = imageTarget.getBoundingClientRect().width;
            let height = imageTarget.getBoundingClientRect().height;
            resizeImageCanvas(width, height);
            evt.preventDefault();
            document.removeEventListener('mousemove', resizing)
            document.removeEventListener('mouseup', endResize)
        };

        function moving(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            let mouse = {}
            
            mouse.x = (evt.clientX || evt.pageX) + window.screenLeft; 
            mouse.y = (evt.clientY || evt.pageY) + window.screenTop;

            resizeContainer.style.left = `${mouse.x - (event_state.mouse_x - event_state.container_left)}px`
            resizeContainer.style.top = `${mouse.y - (event_state.mouse_y - event_state.container_top) - 85}px`
        }

        function startMoving(e){
            e.preventDefault();
            e.stopPropagation();
            saveEventState(e);
            document.addEventListener("mousemove", moving)
            document.addEventListener("mouseup", endMoving)
        };
        
        function endMoving(e){
            e.preventDefault();
            document.removeEventListener("mousemove", moving)
            document.removeEventListener("mouseup", endMoving)
        };

        function crop() {
            const crop_canvas = document.createElement('canvas');
            const left = overlay.offsetLeft - resizeContainer.offsetLeft;
            const top = overlay.offsetTop - resizeContainer.offsetTop;
            const width = overlay.getBoundingClientRect().width;
            const height = overlay.getBoundingClientRect().height;

            crop_canvas.width = width;
            crop_canvas.height = height;

            crop_canvas.getContext('2d').drawImage(imageTarget, left, top, width, height, 0, 0, width, height)
            const dataURL = crop_canvas.toDataURL("image/png");
            imageTarget.src = dataURL;
            orig_src.src = imageTarget.src;

            imageTarget.addEventListener("load", function() {
                this.style = `width: ${width}px;height: ${height}px`;
            })
        }

        init();
    }

    resizeableImage(".resize-image")
})