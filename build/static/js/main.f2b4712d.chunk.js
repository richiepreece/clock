(this.webpackJsonpclock=this.webpackJsonpclock||[]).push([[0],{24:function(e,t,a){e.exports=a(32)},31:function(e,t,a){},32:function(e,t,a){"use strict";a.r(t);var o=a(0),c=a.n(o),n=a(19),r=a.n(n),l=a(9);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var i=a(3),s=a(5),m=a.n(s),u=a(4);function h(e){var t=Object(o.useState)(!1),a=Object(u.a)(t,2),n=a[0],r=a[1],s=Object(o.useState)(1.5),h=Object(u.a)(s,2),f=h[0],g=h[1],E=Object(o.useRef)(),p=Object(o.useRef)();return Object(l.b)((function(){var t=.024*(1e3*m()().seconds()+m()().milliseconds())%360;if(E.current.rotation.y=i.MathUtils.degToRad(t),p.current){p.current.rotation.y=i.MathUtils.degToRad(t);var a=60*m()().minutes()*1e3+1e3*m()().seconds()+m()().milliseconds();g(1.5-a/36e5*1.5)}(!n&&m()().hour()%12===e.oclock||n&&m()().hour()%12!==e.oclock)&&r(m()().hour()%12===e.oclock)})),c.a.createElement(c.a.Fragment,null,c.a.createElement("mesh",Object.assign({},e,{ref:E}),c.a.createElement("cylinderBufferGeometry",{attach:"geometry",args:[.15,.15,1.5,6]}),c.a.createElement("meshPhongMaterial",{attach:"material",color:new i.Color("#1e4985"),roughness:.1,metalness:0,reflectivity:1,transparent:!0,opacity:.5})),n&&c.a.createElement("mesh",Object.assign({},e,{ref:p}),c.a.createElement("cylinderBufferGeometry",{attach:"geometry",args:[.16,.16,f,6]}),c.a.createElement("meshPhongMaterial",{attach:"material",color:"white",roughness:.1,metalness:0,reflectivity:1,transparent:!0,opacity:.5})))}var f=function(e){var t=Object(o.useRef)(),a=30*-e.oclock;return c.a.createElement("mesh",Object.assign({},e,{ref:t,rotation:[0,0,i.MathUtils.degToRad(a)]}),c.a.createElement(h,{full:e.full,oclock:e.oclock}))},g=function(e){var t=Object(o.useRef)();return Object(l.b)((function(){var e=.006*-(1e3*m()().seconds()+m()().milliseconds());t.current.rotation.y=i.MathUtils.degToRad(e)})),c.a.createElement("mesh",Object.assign({},e,{ref:t}),c.a.createElement("circleBufferGeometry",{attach:"geometry",args:[3.5,100]}),c.a.createElement("meshPhongMaterial",{attach:"material",color:new i.Color("#1e4985"),roughness:.1,metalness:0,reflectivity:1,transparent:!0,opacity:.5}),c.a.createElement(f,{position:[1,2,0],oclock:1}),c.a.createElement(f,{position:[2,1,0],oclock:2}),c.a.createElement(f,{position:[2,0,0],oclock:3}),c.a.createElement(f,{position:[2,-1,0],oclock:4}),c.a.createElement(f,{position:[1,-2,0],oclock:5}),c.a.createElement(f,{position:[0,-2,0],oclock:6}),c.a.createElement(f,{position:[-1,-2,0],oclock:7}),c.a.createElement(f,{position:[-2,-1,0],oclock:8}),c.a.createElement(f,{position:[-2,0,0],oclock:9}),c.a.createElement(f,{position:[-2,1,0],oclock:10}),c.a.createElement(f,{position:[-1,2,0],oclock:11}),c.a.createElement(f,{position:[0,2,0],oclock:0}))},E=function(e){var t=Object(o.useRef)();return c.a.createElement("mesh",Object.assign({},e,{ref:t}),c.a.createElement("circleBufferGeometry",{attach:"geometry",args:[3.5,100]}),c.a.createElement("meshPhongMaterial",{attach:"material",color:new i.Color("#1e4985"),roughness:.1,metalness:0,reflectivity:1,transparent:!0,opacity:.5}),c.a.createElement(g,{position:[0,0,0]}))};a(31);r.a.render(c.a.createElement(l.a,null,c.a.createElement("ambientLight",null),c.a.createElement("pointLight",{position:[-10,0,10]}),c.a.createElement(E,{position:[0,0,0]})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[24,1,2]]]);
//# sourceMappingURL=main.f2b4712d.chunk.js.map