// BOTR video to play
var file = "vM7nH0Kl";
// Table to push fragments into
var grid = document.getElementById("grid");
// List with preview thumbs
var thumbnails = [];
// Latest bandwidth;
var bandwidth = 0;
// List of loaded fragments
var fragments = [];
// List of current quality levels
var levels = [];
// Position of the leftmost fragment
var starttime = 0;
// Correct for extra quickstart ping in jwp
var quickstart;
// Number of table colums to show
var columns = 8;
// Current quality level
var current = 0;


/** Setup JW Player. **/
jwplayer("player").setup({
  file: '//content.jwplatform.com/manifests/'+file+'.m3u8',
  tracks: [{
    kind: "thumbnails", file: '//content.jwplatform.com/strips/'+file+'-120.vtt' 
  }],
    autostart: true,
    width: 860,
    height: 484
});

grid.addEventListener("click",function(event) {
  var b = event.target.innerHTML.split(" ")[0];
  for(var i=0; i<levels.length; i++) {
    var d = Math.round(levels[i]['bitrate']/1024);
    if(b == d) {
      if(i == current - 1) {
        jwplayer().setCurrentQuality(0);
      } else {
        jwplayer().setCurrentQuality(i+1);
      }
      break;
    }
  }
});
/** Check if player is in Flash mode **/
jwplayer().on('ready', function(event) {
  if(jwplayer().getProvider() == "html5") {
    jwplayer().remove();
    var c = document.getElementById("container-2");
    c.innerHTML = "This demo only works in desktop browsers!";
  }
});


/** Playlist ready: load VTT thumbnails. **/
jwplayer().on('playlist', function(event) {
  starttime = 0;
  thumbnails = [];
  if(file.length == 8) {
    var r = new XMLHttpRequest();
    r.onreadystatechange = function() {
      if (r.readyState == 4 && r.status == 200) {
        var t = r.responseText.split("\n\n");
        for(var i=1; i<t.length-1; i++) {
          thumbnails.push(parse(t[i]));
        }
      }
    };
    r.open('GET','//content.jwplatform.com/strips/'+file+'-120.vtt',true);
    r.send();
  }
});
function parse(d) {
    var a = d.split("\n");
    var i = a[0].indexOf(' --> ');
    var g = a[1].substr(a[1].indexOf('=')+1).split(',');
    return {
      begin: seconds(a[0].substr(0,i)),
      end: seconds(a[0].substr(i+5)),
      left: Number(g[0]),
      top: Number(g[1])
    }
};
function seconds(s) {
  var a = s.split(':');
  return  Number(a[a.length-1]) + Number(a[a.length-2]) * 60;
};


/** Manifest loaded, quality levels broadcasted. **/
jwplayer().on('levels', function(event) {
  current = event.currentQuality;
  levels = event.levels;
  if(levels.length > 1) { levels.shift(); }
  render();
});
function render() {
  fragments = [];
  grid.innerHTML = '';
  for (var i=0; i<levels.length; i++) {
    var r = grid.insertRow(i);
    for (var j=0; j<columns; j++) {
      var c = r.insertCell();
      c.innerHTML = Math.round(levels[i].bitrate/1024)+' kbps';
      if(current > 0 && i != current-1) {
        c.style.backgroundColor = "#aab4c8";
      }
    }
  }
};


/** Fragment loaded: show thumbnail and bandwidth. **/
jwplayer().on('meta', function(event) {
  if(event.metadata.bandwidth){
    var b = Math.round(event.metadata.bandwidth/1024);
    var l = Number(event.metadata.currentLevel.substr(0,1));
    if (b != bandwidth) {
      bandwidth = b;
      if(!quickstart) {
        quickstart = true;
        return;
      }
      if(fragments.length>columns-2) { scroll(); }
      fragments.push(l);
      var c = grid.rows[l-1].cells[fragments.length-1];
      c.innerHTML = "";
      c.style.backgroundColor = "#FFF";
      if(thumbnails.length) {
        var t = find((fragments.length-1)*10+1);
        c.style.backgroundImage = 'url(//content.jwplatform.com/strips/'+file+'-120.jpg)';
        c.style.backgroundPosition = '-' + thumbnails[t].left + 'px -' + thumbnails[t].top + 'px';
        c.style.cursor = "default";
      }
      var s = String(b);
      if(s.length > 3) { s = s.substr(0,s.length-3) + "," + s.substr(-3); }
      document.getElementById("bandwidth").innerHTML = s +" kbps";
    }
  }
});
function scroll() {
  for (var i=0; i<levels.length; i++) {
    var c = grid.rows[i].insertCell(fragments.length);
    c.innerHTML = Math.round(levels[i].bitrate/1024)+' kbps';
    if(current > 0 && i != current-1) {
      c.style.backgroundColor = "#aab4c8";
    }
    grid.rows[i].deleteCell(0);
  }
  fragments.shift();
  starttime += 10;
}
function find(p) {
  for(var i=0; i<thumbnails.length; i++) {
    if (starttime + p < thumbnails[i].end) {
      return i;
    }
  }
}


/** Time updated: set position **/
jwplayer().on('time', function(event) {
  var i = Math.floor((event.position-starttime)/10);
  if(fragments.length) {
    var c = grid.rows[fragments[i]-1].cells[i];
    c.className = "play";
    var p = Math.ceil(event.position%10*5)*2;
    c.innerHTML = "<div style='width:"+p+"%'></div>";
  }
});


/** Reload grid when updating quality, seeking or completing. **/
jwplayer().on('seek', function(event) {
  starttime = Math.floor(event.offset/10)*10;
  render();
});
jwplayer().on('levelsChanged', function(event) {
  current = event.currentQuality;
  starttime = Math.floor(jwplayer().getPosition()/10)*10;
  render();
});
jwplayer().on('complete', function(event) {
  starttime = 0;
  render();
});