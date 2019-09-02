// JavaScript Document
var canvas = document.getElementById('canvas'),
            context = canvas.getContext('2d'),

            strokeStyleSelect = document.getElementById('strokeStyleSelect'),
            fillStyleSelect = document.getElementById('fillStyleSelect'),
            sidesSelect = document.getElementById('sidesSelect'),

            startAngleSelect = document.getElementById('startAngleSelect'),
            fillCheckbox = document.getElementById('fillCheckbox'),
            guidewireCheckbox = document.getElementById('guidewireCheckbox'),
            eraseAllButton = document.getElementById('eraseAllButton'),
            editCheckbox = document.getElementById('editCheckbox'),

            drawingSurfaceImageData,
            mousedown ={},
            rubberbandRect = {},

            dragging = false,
            draggingOffsetX,
            draggingOffsetY,

            filled= fillCheckbox.checked,
            sidesNum = parseInt(sidesSelect.value),
            startAngle = parseInt(startAngleSelect.value)*Math.PI, 
            guidewires = false,
            editing = false,
            polygons = [];

           
            context.strokeStyle = strokeStyleSelect.value;
            context.fillStyle = fillStyleSelect.value;

            

            drawGrid('lightgray',20,20);

            
            canvas.onmousedown = function (e){
                var loc = windowToCanvas(e.clientX,e.clientY);
                e.preventDefault();
                if(editing){ 
                    polygons.forEach(function(polygon){
                        polygon.createPath(context);
                        if(context.isPointInPath(loc.x,loc.y)){
                            startDragging(loc);
                            dragging = polygon;
                            draggingOffsetX = loc.x - polygon.x;
                            draggingOffsetY = loc.y- polygon.y;
                            return;
                        }
                    })
                }else{ 
                    startDragging(loc);
                    dragging = true;
                }
            }

            canvas.onmousemove = function(e){
                var loc = windowToCanvas(e.clientX,e.clientY);
                e.preventDefault();
                if(editing&&dragging){  
                    dragging.x = loc.x - draggingOffsetX;
                    dragging.y = loc.y - draggingOffsetY;
                    context.clearRect(0,0,canvas.width,canvas.height);
                    drawGrid('lightgray',20,20);
                    drawPolygons();
                }else{
                    if(dragging){
                        restoreDrawingSurface();
                        updateRubberband(loc,sidesNum,startAngle);
                        if(guidewires){
                            drawGuidewires(loc.x,loc.y);
                        }
                    }
                }
            }

            canvas.onmouseup = function(e){
                var loc = windowToCanvas(e.clientX,e.clientY);
                dragging = false;
                if(editing){

                }else{
                    restoreDrawingSurface();
                    updateRubberband(loc,sidesNum,startAngle);
                }
            }

            guidewireCheckbox.onchange = function(){
                guidewires = guidewireCheckbox.value;
            }
            fillStyleSelect.onchange = function(){
                context.fillStyle= fillStyleSelect.value;
            }
            strokeStyleSelect.onchange = function(){
                context.strokeStyle = strokeStyleSelect.value;
            }
            editCheckbox.onchange = function (){
                if(editCheckbox.checked){
                    startEditing();
                }else{
                    stopEditing();
                }
            }
            sidesSelect.onchange = function (){
                sidesNum = parseInt(sidesSelect.value);
            }
            startAngleSelect.onchange =function(){
                startAngle = parseInt(startAngleSelect.value)*Math.PI/180;
            }
            fillCheckbox.onchange = function(){
                filled= fillCheckbox.checked;
            }
            eraseAllButton.onclick = function (){
                context.clearRect(0,0,canvas.width,canvas.height);
                drawGrid('lightgray',20,20);
                saveDrawingSurface();
                polygons = [];
            }
           
            function drawPolygons(){
                polygons.forEach(function(polygon){
                    drawPolygon(polygon);
                })
            }
            
            function startEditing(){
                canvas.style.cursor = 'pointer';
                editing = true;
            }
            
            function stopEditing(){
                canvas.style.cursor = 'crosshair';
                editing = false;
            }
           
            function drawGuidewires(x,y){
                context.save();
                context.strokeStyle = 'rgba(0,0,180,0.4)';
                context.lineWidth = 0.5;
                drawVerticalLine(x);
                drawHorizontalLine(y);
                context.restore();
            }
          
            function drawVerticalLine(x){
                context.beginPath();
                context.moveTo(x+0.5,0);
                context.lineTo(x+0.5,context.canvas.height);
                context.stroke();
            }
           
            function drawHorizontalLine(y){
                context.beginPath();
                context.moveTo(0,y+0.5);
                context.lineTo(context.canvas.width,y+0.5);
                context.stroke();
            }
            
            function updateRubberband(loc,sidesNum,startAngle){
                updateRubberRectangle(loc);
                drawRubberbandShape(loc,sidesNum,startAngle);
            }
           
            function updateRubberRectangle(loc){
                rubberbandRect.width = Math.abs(loc.x - mousedown.x);
                rubberbandRect.height = Math.abs(loc.y - mousedown.y);
                if(loc.x>mousedown.x){
                    rubberbandRect.left = mousedown.x;
                }else{
                    rubberbandRect.left = loc.x;
                }
                if(loc.y> mousedown.y){
                    rubberbandRect.top = mousedown.y;
                }else{
                    rubberbandRect.top = loc.y;
                }
            }
           
            function drawRubberbandShape(loc,sidesNum,startAngle){
                var polygon = new Polygon(mousedown.x,
                                          mousedown.y,
                                          rubberbandRect.width,
                                          sidesNum,
                                          startAngle,
                                          context.strokeStyle,
                                          context.fillStyle,
                                          filled

                );
                drawPolygon(polygon);
                if(!dragging){
                    polygons.push(polygon);

                }

            }
            
            function drawPolygon(polygon){
                context.beginPath();
                polygon.createPath(context);
                polygon.stroke(context);
                if(polygon.filled){
                    polygon.fill(context);
                }
            }
            
            var Point = function (x,y){
                this.x = x;
                this.y = y;
            }
            
            var Polygon = function (centerX,centerY,radius,sides,startAngle,strokeStyle,fillStyle,filled){

                this.x = centerX;
                this.y = centerY;
                this.radius = radius;
                this.sides = sides;
                this.startAngle = startAngle;
                this.strokeStyle = strokeStyle;
                this.fillStyle = fillStyle;
                this.filled = filled;
            }
            
            Polygon.prototype = {
                getPoints:function(){
                    var points = [],
                        angle = this.startAngle || 0;
                    for(var i =0;i<this.sides;i++){
                        points.push(new Point(this.x+this.radius*Math.sin(angle),
                                             this.y-this.radius*Math.cos(angle)));
                        angle +=2*Math.PI/this.sides;
                    }
                    return points;
                },
                createPath:function(context){
                    var points = this.getPoints();
                    context.beginPath();
                    context.moveTo(points[0].x,points[0].y);

                    for(var i=1;i<this.sides;i++){
                        context.lineTo(points[i].x,points[i].y);
                    }
                    context.closePath();
                },
                stroke:function (context){
                    context.save();
                    this.createPath(context);
                    context.strokeStyle = this.strokeStyle;
                    context.stroke();
                    context.restore();
                },
                fill:function (context){
                    context.save();
                    this.createPath(context);
                    context.fillStyle = this.fillStyle;
                    context.fill();
                    context.restore();
                },
                move:function(x,y){
                    this.x = x;
                    this.y = y;
                }

            }
           
            function startDragging(loc){
                saveDrawingSurface();
                mousedown.x =loc.x;
                mousedown.y = loc.y;
            }
          
            function saveDrawingSurface(){
                drawingSurfaceImageData = context.getImageData(0,0,canvas.width,canvas.height);
            }
            
            function restoreDrawingSurface(){
                context.putImageData(drawingSurfaceImageData,0,0);
            }
            
            function windowToCanvas(x,y){
                var bbox = canvas.getBoundingClientRect(); 
                return {
                    x:x-bbox.left * (canvas.width/bbox.width),
                    y:y-bbox.top * (canvas.height/bbox.height)
                };
            }
           
            function drawGrid(color,stepX,stepY){
                context.save();
                context.shadowColor='rgba(230,0,0,0.9)';
                context.shadowBlur =0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.strokeStyle = color;
                context.lineWidth = 0.5;

                for(var i =stepX+0.5;i<context.canvas.width;i+=stepX){
                    context.beginPath();
                    context.moveTo(i,0);
                    context.lineTo(i,context.canvas.height);
                    context.stroke();
                };
                for(var i=stepY+0.5;i<context.canvas.height;i+=stepY){
                    context.beginPath();
                    context.moveTo(0,i);
                    context.lineTo(context.canvas.width,i);
                    context.stroke();
                }
                context.restore();
            }
