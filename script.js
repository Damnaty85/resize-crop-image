document.addEventListener("DOMContentLoaded", () => {
    function resizeableImage(image_target) {
        // variable
        let constrain = false
        let resizeContainer;

        const origImage = new Image()
        const imageTarget = document.querySelector(image_target);
        const loader = document.querySelector(".js-loadfile");
        const overlay = document.querySelector(".overlay");
        const cropBtn = document.querySelector(".js-crop");
        const resetBtn = document.querySelector('.js-reset');
        const cropWrap = document.querySelector(".crop-wrapper")
        const ratio = document.getElementById('ratio')

        const events = {}
        const minWidth = 60
        const minHeight = 60
        const maxWidth = 1800
        const maxHeight = 1900
        const initHeight = 500
        let imageData = null;

        const resize_canvas = document.createElement('canvas');

        function loadData() {
            imageTarget.src = imageData;
            origImage.src = imageTarget.src;
            
            imageTarget.style = `width:'auto';height:${initHeight}`

            origImage.addEventListener('load', function() {
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
                    loadData()
                })

                reader.readAsDataURL(files[0]);
            })

            resetBtn.addEventListener("click", function() {
                if(imageData) loadData();
            })

            origImage.src = imageTarget.src;

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
            }
            wrapImage(imageTarget);
            
            resizeContainer.querySelectorAll(".resize-handle").forEach((item) => {
                item.addEventListener('mousedown', startResize)
            })

            resizeContainer.querySelector(".resize-container-ontop").addEventListener("mousedown", startMoving)

            cropBtn.addEventListener('click', crop);
        }

        function saveEventState(evt){
            events.container_width = resizeContainer.getBoundingClientRect().width;
            events.container_height = resizeContainer.getBoundingClientRect().height;
            events.container_left = resizeContainer.offsetLeft + window.scrollX; 
            events.container_top = resizeContainer.offsetTop + window.scrollY;
            events.mouse_x = (evt.clientX || evt.pageX) + window.screenLeft; 
            events.mouse_y = (evt.clientY || evt.pageY) + window.screenTop;

            events.evnt = evt;
        };

        function resizing(evt){
            // debugger;
            let mouse = {}, width, height, left, top;
            
            mouse.x = (evt.clientX || evt.pageX) + window.screenLeft; 
            mouse.y = (evt.clientY || evt.pageY) + window.screenTop;

            if(events.evnt.target.classList.contains('resize-handle-se') ){
                width = mouse.x - events.container_left;
                height = mouse.y  - events.container_top;
                left = events.container_left;
                top = events.container_top;
            } else if(events.evnt.target.classList.contains('resize-handle-sw') ){
                width = events.container_width - (mouse.x - events.container_left);
                height = mouse.y  - events.container_top;
                left = mouse.x;
                top = events.container_top;
            } else if(events.evnt.target.classList.contains('resize-handle-nw') ){
                width = events.container_width - (mouse.x - events.container_left);
                height = events.container_height - (mouse.y - events.container_top);
                left = mouse.x;
                top = mouse.y;
                if(constrain || evt.shiftKey || ratio.checked){
                    top = mouse.y - ((width / origImage.width * origImage.height) - height);
                }
            } else if(events.evnt.target.classList.contains('resize-handle-ne') ){
                width = mouse.x - events.container_left;
                height = events.container_height - (mouse.y - events.container_top);
                left = events.container_left;
                top = mouse.y;
                if(constrain || evt.shiftKey || ratio.checked){
                    top = mouse.y - ((width / origImage.width * origImage.height) - height);
                }
            }
            
            if(constrain || evt.shiftKey || ratio.checked){
                height = width / origImage.width * origImage.height;
            }
            
            if(width > minWidth && height > minHeight && width < maxWidth && height < maxHeight){
                resizeContainer.style = `left:${left}px;top:${top}px`;
                resizeImage(width, height);
            }
        }

        function resizeImage(width, height){
            imageTarget.style = `width: ${width}px; height: ${height}px`;
        };

        function resizeImageCanvas(width, height){
            resize_canvas.width = width;
            resize_canvas.height = height;
            resize_canvas.getContext('2d').drawImage(origImage, 0, 0, width, height);   
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

            resizeContainer.style.left = `${mouse.x - (events.mouse_x - events.container_left)}px`
            resizeContainer.style.top = `${mouse.y - (events.mouse_y - events.container_top)}px`
        }

        function startMoving(evt){
            evt.preventDefault();
            evt.stopPropagation();
            saveEventState(evt);
            document.addEventListener("mousemove", moving)
            document.addEventListener("mouseup", endMoving)
        };
        
        function endMoving(evt){
            evt.preventDefault();
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
            origImage.src = imageTarget.src;

            imageTarget.style = `width: ${width}px;height: ${height}px`;
            imageTarget.parentNode.style = `top:${(overlay.offsetTop - cropWrap.offsetTop) + 63}px; left:${overlay.offsetLeft - cropWrap.offsetLeft}px`
        }

        init();
    }

    resizeableImage(".resize-image")
})
