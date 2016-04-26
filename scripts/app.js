var app, scene, camera, renderer, controls, objectControls, plane, content, domEvents, elementMenu, elements, paramsDialog, offset, fields, activeMesh, calcDialog, resetParams, clearScene,
meshes = [], arrowLeft, arrowRight, delta = Math.PI/30, distance = 480, angle = 0, cameraMoveDuration = 400;


window.addEventListener('WebComponentsReady', function (e) {
    content = $("#content");
    elementMenu = $("#spaceElements");
    arrowLeft = $("#moveLeft");
    arrowRight = $("#moveRight");
    paramsDialog = document.getElementById("paramsDialog");
    calcDialog = document.getElementById("showCalculations");
    resetParams = $("#resetObjectParams");
    clearScene = $("#clearScene");
    fields = $("#fields");
    app = new PaperGeometry();
    init(app);
    content.find("paper-spinner").toggle();
    app.setToggleActions(scene, camera, elementMenu);
    app.checkKey(camera);
    app.setArrowActionListener(arrowLeft, arrowRight, camera);
    app.addPaperObject(scene, camera, "box", false);
    $("#calculate").click(function() {
        app.showCalculationsResult();
    });
    clearScene.click(function () {
        app.clearScene();
    });
    resetParams.click(function() {
        app.resetObjectsParams();
    });

});

function init(app) {
    
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    camera = new THREE.PerspectiveCamera(60, content.width()/($(document).height()-$("#toolbar-main").height()), 0.1, 1000 );
    
    renderer.setSize(content.width(), $(document).height()-$("#toolbar-main").height());
    renderer.setClearColor(0xffffff, 0);
    content.append(renderer.domElement);

    domEvents = new THREEx.DomEvents(camera, renderer.domElement);
    
    THREEx.WindowResize(renderer, camera);
    
    /*Работа с областью пространства*/
    scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );
    var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    camera.position.x = 0;
    camera.position.y = 5;
    camera.position.z = distance;

    render();

    function render() {
        renderer.render(scene, camera);

        requestAnimationFrame(render);

        // Code
        for(var i=0; i<scene.children.length; i++ )
            scene.children[i].rotation.y += .02;

        camera.lookAt(new THREE.Vector3(0,0,0));
        TWEEN.update();
    }
}

