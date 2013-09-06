var socket = io.connect('/');

var $ = function (id) {
    return document.getElementById(id)
};

if (!document.location.hash) {
    document.location.hash = '#' + randomDocName();
}
var docname = 'hex:' + document.location.hash.slice(1);

var canvas = new fabric.Canvas('c', {
    isDrawingMode: true
});

var $state,
canvasObjects = canvas.toJSON();
canvasObjects.objects = canvas._objects;
sharejs.open(docname, 'json', function(error, doc) {
    $state = doc;
    doc.on('change', function (op) {
        stateUpdated(op);
    });
    if (doc.created) {
        // Newly created
        canvas.clear();
        $state.set(canvasObjects);
    } else {
        // Retrieved doc
        stateUpdated();
    }
});

canvas.on('path:created', function(e) {
	console.log({path_created: e.path.toObject()});
	$state.submitOp({
		p: ['objects', canvasObjects.length],
    	li: e.path.toObject()
	});
});

var selectedObject, originIndex, originIndexes = [];
canvas.on('object:modified', function(e) {
	if (e.target.type === "path") {
		console.log(originIndex);
		selectedObject = e.target.toObject();
		console.log(selectedObject);
		$state.submitOp({
			p: ['objects', originIndex],
			ld: canvasObjects.objects[originIndex],
			li: selectedObject
		});
	} else if (e.target.type === "group") {
		console.log(e.target);
		canvas.discardActiveGroup();
		var updateObjects = [];
		originIndexes.forEach(function(index, i) {
			console.log({path:canvas.getObjects()[index].toObject()});
			updateObjects.push({
				index: index,
				object: canvas.getObjects()[index].toObject()
			});
		});
		updateObjects.forEach(function(uo) {
			$state.submitOp({
				p: ['objects', uo.index],
				ld: canvasObjects.objects[uo.index],
				li: uo.object
			});
		});
		console.log(updateObjects);
	}
});

canvas.on('object:selected', function(e) {
	originIndex = Array.indexOf(canvasObjects.objects, e.target.toObject());
	console.log(e.target.toObject());
});

canvas.on('selection:created', function(e) {
	originIndexes = [];
	console.log(e);
	var originalStates = e.target.objects
	var group = e.target.getObjects();
	console.log(group);
	for (var i = 0; i < group.length; i++) {
		var obj = group[i].toObject();
		obj.left = group[i].originalState.left;
		obj.top = group[i].originalState.top;
		obj.hasControls = true;
		console.log(obj);
		originIndexes.push(Array.indexOf(canvasObjects.objects, obj));
	}
	console.log(originIndexes);
});

var drawingModeEl = $('drawing-mode'),
eraseModeEl = $('erase-mode'),
undoEl = $('undo'),
redoEl = $('redo'),
drawingOptionsEl = $('drawing-mode-options'),
drawingColorEl = $('drawing-color'),
drawingShadowColorEl = $('drawing-shadow-color'),
drawingLineWidthEl = $('drawing-line-width'),
drawingShadowWidth = $('drawing-shadow-width'),
drawingShadowOffset = $('drawing-shadow-offset'),
clearEl = $('clear-canvas');

clearEl.onclick = function () {
    canvas.clear();
};

drawingModeEl.onclick = function () {
    canvas.isDrawingMode = !canvas.isDrawingMode;
    if (canvas.isDrawingMode) {
        drawingModeEl.innerHTML = 'Cancel drawing mode';
        eraseModeEl.innerHTML = 'Enter erase mode';
        drawingOptionsEl.style.display = '';
    } else {
        drawingModeEl.innerHTML = 'Enter drawing mode';
        eraseModeEl.innerHTML = 'Enter erase mode';
        drawingOptionsEl.style.display = 'none';
    }
};

