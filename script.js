document.addEventListener("DOMContentLoaded", () => {
    function resizeableImage(image_target) {
        // variable
        let constrain = false
        let resizeContainer;

        const cropWrapper = document.querySelector(".crop-wrapper");
        const origImage = new Image()
        const imageTarget = document.querySelector(image_target);
        const loader = document.querySelector(".js-loadfile");
        const overlay = document.querySelector(".overlay");
        const cropBtn = document.querySelector(".js-crop");
        const resetBtn = document.querySelector('.js-reset');
        const ratio = document.getElementById('ratio')

        const events = {}
        const minWidth = 60
        const minHeight = 60
        const maxWidth = 1800
        const maxHeight = 1900
        const initHeight = 500
        let imageData = null;

        const resize_canvas = document.createElement('canvas');

        function centringElement (parenSelector, сenterableElement) {
            const top = parenSelector.getBoundingClientRect().height / 2 - сenterableElement.getBoundingClientRect().height / 2
            const left = parenSelector.getBoundingClientRect().width / 2 - сenterableElement.getBoundingClientRect().width / 2

            сenterableElement.style = `top:${top}px; left:${left}px`            
        }

        centringElement(cropWrapper, overlay);

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
                imageTarget.parentNode.style = `top:0px; left:0px`
            })

            origImage.src = imageTarget.src;

            function wrapImage(image) {
                              
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
            events.containerWidth = resizeContainer.getBoundingClientRect().width;
            events.containerHeight = resizeContainer.getBoundingClientRect().height;
            events.containerLeft = resizeContainer.offsetLeft + window.scrollX; 
            events.containerTop = resizeContainer.offsetTop + window.scrollY;
            events.mouse_xPos = (evt.clientX || evt.pageX) + window.screenLeft; 
            events.mouse_yPos = (evt.clientY || evt.pageY) + window.screenTop;

            events.evnt = evt;
        };

        function resizing(evt){
            // debugger;
            let mouse = {}, width, height, left, top;
            
            mouse.xPos = (evt.clientX - cropWrapper.offsetLeft || evt.pageX - cropWrapper.offsetLeft) + window.screenLeft; 
            mouse.yPos = (evt.clientY - cropWrapper.offsetTop || evt.pageY - cropWrapper.offsetTop) + window.screenTop;

            if(events.evnt.target.classList.contains('resize-handle-se')){
                width = mouse.xPos - events.containerLeft;
                height = mouse.yPos  - events.containerTop;
                left = events.containerLeft;
                top = events.containerTop;
            } else if(events.evnt.target.classList.contains('resize-handle-sw')){
                width = events.containerWidth - (mouse.xPos - events.containerLeft);
                height = mouse.yPos  - events.containerTop;
                left = mouse.xPos;
                top = events.containerTop;
            } else if(events.evnt.target.classList.contains('resize-handle-nw')){
                width = events.containerWidth - (mouse.xPos - events.containerLeft);
                height = events.containerHeight - (mouse.yPos - events.containerTop);
                left = mouse.xPos;
                top = mouse.yPos;
                if(constrain || evt.shiftKey || ratio.checked){
                    top = mouse.yPos - ((width / origImage.width * origImage.height) - height);
                }
            } else if(events.evnt.target.classList.contains('resize-handle-ne')){
                width = mouse.xPos - events.containerLeft;
                height = events.containerHeight - (mouse.yPos - events.containerTop);
                left = events.containerLeft;
                top = mouse.yPos;
                if(constrain || evt.shiftKey || ratio.checked){
                    top = mouse.yPos - ((width / origImage.width * origImage.height) - height);
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
            
            mouse.xPos = (evt.clientX || evt.pageX) + window.screenLeft; 
            mouse.yPos = (evt.clientY || evt.pageY) + window.screenTop;

            const left = mouse.xPos - (events.mouse_xPos - events.containerLeft)
            const top = mouse.yPos - (events.mouse_yPos - events.containerTop)

            resizeContainer.style = `left:${left}px; top:${top}px`
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

            overlay.setAttribute('data-left', overlay.offsetLeft)
            overlay.setAttribute('data-top', overlay.offsetTop)

            crop_canvas.width = width;
            crop_canvas.height = height;

            crop_canvas.getContext('2d').drawImage(imageTarget, left, top, width, height, 0, 0, width, height)
            const dataURL = crop_canvas.toDataURL("image/png");
            imageTarget.src = dataURL;
            origImage.src = imageTarget.src;

            imageTarget.style = `width: ${width}px;height: ${height}px`;
            imageTarget.parentNode.style = `top:${(overlay.offsetTop)}px; left:${overlay.offsetLeft}px`
        }

        init();
    }

    resizeableImage(".resize-image")
})