function PaperGeometry() { //

    this.basicTypes = [ "box", "sphere", "pyramid", "cylinder", "prism", "torus" ];

    this.defaultParams = {

        box: {
            width: 10,
            height: 10,
            depth: 10
        },

        sphere: {
            radius: 5,
        },

        pyramid: {
            baseRadius: 4,
            sides: 3,
            height: 9
        },

        cylinder: {
            baseRadius: 5,
            height: 10
        },

        prism: {
            baseRadius: 4,
            sides: 3,
            height: 9
        },

        torus: {
            radius: 6,
            tube: 2,
        }

    };
    
    this.corr = {
        width: "Ширина",
        height: "Высота",
        depth: "Длина",
        height: "Высота",
        radius: "Радиус",
        tube: "Радиус_трубы",
        baseRadius: "Радиус_основания",
        sides: "Кол-во_боковых_граней"
    };

    this.setToggleActions = function(scene, camera, list) {
        var parent = this;
        list.find("paper-item").each(function() {
            $(this).click(function() {
                parent.addPaperObject(scene, camera, $(this).attr("geo-id"), true);
            });
        });
    }

    this.setArrowActionListener = function(arrowLeft, arrowRight, camera) {
        var parent = this;
        arrowLeft.click(function() {
            parent.moveCamera(camera, "left");
        });
        arrowRight.click(function() {
            parent.moveCamera(camera, "right");
        });
    }
    
    this.updateArrows = function() {
        var pos = this.getCameraPos();
        console.log(pos);
        activeMesh = meshes[pos];
        if(meshes[pos-1]) arrowLeft.fadeIn();
        else arrowLeft.fadeOut();
        if(meshes[pos+1]) arrowRight.fadeIn();
        else arrowRight.fadeOut();
    }

    this.addPaperObject = function(scene, camera, type, rotate, params) {
        params = params || this.defaultParams[type];
        var mesh = this.getObjectMesh(type, params);
        this.makeCorrections(mesh);
        this.setActionsListener(mesh);
        meshes.push(mesh);
        scene.add(mesh);
        /**/
        /**/
        if(rotate)
            //while(meshes[this.getCameraPos()])
                this.moveCamera(camera, "right");
        var parent = this;
        this.createOutline(mesh);
        setTimeout(function() {
            parent.setMeshPosition(mesh, camera, params);
            parent.revealByScale(mesh);
        }, cameraMoveDuration+50);
    }

    this.getObjectMesh = function(type, params) {
        var color = this.getFlatColor(),
            geometry = this.getObjectGeometry(type, params),
            material = new THREE.MeshStandardMaterial( {
            color: color,
            roughness: 0.5,
            metalness: 0,
            shading: THREE.FlatShading
        });
        var mesh =  new THREE.Mesh(geometry, material);
        mesh.visible = false;
        mesh.typeName = type;
        mesh.params = params;
        return mesh;
    }
    
    this.getFlatColor = function() {
        return new THREE.Color().setHSL( Math.random(), 1, 0.75 )
    }

    this.createOutline = function(mesh) {
        var sMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide }),
            sGeometry = this.getObjectGeometry(mesh.typeName, mesh.params),
            sMesh = new THREE.Mesh(sGeometry, sMaterial);
        sMesh.visible = false;
        sMesh.scale.multiplyScalar(1.05);
        mesh.outline = sMesh;
        mesh.add(sMesh);
    }

    this.toggleOutline = function(mesh, mode) {
        if(mode == 1)
            mesh.outline.visible = true;
        else
            mesh.outline.visible = false;
    }

    this.setActionsListener = function(mesh) {
        var parent = this;
        domEvents.addEventListener(mesh, "click", function(e) {
            parent.showMeshSettings(mesh);
        }, false);
        domEvents.addEventListener(mesh, "mouseover", function() {
            content.css("cursor", "pointer");
            parent.toggleOutline(mesh, 1);
        }, false);
        domEvents.addEventListener(mesh, "mouseout", function() {
            content.css("cursor", "default");
            parent.toggleOutline(mesh, 0);
        }, false);
    }

    this.showMeshSettings = function(mesh) {
        var newParams, parent = this;
        //activeMesh = mesh;
        fields.empty();
        for(var key in mesh.params) {
            fields.append("<paper-input label="+this.corr[key]+" data-target="+key+"></paper-input>");
        }
        $("#paramsDialog paper-button[dialog-confirm]").click(function() {
            newParams = parent.collectParams(mesh.params);
            parent.updateMeshParams(mesh, newParams);
        });
        paramsDialog.toggle();
    }
    
    this.collectParams = function(oldParams) {
        var b = false, params = {}, key, value;
        fields.find("paper-input").each(function() {
            key = $(this).attr("data-target");
            value = $(this).find("input").val();
            if(value === "") params[key] = oldParams[key];
            else params[key] = parseInt(value, 10);
        });
        //console.log(params);
        return params;
    }
    
    this.updateMeshParams = function(mesh, params) {
        var newGeometry = this.getObjectGeometry(mesh.typeName, params);
        mesh.params = params;
        mesh.geometry.dynamic = true;
        mesh.geometry = newGeometry;  
        mesh.geometry.verticesNeedUpdate = true;
        mesh.remove(mesh.outline);
        this.createOutline(mesh);
        console.log(mesh.params);
        return;
    }

    this.setMeshPosition = function(mesh, camera, params) {
        mesh.position.z = camera.position.z*0.94;
        mesh.position.x = camera.position.x*0.94;
    }

    this.getObjectGeometry = function(type, params) {
        var geometry;
        switch(type) {
            case "box": {
                geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
            }; break;
            case "sphere": {
                geometry = new THREE.SphereGeometry(params.radius, 80, 80);
            }; break;
            case "pyramid": {
                geometry = new THREE.CylinderGeometry(0, params.baseRadius, params.height, params.sides, false);
            }; break;
            case "cylinder": {
                geometry = new THREE.CylinderGeometry(params.baseRadius, params.baseRadius, params.height, 100);
            }; break;
            case "prism": {
                geometry = new THREE.CylinderGeometry(params.baseRadius, params.baseRadius, params.height, params.sides);
            }; break;
            case "torus": {
                geometry = new THREE.TorusGeometry(params.radius, params.tube, 65, 85);
            }; break;
        }
        return geometry;
    }
    
    this.revealByScale = function(mesh) {
        var sc1 = { scale: 0 }, sc2 = { scale: 1.3 };
        var tween1 = new TWEEN.Tween( sc1 ).to( sc2, 200 ).onUpdate(function(){
            if(!mesh.visible) mesh.visible = true;
            mesh.scale.set(sc1.scale, sc1.scale, sc1.scale);
        }),
        tween2 = new TWEEN.Tween(sc2).to( { scale: 1 }, 150 ).onUpdate(function() {
            mesh.scale.set(sc2.scale, sc2.scale, sc2.scale);
        });
        tween1.chain(tween2);
        tween1.start();
    }
    
    this.hideByScale = function(mesh) {
        var sc1 = { scale: 1 }, sc2 = { scale: 1.3 };
        var tween1 = new TWEEN.Tween( sc1 ).to( sc2, 200 ).onUpdate(function(){
            if(!mesh.visible) mesh.visible = true;
            mesh.scale.set(sc1.scale, sc1.scale, sc1.scale);
        }),
        tween2 = new TWEEN.Tween(sc2).to( { scale: .05 }, 150 ).onUpdate(function() {
            mesh.scale.set(sc2.scale, sc2.scale, sc2.scale);
        });
        tween1.chain(tween2);
        tween1.start();
    }

    this.typeExists = function(type) {
        return this.basicTypes.indexOf(type) >= 0;
    }

    this.makeCorrections = function(mesh) {
        if(mesh.typeName === "torus") mesh.rotation.x -= Math.PI/2;
    }

    this.calculateParam = function(mesh, param) {
        var result= 0 , units;
        if(param === "volume") {
            units = " единиц кубичских";
            switch(mesh.typeName) {
                case "box": {
                    result = mesh.params.width*mesh.params.height*mesh.params.depth;
                }; break;
                case "sphere": {
                    result = .75*Math.PI*Math.pow(mesh.params.radius, 3);
                }; break;
                case "pyramid": {
                    result = this.getTriangleAreaByRadius(mesh.params.baseRadius)*mesh.params.height/3;
                }; break;
                case "cylinder": {
                    result = Math.PI*Math.pow(mesh.params.baseRadius, 2)*mesh.params.height;
                }; break;
                case "prism": {
                    result = this.getTriangleAreaByRadius(mesh.params.baseRadius)*mesh.params.height;
                }; break;
                case "torus": {
                    result = 2*Math.pow(Math.PI*mesh.params.tube, 2)*mesh.params.radius;
                }; break;
            }
        }
        else if(param === "area") {
            units = " единиц квадратных";
            switch(mesh.typeName) {
                case "box": {
                    result = 2*(mesh.params.width*mesh.params.height + mesh.params.height*mesh.params.depth + mesh.params.width*mesh.params.depth);
                }; break;
                case "sphere": {
                    result = 4*Math.PI*Math.pow(mesh.params.radius, 2);
                }; break;
                case "pyramid": {
                    result = this.getTriangleAreaByRadius(mesh.params.baseRadius) + .5*Math.sqrt( Math.pow(.5*mesh.params.baseRadius, 2)
                    + Math.pow(mesh.params.height, 2) )*Math.sin(Math.PI/6)*mesh.params.baseRadius*mesh.params.sides;
                }; break;
                case "cylinder": {
                    result = 2*(Math.PI*Math.pow(mesh.params.baseRadius, 2) +                       
                             Math.PI*mesh.params.baseRadius*mesh.params.height);
                }; break;
                case "prism": {
                    result = 2*this.getTriangleAreaByRadius(mesh.params.baseRadius) +
                             mesh.params.sides*this.getBaseSideByRadius(mesh.params.baseRadius)*mesh.params.height;
                }; break;
                case "torus": {
                    result = 4*Math.pow(Math.PI, 2)*mesh.params.radius*mesh.params.tube;
                }; break;
            }
        }
        else this.throwAppError("03");
        return Math.round(result*100)/100+units;
    }

    this.getTriangleAreaByRadius = function(radius) {
        return .75*Math.tan(Math.PI/3)*Math.pow(radius, 2);
    }
    
    this.getBaseSideByRadius = function(radius) {
        return Math.tan(Math.PI/3)*radius;
    }
    
    this.showCalculationsResult = function() {
        var pos = this.getCameraPos();
        $("#area").html("<b>Площадь поверхности:</b> "+this.calculateParam(meshes[pos], "area"));
        $("#volume").html("<b>Объём:</b> "+this.calculateParam(meshes[pos], "volume"));
        calcDialog.toggle();
    }


    this.checkKey = function(camera, e) {

        var parent = this;

        function onKeyDown(e) {
            e = e || window.event;
            if (e.keyCode == '37') {
               parent.moveCamera(camera, "left");
            }
            else if (e.keyCode == '39') {
               parent.moveCamera(camera, "right");
            }
        }
        document.addEventListener("keydown", onKeyDown, false);

    }

    this.getCameraPos = function() {
        return Math.ceil(angle/delta);
    }

    this.moveCamera = function(camera, mode) {
        var modeExists = (mode === "left") || (mode === "right"), endPosition = {}, parent = this;

        if(modeExists) {
            var parent = this;
            if(delta === 2*Math.PI) delta = 0;
            if(mode === "left") {
                if(!meshes[this.getCameraPos()-1]) return false;
                angle -= delta;
            }
            else {
                if(!meshes[this.getCameraPos()+1]) return false;
                angle += delta;
            }

            var startPosition = {
                x: camera.position.x,
                z: camera.position.z
            },
            endPosition = {
                x: distance*Math.sin(angle),
                z: distance*Math.cos(angle)
            }
            var tween = new TWEEN.Tween(startPosition).easing(TWEEN.Easing.Quadratic.In)
            .to(endPosition, cameraMoveDuration).onUpdate(function(){
                camera.position.x = startPosition.x;
                camera.position.z = startPosition.z;
            }).onComplete(function() {
                parent.updateArrows();
            }).start();
        }
        else {
            this.throwAppError("04");
            return 0;
        }

    }
    
    this.clearScene = function() {
        var parent = this;
        meshes.forEach(function(item){
            parent.hideByScale(item);
            setTimeout(function() {
                scene.remove(item);
                meshes.shift();
                angle = 0;
                camera.position.set(0, camera.position.y, distance);
                parent.updateArrows();
                console.log(meshes);
            }, cameraMoveDuration+50);
        });
    }
    
    this.resetObjectsParams = function() {
        var parent = this;
        var n = scene.children.length;
        for(var i=0; i<n; i++)
            this.resetObjectParams(scene.children[i]);
    }
    
    this.resetObjectParams = function(mesh) {
        //if(this.typeExists(mesh.typeName))
        this.updateMeshParams(mesh, this.defaultParams[mesh.typeName]);
        //else this.throwAppError("02");
    }

    this.throwAppError = function(errCode, custom) {
        var toast = document.getElementById("toast");
        if(custom)
            toast.setAttribute("text", errCode);
        else
            toast.setAttribute("text", this.errors[errCode]);
        toast.open();
        return 0;
    }

    this.errors = {
        "01": "Ошибка при инициализации приложения.",
        "02": "Выбранный объект не может быть построен, так как не существует в системе.",
        "03": "Не удается провести вычисления. Попробуйте заново",
        "04": "Неизвестное направление поворота камеры"
    }

}