if (fabric.PatternBrush) {
    var vLinePatternBrush = new fabric.PatternBrush(canvas);
    vLinePatternBrush.getPatternSrc = function () {

        var patternCanvas = fabric.document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = 10;
        var ctx = patternCanvas.getContext('2d');

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.stroke();

        return patternCanvas;
    };

    var hLinePatternBrush = new fabric.PatternBrush(canvas);
    hLinePatternBrush.getPatternSrc = function () {

        var patternCanvas = fabric.document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = 10;
        var ctx = patternCanvas.getContext('2d');

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.stroke();

        return patternCanvas;
    };

    var squarePatternBrush = new fabric.PatternBrush(canvas);
    squarePatternBrush.getPatternSrc = function () {

        var squareWidth = 10,
        squareDistance = 2;

        var patternCanvas = fabric.document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
        var ctx = patternCanvas.getContext('2d');

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, squareWidth, squareWidth);

        return patternCanvas;
    };

    var diamondPatternBrush = new fabric.PatternBrush(canvas);
    diamondPatternBrush.getPatternSrc = function () {

        var squareWidth = 10,
        squareDistance = 5;
        var patternCanvas = fabric.document.createElement('canvas');
        var rect = new fabric.Rect({
            width: squareWidth,
            height: squareWidth,
            angle: 45,
            fill: this.color
        });

        var canvasWidth = rect.getBoundingRectWidth();

        patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance;
        rect.set({
            left: canvasWidth / 2,
            top: canvasWidth / 2
        });

        var ctx = patternCanvas.getContext('2d');
        rect.render(ctx);

        return patternCanvas;
    };

    var img = new Image();
    img.src = './images/honey_im_subtle.png';

    var texturePatternBrush = new fabric.PatternBrush(canvas);
    texturePatternBrush.source = img;
}

$('drawing-mode-selector').onchange = function () {

    if (this.value === 'hline') {
        canvas.freeDrawingBrush = vLinePatternBrush;
    } else if (this.value === 'vline') {
        canvas.freeDrawingBrush = hLinePatternBrush;
    } else if (this.value === 'square') {
        canvas.freeDrawingBrush = squarePatternBrush;
    } else if (this.value === 'diamond') {
        canvas.freeDrawingBrush = diamondPatternBrush;
    } else if (this.value === 'texture') {
        canvas.freeDrawingBrush = texturePatternBrush;
    } else {
        canvas.freeDrawingBrush = new fabric[this.value + 'Brush'](canvas);
    }

    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = drawingColorEl.value;
        canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
        canvas.freeDrawingBrush.shadowBlur = parseInt(drawingShadowWidth.value, 10) || 0;
    }
};

drawingColorEl.onchange = function () {
    canvas.freeDrawingBrush.color = this.value;
};
drawingShadowColorEl.onchange = function () {
    canvas.freeDrawingBrush.shadowColor = this.value;
};
drawingLineWidthEl.onchange = function () {
    canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
    this.previousSibling.innerHTML = this.value;
};
drawingShadowWidth.onchange = function () {
    canvas.freeDrawingBrush.shadowBlur = parseInt(this.value, 10) || 0;
    this.previousSibling.innerHTML = this.value;
};
drawingShadowOffset.onchange = function () {
    canvas.freeDrawingBrush.shadowOffsetX = canvas.freeDrawingBrush.shadowOffsetY = parseInt(this.value, 10) || 0;
    this.previousSibling.innerHTML = this.value;
};

if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = drawingColorEl.value;
    canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
    canvas.freeDrawingBrush.shadowBlur = 0;
}

if (!document.location.hash) {
    document.location.hash = '#' + randomDocName();
}
var docname = 'hex:' + document.location.hash.slice(1)

function randomDocName(length) {
    var chars, x;
    if (length == null) {
        length = 10;
    }
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-=";
    var name = [];
    for (x = 0; x < length; x++) {
        name.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return name.join('');
}

function stateUpdated(op) {
	if (op) {
		op.forEach(function (c) {
			if (c.p[0] == 'objects' && c.li) {
				canvasObjects.objects.push(c.li);
				originIndex++;
				originIndexes.forEach(function(index) {
					index++;
				});
			} else if (c.p[0] == 'objects' && c.ld) {
				canvasObjects.objects.splice(originIndex, 1);
				originIndex--;
				originIndexes.forEach(function(index) {
					index--;
				});
			}
		})
	} else {
		// first run
	}
	canvasObjects = $state.snapshot;
	canvas.loadFromJSON(canvasObjects, function() {
		canvas.renderAll();
	});
}

Object.equals = function( x, y ) {
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}

Array.indexOf = function(arr, x) {
	var index = -1;
	arr.forEach(function(object, i) {
		if (Object.equals(object, x)) {
			index = i;
		}
	});
	return index;
}